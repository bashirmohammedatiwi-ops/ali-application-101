#!/bin/sh
set -eu

DEST="${1:-/puppeteer-modules}"
SRC="/app/node_modules"

mkdir -p "$DEST"

node /app/docker/list-puppeteer-deps.mjs | while IFS= read -r mod; do
  [ -z "$mod" ] && continue
  from="$SRC/$mod"
  if [ -d "$from" ]; then
    mkdir -p "$(dirname "$DEST/$mod")"
    cp -a "$from" "$DEST/$mod"
  fi
done

echo "Staged $(find "$DEST" -mindepth 1 -maxdepth 1 | wc -l | tr -d ' ') puppeteer runtime packages"
