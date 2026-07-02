#!/usr/bin/env sh
# Remove old app images and build cache after deploy (keeps the running container's image).
set -e

cd "$(dirname "$0")/.."

if ! docker inspect modernity-gate >/dev/null 2>&1; then
  echo "Container modernity-gate not running — skip image cleanup."
  exit 0
fi

RUNNING_ID=$(docker inspect modernity-gate --format '{{.Image}}')
echo "Running image: ${RUNNING_ID#sha256:}"

echo "Removing stopped containers..."
docker container prune -f

echo "Removing unused images (keeps running container)..."
docker image prune -a -f

echo "Removing dangling image layers..."
docker images -f "dangling=true" -q | xargs -r docker rmi -f 2>/dev/null || true

echo "Trimming build cache (older than 6h)..."
docker builder prune -af --filter "until=6h" 2>/dev/null || docker builder prune -af

echo ""
echo "=== Disk after cleanup ==="
docker system df
df -h / 2>/dev/null | tail -1 || true

echo ""
echo "Tip: if disk is still low, run: ./scripts/cleanup-docker.sh aggressive"
