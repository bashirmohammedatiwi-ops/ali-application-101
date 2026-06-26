#!/usr/bin/env sh
set -e

echo "=== Docker disk usage (before) ==="
docker system df

echo ""
echo "Removing stopped containers..."
docker container prune -f

echo "Removing dangling and unused images..."
docker image prune -a -f

echo "Removing build cache older than 48h..."
docker builder prune -f --filter "until=48h" 2>/dev/null || docker builder prune -f

echo ""
echo "=== Docker disk usage (after) ==="
docker system df

echo ""
echo "Done. Volumes (database + uploads) were NOT deleted."
