#!/usr/bin/env sh
# Continue setup after a partial run (e.g. nginx port conflict).
# Run on server: cd /opt/modernity-gate && sudo sh scripts/resume-setup.sh
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
DOMAIN="modernitygate.com"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh scripts/resume-setup.sh"
  exit 1
fi

cd "$APP_DIR"

echo "=== Fix nginx + port 80 ==="
sh "$(dirname "$0")/fix-nginx-port.sh"

echo ""
echo "=== Free port 9000 ==="
sh "$(dirname "$0")/fix-port-9000.sh"

echo ""
echo "=== Build & start app ==="
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
export APP_BUILD_ID=$(date +%Y%m%d%H%M%S)
docker compose $COMPOSE_FILES build --build-arg "APP_BUILD_ID=$APP_BUILD_ID"
docker compose $COMPOSE_FILES up -d --force-recreate

echo ""
echo "=== Done ==="
docker compose $COMPOSE_FILES ps
echo ""
echo "Test: curl -sI http://127.0.0.1:9000/login | head -3"
curl -sI http://127.0.0.1:9000/login | head -3 || echo "(app not ready yet — wait 30s and check logs)"
echo ""
echo "Public: http://$DOMAIN"
echo "Next: sudo CERTBOT_EMAIL=you@email.com sh scripts/issue-ssl.sh"
