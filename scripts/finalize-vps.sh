#!/usr/bin/env sh
# One-shot VPS setup: app + Traefik + SSL routing for modernitygate.com
# Run: cd /opt/modernity-gate && sudo sh scripts/finalize-vps.sh
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TRAEFIK_DIR="${TRAEFIK_DIR:-/docker/traefik}"
DOMAIN="modernitygate.com"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh scripts/finalize-vps.sh"
  exit 1
fi

cd "$APP_DIR"

echo "=============================================="
echo " Final VPS setup — $DOMAIN"
echo "=============================================="

echo ""
echo "=== 1) DNS check (warning only) ==="
sh "$SCRIPT_DIR/preflight-dns.sh" "$DOMAIN" || echo "(continuing — fix DNS in Hostinger if HTTPS fails)"

echo ""
echo "=== 2) Stop nginx ==="
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

echo ""
echo "=== 3) Start Traefik ==="
if [ ! -d "$TRAEFIK_DIR" ]; then
  TRAEFIK_DIR=$(docker inspect traefik-traefik-1 --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null || true)
fi
if [ -z "$TRAEFIK_DIR" ] || [ ! -d "$TRAEFIK_DIR" ]; then
  echo "ERROR: Traefik not found at $TRAEFIK_DIR"
  exit 1
fi
(cd "$TRAEFIK_DIR" && docker compose up -d)
sleep 2

TRAEFIK_CID=$(docker ps -q --filter "name=traefik" | head -1)
TRAEFIK_NET=$(docker inspect "$TRAEFIK_CID" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' | head -1)
NETMODE=$(docker inspect "$TRAEFIK_CID" --format '{{.HostConfig.NetworkMode}}' 2>/dev/null || true)
echo "Traefik: $TRAEFIK_CID (network=$TRAEFIK_NET mode=$NETMODE)"

echo ""
echo "=== 4) Build & start app ==="
sh "$SCRIPT_DIR/fix-port-9000.sh"

# Join Traefik docker network so Traefik can reach modernity-gate:9000
if [ -n "$TRAEFIK_NET" ] && [ "$NETMODE" != "host" ]; then
  cat > "$APP_DIR/docker-compose.traefik-net.yml" <<EOF
services:
  app:
    ports: !reset []
    networks:
      - traefik
networks:
  traefik:
    external: true
    name: ${TRAEFIK_NET}
EOF
  COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.traefik-net.yml"
  echo "App will join network: $TRAEFIK_NET"
fi

export APP_BUILD_ID=$(date +%Y%m%d%H%M%S)
docker compose $COMPOSE_FILES build --build-arg "APP_BUILD_ID=$APP_BUILD_ID"
docker compose $COMPOSE_FILES up -d --force-recreate

echo ""
echo "=== 5) Wait for app ==="
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -sf http://127.0.0.1:9000/login >/dev/null 2>&1; then
    echo "App is up on :9000"
    break
  fi
  if [ "$i" = "15" ]; then
    echo "ERROR: App not responding. Logs:"
    docker compose $COMPOSE_FILES logs --tail 40 app
    exit 1
  fi
  sleep 3
done

echo ""
echo "=== 6) Install Traefik route ==="
ROUTE_FILE="$APP_DIR/deploy/traefik/modernitygate.generated.yml"
sh "$SCRIPT_DIR/write-traefik-route.sh" "$ROUTE_FILE"

INSTALLED=""
for dir in "$TRAEFIK_DIR/etc/traefik/dynamic" "$TRAEFIK_DIR/dynamic" /etc/traefik/dynamic; do
  if [ -d "$dir" ]; then
    cp "$ROUTE_FILE" "$dir/modernitygate.yml"
    echo "Installed: $dir/modernitygate.yml"
    INSTALLED=1
    break
  fi
done

if [ -z "$INSTALLED" ] && [ -n "$TRAEFIK_CID" ]; then
  for dest in /etc/traefik/dynamic /dynamic; do
    if docker exec "$TRAEFIK_CID" test -d "$dest" 2>/dev/null; then
      docker cp "$ROUTE_FILE" "$TRAEFIK_CID:$dest/modernitygate.yml"
      echo "Installed in container: $dest/modernitygate.yml"
      INSTALLED=1
      break
    fi
  done
fi

docker restart "$TRAEFIK_CID" 2>/dev/null || true
sleep 3

echo ""
echo "=== 7) Verify ==="
docker compose $COMPOSE_FILES ps
echo ""
ss -tlnp | grep -E ':80 |:443 |:9000 ' || true
echo ""
echo "Local app:"
curl -sI http://127.0.0.1:9000/login | head -3
echo ""
echo "Public HTTP:"
curl -sI "http://$DOMAIN/login" 2>/dev/null | head -5 || true
echo ""
echo "Public HTTPS:"
curl -skI "https://$DOMAIN/login" 2>/dev/null | head -8 || true

echo ""
echo "=============================================="
if curl -skf "https://$DOMAIN/login" >/dev/null 2>&1; then
  echo " DONE: https://$DOMAIN/login"
else
  echo " App runs locally. If HTTPS fails:"
  echo "  - Hostinger: disable CDN, A record -> $(curl -4 -s --max-time 5 ifconfig.me 2>/dev/null || echo 'VPS_IP')"
  echo "  - Wait 10 min, re-run: sudo sh scripts/finalize-vps.sh"
  echo "  - Check: docker logs $TRAEFIK_CID --tail 50"
fi
echo " Login: manager@modernitygate.com / 123456"
echo " After login: set SEED_ON_START=false in .env.production"
echo "=============================================="
