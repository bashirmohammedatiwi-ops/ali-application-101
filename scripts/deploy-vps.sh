#!/usr/bin/env sh
set -e

cd "$(dirname "$0")/.."

if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  echo "Created .env.production — edit AUTH_SECRET and NEXTAUTH_URL before continuing."
  exit 1
fi

echo "=== Building (uses cache when possible — omit --no-cache unless needed) ==="
docker compose build

echo "=== Starting containers ==="
docker compose up -d --remove-orphans

echo "=== Removing old unused images ==="
docker image prune -f

echo ""
docker system df
echo ""
echo "App running at http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_SERVER'):9000"
echo "Logs: docker compose logs -f app"
echo ""
echo "If disk is still low, run: ./scripts/cleanup-docker.sh"
