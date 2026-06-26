#!/usr/bin/env sh
# Remove old ali-application-101 images after deploy (keeps the running one).
set -e

cd "$(dirname "$0")/.."

CURRENT=$(docker inspect modernity-gate --format '{{.Image}}' 2>/dev/null || true)
if [ -z "$CURRENT" ]; then
  echo "Container modernity-gate not running — start it first."
  exit 1
fi

echo "Current image: $CURRENT"
echo "Removing old ali-application-101-app images (except running)..."

docker images ali-application-101-app --format '{{.ID}}' | while read -r id; do
  if [ "$id" != "${CURRENT#sha256:}" ] && [ "sha256:$id" != "$CURRENT" ]; then
    docker rmi "$id" 2>/dev/null && echo "Removed $id" || true
  fi
done

docker image prune -f
docker system df
