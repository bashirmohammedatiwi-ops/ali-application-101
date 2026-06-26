#!/usr/bin/env sh
set -e

MODE="${1:-safe}"

echo "=== Docker disk usage (before) ==="
docker system df

echo ""
echo "=== Running containers ==="
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Size}}" 2>/dev/null || docker ps

echo ""
echo "=== Images ==="
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.ID}}" | head -20

echo ""
echo "Removing stopped containers..."
docker container prune -f

echo "Removing dangling/unused images (not used by any container)..."
docker image prune -a -f

if [ "$MODE" = "aggressive" ] || [ "$MODE" = "--all-cache" ]; then
  echo "Removing ALL build cache (safe — only affects future build speed)..."
  docker builder prune -af
else
  echo "Removing build cache older than 24h..."
  docker builder prune -af --filter "until=24h" 2>/dev/null || docker builder prune -af
fi

echo ""
echo "=== Docker disk usage (after) ==="
docker system df
df -h / 2>/dev/null || true

echo ""
echo "Done. Database volumes (app-data, uploads) were NOT deleted."
echo ""
echo "Usage:"
echo "  ./scripts/cleanup-docker.sh          # safe cleanup"
echo "  ./scripts/cleanup-docker.sh aggressive  # also clears all build cache (~28GB on your server)"
