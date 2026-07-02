#!/bin/sh
set -eu

DEST="$1"
shift

if [ -z "$DEST" ] || [ "$#" -eq 0 ]; then
  echo "usage: stage-package-modules.sh <dest-dir> <package> [package...]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PKG_LIST="$(mktemp)"

mkdir -p "$DEST"
cd "$APP_ROOT"

node "$SCRIPT_DIR/list-package-deps.mjs" "$@" >"$PKG_LIST"

while IFS= read -r mod; do
  [ -z "$mod" ] && continue
  SRC_DIR=$(node "$SCRIPT_DIR/resolve-package-dir.mjs" "$mod" 2>/dev/null || true)
  if [ -z "$SRC_DIR" ] || [ ! -d "$SRC_DIR" ]; then
    echo "WARN: missing package $mod" >&2
    continue
  fi
  mkdir -p "$(dirname "$DEST/$mod")"
  cp -a "$SRC_DIR" "$DEST/$mod" || echo "WARN: copy failed for $mod" >&2
done <"$PKG_LIST"

rm -f "$PKG_LIST"

# Safety net — Prisma 7 CLI hard dependencies
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

echo "Staged Prisma runtime modules in $DEST"
