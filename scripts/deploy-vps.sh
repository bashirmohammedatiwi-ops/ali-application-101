#!/usr/bin/env sh
set -e

cd "$(dirname "$0")/.."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
. "$SCRIPT_DIR/lib/compose-files.sh"

COMPOSE_FILES=$(vps_compose_files)

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

TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)
if [ -n "$TRAEFIK_CID" ]; then
  echo "=== Traefik detected — applying routes (before build) ==="
  sh "$SCRIPT_DIR/install-traefik-route.sh"
  COMPOSE_FILES=$(vps_compose_files)
fi

export APP_BUILD_ID=$(date +%Y%m%d%H%M%S)

echo ""
echo "=== Disk before deploy ==="
docker system df 2>/dev/null || true
df -h / 2>/dev/null | tail -1 || true
echo ""

echo "=== Build ID: $APP_BUILD_ID ==="
echo "=== Compose: docker compose $COMPOSE_FILES ==="

BUILD_FLAGS="--build-arg APP_BUILD_ID=$APP_BUILD_ID"
if [ "${DEPLOY_NOCACHE:-}" = "1" ]; then
  echo "=== Building image (--no-cache requested) ==="
  BUILD_FLAGS="--no-cache $BUILD_FLAGS"
else
  echo "=== Building image (with cache) ==="
fi

docker compose $COMPOSE_FILES build $BUILD_FLAGS

echo "=== Free port 9000 ==="
sh "$SCRIPT_DIR/fix-port-9000.sh"

echo "=== Recreating container ==="
docker compose $COMPOSE_FILES up -d --force-recreate --remove-orphans

if [ -n "$TRAEFIK_CID" ]; then
  echo "=== Verify routing (fail deploy if 404) ==="
  sh "$SCRIPT_DIR/verify-routing.sh"
fi

echo ""
echo "=== Freeing disk after deploy ==="
sh "$SCRIPT_DIR/cleanup-app-images.sh"

echo ""
docker compose $COMPOSE_FILES ps
echo ""
echo "App: ${NEXTAUTH_URL:-https://modernitygate.com}"
echo "Verify login footer shows: build $APP_BUILD_ID"
echo "Logs: docker compose $COMPOSE_FILES logs -f app"
