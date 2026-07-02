#!/usr/bin/env sh
# One-shot fix for Traefik "404 page not found" on modernitygate.com
# Run on VPS: cd /opt/modernity-gate && sudo sh scripts/fix-404-now.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
. "$SCRIPT_DIR/lib/compose-files.sh"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh scripts/fix-404-now.sh"
  exit 1
fi

cd "$APP_DIR"

echo "=============================================="
echo " Fix 404 — modernitygate.com"
echo "=============================================="

if [ -f docker-compose.traefik-net.yml ] && ! git ls-files --error-unmatch docker-compose.traefik-net.yml >/dev/null 2>&1; then
  echo "Removing conflicting local docker-compose.traefik-net.yml"
  rm -f docker-compose.traefik-net.yml
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git pull --ff-only || true
fi

. "$SCRIPT_DIR/traefik-detect-env.sh" --print
echo ""

sh "$SCRIPT_DIR/ensure-traefik.sh"
TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)
if [ -z "$TRAEFIK_CID" ] && ! pgrep -x traefik >/dev/null 2>&1; then
  echo "ERROR: Traefik still not running after ensure-traefik."
  exit 1
fi

echo "=== 1) Ensure app is built & running with Traefik labels ==="
sh "$SCRIPT_DIR/install-traefik-route.sh"
COMPOSE_FILES=$(vps_compose_files)
sh "$SCRIPT_DIR/fix-port-9000.sh"
export APP_BUILD_ID=$(date +%Y%m%d%H%M%S)
docker compose $COMPOSE_FILES build --build-arg "APP_BUILD_ID=$APP_BUILD_ID"
docker compose $COMPOSE_FILES up -d --force-recreate --remove-orphans

echo ""
echo "=== 2) Wait for app ==="
for i in $(seq 1 20); do
  if curl -sf http://127.0.0.1:9000/login >/dev/null 2>&1 \
    || docker exec modernity-gate wget -qO- http://127.0.0.1:9000/login >/dev/null 2>&1; then
    echo "App OK on :9000"
    break
  fi
  [ "$i" = "20" ] && { echo "App failed to start"; docker logs modernity-gate --tail 40; exit 1; }
  sleep 2
done

echo ""
echo "=== 3) Install dynamic Traefik route + restart Traefik ==="
sh "$SCRIPT_DIR/ensure-traefik.sh"
sh "$SCRIPT_DIR/install-traefik-route.sh"
TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)
if [ -n "$TRAEFIK_CID" ]; then
  docker restart "$TRAEFIK_CID"
  sleep 5
fi

echo ""
echo "=== 4) Verify public HTTPS ==="
sh "$SCRIPT_DIR/verify-routing.sh"

echo ""
echo "=============================================="
echo " FIXED: https://modernitygate.com/login"
echo "=============================================="
