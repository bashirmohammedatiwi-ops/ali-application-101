#!/usr/bin/env sh
# One-shot VPS setup: app + Traefik + SSL routing for modernitygate.com
# Run: cd /opt/modernity-gate && sudo sh scripts/finalize-vps.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
TRAEFIK_DIR="${TRAEFIK_DIR:-/docker/traefik}"
DOMAIN="modernitygate.com"
. "$SCRIPT_DIR/lib/compose-files.sh"

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
echo "Traefik: $TRAEFIK_CID"

echo ""
echo "=== 4) Traefik routing (Docker labels) ==="
sh "$SCRIPT_DIR/install-traefik-route.sh"
COMPOSE_FILES=$(vps_compose_files)

echo ""
echo "=== 5) Build & start app ==="
sh "$SCRIPT_DIR/fix-port-9000.sh"

export APP_BUILD_ID=$(date +%Y%m%d%H%M%S)
docker compose $COMPOSE_FILES build --build-arg "APP_BUILD_ID=$APP_BUILD_ID"
docker compose $COMPOSE_FILES up -d --force-recreate

echo ""
echo "=== 6) Wait for app ==="
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -sf http://127.0.0.1:9000/login >/dev/null 2>&1 \
    || docker exec modernity-gate wget -qO- http://127.0.0.1:9000/login >/dev/null 2>&1; then
    echo "App is up."
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
echo "=== 7) Verify routing ==="
sh "$SCRIPT_DIR/verify-routing.sh"
echo " Login: manager@modernitygate.com / 123456"
echo " After login: set SEED_ON_START=false in .env.production"
echo "=============================================="
