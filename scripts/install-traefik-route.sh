#!/usr/bin/env sh
# Install Traefik route via Docker labels (primary) and dynamic file (fallback).
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
TRAEFIK_DIR="${TRAEFIK_DIR:-/docker/traefik}"
DOMAIN="${DOMAIN:-modernitygate.com}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/traefik-detect-env.sh"

CERT_RESOLVER="${CERT_RESOLVER:-$TRAEFIK_CERT_RESOLVER}"
HTTPS_ENTRYPOINT="${HTTPS_ENTRYPOINT:-$TRAEFIK_HTTPS_ENTRYPOINT}"

TRAEFIK_CID=$(docker ps -q --filter "name=traefik" | head -1)
if [ -z "$TRAEFIK_CID" ]; then
  echo "Traefik container not running — using host-network defaults"
  NETMODE=host
  TRAEFIK_NET=""
else
  if [ ! -d "$TRAEFIK_DIR" ]; then
    TRAEFIK_DIR=$(docker inspect "$TRAEFIK_CID" --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null || true)
  fi
  TRAEFIK_NET=$(docker inspect "$TRAEFIK_CID" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' | head -1)
  NETMODE=$(docker inspect "$TRAEFIK_CID" --format '{{.HostConfig.NetworkMode}}' 2>/dev/null || true)
fi

# Detect cert resolver name from Traefik static config if present
if [ -d "$TRAEFIK_DIR" ] && [ "$CERT_RESOLVER" = "letsencrypt" ]; then
  FOUND=$(grep -rhoE 'certResolver:\s*[a-zA-Z0-9_.-]+' "$TRAEFIK_DIR" 2>/dev/null | awk '{print $2}' | head -1 || true)
  if [ -z "$FOUND" ]; then
    FOUND=$(grep -A20 'certificatesResolvers:' "$TRAEFIK_DIR"/traefik.yml "$TRAEFIK_DIR"/traefik.yaml 2>/dev/null \
      | grep -E '^[[:space:]]+[a-zA-Z0-9_.-]+:' | head -1 | sed 's/[: ].*//;s/^[[:space:]]*//')
  fi
  [ -n "$FOUND" ] && CERT_RESOLVER="$FOUND"
fi

TLS_DOMAIN_LABELS="
      - traefik.http.routers.modernitygate.tls.domains[0].main=${DOMAIN}
      - traefik.http.routers.modernitygate.tls.domains[0].sans=www.${DOMAIN}"

NETWORK_LABEL=""
if [ -n "$TRAEFIK_NET" ] && [ "$NETMODE" != "host" ]; then
  NETWORK_LABEL="
      - traefik.docker.network=${TRAEFIK_NET}"
fi

echo "Traefik network: ${TRAEFIK_NET:-none} (mode=$NETMODE)"
echo "HTTPS entrypoint: $HTTPS_ENTRYPOINT"
echo "Cert resolver: $CERT_RESOLVER"

# Docker labels — works with Traefik docker provider (Hostinger default)
if [ -n "$TRAEFIK_NET" ] && [ "$NETMODE" != "host" ]; then
  cat > "$APP_DIR/docker-compose.traefik-net.yml" <<EOF
services:
  app:
    ports: !reset []
    networks:
      - traefik
    labels:
      - traefik.enable=true
      - traefik.http.routers.modernitygate.rule=Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)
      - traefik.http.routers.modernitygate.entrypoints=${HTTPS_ENTRYPOINT}
      - traefik.http.routers.modernitygate.tls=true
      - traefik.http.routers.modernitygate.tls.certresolver=${CERT_RESOLVER}
${TLS_DOMAIN_LABELS}
      - traefik.http.routers.modernitygate.service=modernitygate
      - traefik.http.services.modernitygate.loadbalancer.server.port=9000${NETWORK_LABEL}
networks:
  traefik:
    external: true
    name: ${TRAEFIK_NET}
EOF
  echo "Wrote docker-compose.traefik-net.yml (Docker labels)"
else
  # Host-network Traefik still discovers containers via Docker socket
  cat > "$APP_DIR/docker-compose.traefik-net.yml" <<EOF
services:
  app:
    labels:
      - traefik.enable=true
      - traefik.http.routers.modernitygate.rule=Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)
      - traefik.http.routers.modernitygate.entrypoints=${HTTPS_ENTRYPOINT}
      - traefik.http.routers.modernitygate.tls=true
      - traefik.http.routers.modernitygate.tls.certresolver=${CERT_RESOLVER}
${TLS_DOMAIN_LABELS}
      - traefik.http.routers.modernitygate.service=modernitygate
      - traefik.http.services.modernitygate.loadbalancer.server.port=9000${NETWORK_LABEL}
EOF
  echo "Wrote docker-compose.traefik-net.yml (Docker labels, host Traefik)"
fi

# Fallback: dynamic file on Traefik volume mounts
ROUTE_FILE="$APP_DIR/deploy/traefik/modernitygate.generated.yml"
sh "$APP_DIR/scripts/write-traefik-route.sh" "$ROUTE_FILE"

mkdir -p "$TRAEFIK_DIR/etc/traefik/dynamic" 2>/dev/null || true

INSTALLED=""
for dir in \
  "$TRAEFIK_DIR/dynamic" \
  "$TRAEFIK_DIR/data/dynamic" \
  "$TRAEFIK_DIR/config/dynamic" \
  "$TRAEFIK_DIR/etc/traefik/dynamic"; do
  if [ -d "$dir" ] || mkdir -p "$dir" 2>/dev/null; then
    cp "$ROUTE_FILE" "$dir/modernitygate.yml"
    echo "Dynamic file: $dir/modernitygate.yml"
    INSTALLED=1
  fi
done

docker inspect "$TRAEFIK_CID" --format '{{range .Mounts}}{{.Source}} {{.Destination}}{{"\n"}}{{end}}' 2>/dev/null \
  | while read -r host dest; do
      case "$dest" in
        */dynamic|*/dynamic/*|*/conf.d|*/conf.d/*)
          mkdir -p "$host"
          cp "$ROUTE_FILE" "$host/modernitygate.yml"
          echo "Dynamic file via mount: $host/modernitygate.yml"
          INSTALLED=1
          ;;
      esac
    done

[ -n "$INSTALLED" ] || echo "No dynamic directory found (Docker labels should be enough)"

if [ -n "$INSTALLED" ] && [ -n "$TRAEFIK_CID" ]; then
  echo "Restarting Traefik to load routes..."
  docker restart "$TRAEFIK_CID" 2>/dev/null || true
fi
