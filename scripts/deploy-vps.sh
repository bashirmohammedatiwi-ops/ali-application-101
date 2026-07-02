#!/usr/bin/env sh
set -e

cd "$(dirname "$0")/.."

if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  echo "Created .env.production — edit AUTH_SECRET and NEXTAUTH_URL before continuing."
  exit 1
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "=== Pulling latest code ==="
  git pull --ff-only
  echo "Commit: $(git log -1 --oneline)"
fi

export APP_BUILD_ID=$(date +%Y%m%d%H%M%S)

echo ""
echo "=== Disk before deploy ==="
docker system df 2>/dev/null || true
df -h / 2>/dev/null | tail -1 || true
echo ""

echo "=== Build ID: $APP_BUILD_ID ==="

BUILD_FLAGS="--build-arg APP_BUILD_ID=$APP_BUILD_ID"
if [ "${DEPLOY_NOCACHE:-}" = "1" ]; then
  echo "=== Building image (--no-cache requested) ==="
  BUILD_FLAGS="--no-cache $BUILD_FLAGS"
else
  echo "=== Building image (with cache — saves disk & time) ==="
  echo "    Tip: DEPLOY_NOCACHE=1 ./scripts/deploy-vps.sh only if updates don't appear"
fi

docker compose build $BUILD_FLAGS

echo "=== Recreating container ==="
docker compose up -d --force-recreate --remove-orphans

echo ""
echo "=== Freeing disk after deploy ==="
sh "$(dirname "$0")/cleanup-app-images.sh"

echo ""
docker compose ps
echo ""
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_SERVER')
echo "App: http://${IP}:9000/login"
echo "Verify build footer shows: build $APP_BUILD_ID"
echo ""
echo "If disk is still low: ./scripts/cleanup-docker.sh aggressive"
echo "Logs: docker compose logs -f app"
