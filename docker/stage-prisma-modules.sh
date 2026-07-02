#!/bin/sh
set -eu

DEST="${1:-/prisma-modules}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

"$SCRIPT_DIR/stage-package-modules.sh" "$DEST" \
  prisma tsx bcryptjs dotenv @prisma/adapter-better-sqlite3 better-sqlite3

cd "$APP_ROOT"
for pkg in zeptomatch valibot @prisma; do
  if [ ! -e "$DEST/$pkg" ] && [ -e "node_modules/$pkg" ]; then
    mkdir -p "$(dirname "$DEST/$pkg")"
    cp -a "node_modules/$pkg" "$DEST/$pkg"
  fi
done

for required in prisma zeptomatch @prisma/dev; do
  if [ ! -e "$DEST/$required" ]; then
    echo "ERROR: required package not staged: $required" >&2
    exit 1
  fi
done

echo "Prisma runtime modules OK in $DEST"
