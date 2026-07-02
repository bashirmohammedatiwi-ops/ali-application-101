#!/usr/bin/env sh
# Remove old app images after deploy (keeps the running container's image).
set -e

cd "$(dirname "$0")/.."

if ! docker inspect modernity-gate >/dev/null 2>&1; then
  echo "Container modernity-gate not running — skip image cleanup."
  exit 0
fi

RUNNING_ID=$(docker inspect modernity-gate --format '{{.Image}}')
echo "Running image: ${RUNNING_ID#sha256:}"

echo "Removing unused images (keeps running container)..."
docker image prune -a -f

# Remove dangling build layers
docker builder prune -af --filter "until=2h" 2>/dev/null || docker builder prune -f

echo ""
docker system df
