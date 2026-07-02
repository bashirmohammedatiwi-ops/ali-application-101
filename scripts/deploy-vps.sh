#!/usr/bin/env sh
set -e

cd "$(dirname "$0")/.."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"

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

# Traefik VPS: keep routing labels on every deploy
if docker ps -q --filter "name=traefik" 2>/dev/null | head -1 | grep -q .; then
  echo "=== Traefik detected — applying routing labels ==="
  sh "$SCRIPT_DIR/install-traefik-route.sh" || true
  if [ -f docker-compose.traefik-net.yml ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.traefik-net.yml"
  else
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.traefik.yml"
  fi
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
  echo "=== Building image (with cache) ==="
fi

docker compose $COMPOSE_FILES build $BUILD_FLAGS

echo "=== Free port 9000 ==="
sh "$SCRIPT_DIR/fix-port-9000.sh"

echo "=== Recreating container ==="
docker compose $COMPOSE_FILES up -d --force-recreate --remove-orphans

echo ""
echo "=== Freeing disk after deploy ==="
sh "$SCRIPT_DIR/cleanup-app-images.sh"

echo ""
docker compose $COMPOSE_FILES ps
echo ""
if docker ps -q --filter "name=traefik" 2>/dev/null | head -1 | grep -q .; then
  echo "Traefik routing: active"
  curl -skI https://modernitygate.com/login 2>/dev/null | head -3 || true
fi
echo ""
echo "App: ${NEXTAUTH_URL:-https://modernitygate.com}"
echo "Verify login footer shows: build $APP_BUILD_ID"
echo "Logs: docker compose $COMPOSE_FILES logs -f app"
