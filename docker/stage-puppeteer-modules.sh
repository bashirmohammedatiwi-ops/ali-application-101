#!/bin/sh
set -eu
DEST="${1:-/puppeteer-modules}"
exec "$(dirname "$0")/stage-package-modules.sh" "$DEST" puppeteer-core
