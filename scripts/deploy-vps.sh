#!/usr/bin/env sh
set -e

cd "$(dirname "$0")/.."

if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  echo "Created .env.production — edit AUTH_SECRET and NEXTAUTH_URL before continuing."
  exit 1
fi

export APP_BUILD_ID=$(date +%Y%m%d%H%M%S)

echo "=== Build ID: $APP_BUILD_ID ==="
echo "=== Building image ==="
docker compose build --build-arg "APP_BUILD_ID=$APP_BUILD_ID"

echo "=== Recreating container with new image ==="
docker compose up -d --force-recreate --remove-orphans

echo "=== Removing old unused images ==="
docker image prune -f

echo ""
docker compose ps
docker system df
echo ""
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_SERVER')
echo "App: http://${IP}:9000/login"
echo "Verify build footer shows: build $APP_BUILD_ID"
echo "Logs: docker compose logs -f app"
