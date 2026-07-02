#!/usr/bin/env sh
# Install Traefik route via Docker labels (primary) and dynamic file (fallback).
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
TRAEFIK_DIR="${TRAEFIK_DIR:-/docker/traefik}"
DOMAIN="${DOMAIN:-modernitygate.com}"
CERT_RESOLVER="${CERT_RESOLVER:-letsencrypt}"

TRAEFIK_CID=$(docker ps -q --filter "name=traefik" | head -1)
if [ -z "$TRAEFIK_CID" ]; then
  echo "Traefik container not running"
  exit 1
fi

if [ ! -d "$TRAEFIK_DIR" ]; then
  TRAEFIK_DIR=$(docker inspect "$TRAEFIK_CID" --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null || true)
fi

TRAEFIK_NET=$(docker inspect "$TRAEFIK_CID" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' | head -1)
NETMODE=$(docker inspect "$TRAEFIK_CID" --format '{{.HostConfig.NetworkMode}}' 2>/dev/null || true)

# Detect cert resolver name from Traefik static config if present
if [ -d "$TRAEFIK_DIR" ]; then
  FOUND=$(grep -rhoE 'certResolver:\s*[a-zA-Z0-9_.-]+' "$TRAEFIK_DIR" 2>/dev/null | awk '{print $2}' | head -1 || true)
  [ -n "$FOUND" ] && CERT_RESOLVER="$FOUND"
fi

echo "Traefik network: ${TRAEFIK_NET:-none} (mode=$NETMODE)"
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
      - traefik.http.routers.modernitygate-http.rule=Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)
      - traefik.http.routers.modernitygate-http.entrypoints=web
      - traefik.http.routers.modernitygate-http.service=modernitygate
      - traefik.http.routers.modernitygate.rule=Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)
      - traefik.http.routers.modernitygate.entrypoints=websecure
      - traefik.http.routers.modernitygate.tls=true
      - traefik.http.routers.modernitygate.tls.certresolver=${CERT_RESOLVER}
      - traefik.http.routers.modernitygate.service=modernitygate
      - traefik.http.services.modernitygate.loadbalancer.server.port=9000
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
      - traefik.http.routers.modernitygate-http.rule=Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)
      - traefik.http.routers.modernitygate-http.entrypoints=web
      - traefik.http.routers.modernitygate-http.service=modernitygate
      - traefik.http.routers.modernitygate.rule=Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)
      - traefik.http.routers.modernitygate.entrypoints=websecure
      - traefik.http.routers.modernitygate.tls=true
      - traefik.http.routers.modernitygate.tls.certresolver=${CERT_RESOLVER}
      - traefik.http.routers.modernitygate.service=modernitygate
      - traefik.http.services.modernitygate.loadbalancer.server.port=9000
EOF
  echo "Wrote docker-compose.traefik-net.yml (Docker labels, host Traefik)"
fi

# Fallback: dynamic file on Traefik volume mounts
ROUTE_FILE="$APP_DIR/deploy/traefik/modernitygate.generated.yml"
sh "$APP_DIR/scripts/write-traefik-route.sh" "$ROUTE_FILE"

mkdir -p "$TRAEFIK_DIR/etc/traefik/dynamic" 2>/dev/null || true

INSTALLED=""
for dir in \
  "$TRAEFIK_DIR/etc/traefik/dynamic" \
  "$TRAEFIK_DIR/dynamic"; do
  if [ -d "$dir" ]; then
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
