#!/usr/bin/env sh
# Write Traefik dynamic route with correct backend URL and Let's Encrypt resolver.
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
DOMAIN="${DOMAIN:-modernitygate.com}"
CERT_RESOLVER="${CERT_RESOLVER:-letsencrypt}"
OUT="${1:-$APP_DIR/deploy/traefik/modernitygate.generated.yml}"

detect_backend() {
  TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)

  if [ -n "$TRAEFIK_CID" ]; then
    NETMODE=$(docker inspect "$TRAEFIK_CID" --format '{{.HostConfig.NetworkMode}}' 2>/dev/null || true)
    if [ "$NETMODE" = "host" ]; then
      echo "http://127.0.0.1:9000"
      return
    fi

    if docker inspect modernity-gate >/dev/null 2>&1; then
      TRAEFIK_NET=$(docker inspect "$TRAEFIK_CID" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' | head -1)
      if [ -n "$TRAEFIK_NET" ] && docker inspect modernity-gate --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' | grep -qx "$TRAEFIK_NET"; then
        echo "http://modernity-gate:9000"
        return
      fi
    fi

    GW=$(docker network inspect bridge --format '{{(index .IPAM.Config 0).Gateway}}' 2>/dev/null || true)
    [ -n "$GW" ] || GW="172.17.0.1"
    echo "http://${GW}:9000"
    return
  fi

  echo "http://127.0.0.1:9000"
}

BACKEND=$(detect_backend)
mkdir -p "$(dirname "$OUT")"

cat > "$OUT" <<EOF
http:
  routers:
    modernitygate:
      rule: Host(\`${DOMAIN}\`) || Host(\`www.${DOMAIN}\`)
      entryPoints:
        - websecure
      service: modernitygate-app
      tls:
        certResolver: ${CERT_RESOLVER}
  services:
    modernitygate-app:
      loadBalancer:
        servers:
          - url: "${BACKEND}"
EOF

echo "Backend: $BACKEND"
echo "Written: $OUT"
