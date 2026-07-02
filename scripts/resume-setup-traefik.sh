#!/usr/bin/env sh
# Continue setup when Traefik already owns ports 80/443 (common on Hostinger VPS).
# Run: cd /opt/modernity-gate && sudo sh scripts/resume-setup-traefik.sh
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/lib/compose-files.sh"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh scripts/resume-setup-traefik.sh"
  exit 1
fi

cd "$APP_DIR"

if ! pgrep -x traefik >/dev/null 2>&1 \
  && ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qi traefik \
  && [ ! -d /docker/traefik ]; then
  echo "Traefik not found — use: sudo sh scripts/finalize-vps.sh"
  exit 1
fi

TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)
if [ -n "$TRAEFIK_CID" ]; then
  sh "$SCRIPT_DIR/install-traefik-route.sh"
fi

COMPOSE_FILES=$(vps_compose_files)

echo "=== Free port 9000 ==="
sh "$SCRIPT_DIR/fix-port-9000.sh"

echo ""
echo "=== Build & start app ==="
export APP_BUILD_ID=$(date +%Y%m%d%H%M%S)
docker compose $COMPOSE_FILES build --build-arg "APP_BUILD_ID=$APP_BUILD_ID"
docker compose $COMPOSE_FILES up -d --force-recreate

if [ -n "$TRAEFIK_CID" ]; then
  sh "$SCRIPT_DIR/verify-routing.sh"
fi

echo ""
echo "Done. Open: https://modernitygate.com/login"
