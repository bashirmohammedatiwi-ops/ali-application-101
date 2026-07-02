#!/usr/bin/env sh
# Continue setup when Traefik already owns ports 80/443 (common on Hostinger VPS).
# Run: cd /opt/modernity-gate && sudo sh scripts/resume-setup-traefik.sh
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh scripts/resume-setup-traefik.sh"
  exit 1
fi

cd "$APP_DIR"

if ! pgrep -x traefik >/dev/null 2>&1 && ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qi traefik; then
  echo "Traefik not detected — use: sudo sh scripts/resume-setup.sh"
  exit 1
fi

echo "=== Build & start app (127.0.0.1:9000) ==="
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
export APP_BUILD_ID=$(date +%Y%m%d%H%M%S)
docker compose $COMPOSE_FILES build --build-arg "APP_BUILD_ID=$APP_BUILD_ID"
docker compose $COMPOSE_FILES up -d --force-recreate

echo ""
echo "=== Waiting for app ==="
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf http://127.0.0.1:9000/login >/dev/null 2>&1; then
    echo "App is up."
    break
  fi
  sleep 3
done

echo ""
echo "=== Configure Traefik ==="
sh "$SCRIPT_DIR/configure-traefik.sh" || true

echo ""
echo "=== Status ==="
docker compose $COMPOSE_FILES ps
echo ""
curl -sI http://127.0.0.1:9000/login | head -3 || echo "App not responding on :9000 — check: docker compose logs -f app"
echo ""
curl -sI https://modernitygate.com/login 2>/dev/null | head -5 || curl -sI http://modernitygate.com/login | head -5
echo ""
echo "Done. Open: https://modernitygate.com/login"
echo "No certbot needed — Traefik already handles HTTPS."
echo ""
echo "Set SEED_ON_START=false in .env.production after first login works."
