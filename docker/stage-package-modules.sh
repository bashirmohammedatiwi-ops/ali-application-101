#!/bin/sh
set -eu

DEST="$1"
shift

if [ -z "$DEST" ] || [ "$#" -eq 0 ]; then
  echo "usage: stage-package-modules.sh <dest-dir> <package> [package...]" >&2
  exit 1
fi

SRC="/app/node_modules"
mkdir -p "$DEST"

node /app/docker/list-package-deps.mjs "$@" | while IFS= read -r mod; do
  [ -z "$mod" ] && continue
  from="$SRC/$mod"
  if [ -d "$from" ]; then
    mkdir -p "$(dirname "$DEST/$mod")"
    cp -a "$from" "$DEST/$mod"
  fi
done

echo "Staged $# root package(s) -> $(find "$DEST" -mindepth 1 -maxdepth 1 | wc -l | tr -d ' ') modules in $DEST"
