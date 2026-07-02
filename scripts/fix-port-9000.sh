#!/usr/bin/env sh
# Free 127.0.0.1:9000 before starting the app container.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
. "$SCRIPT_DIR/lib/compose-files.sh"
COMPOSE_FILES=$(vps_compose_files)

show_port_9000() {
  echo "=== What is using port 9000? ==="
  ss -tlnp 2>/dev/null | grep ':9000 ' || echo "(nothing listening on :9000)"
}

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

cd "$APP_DIR"
show_port_9000

echo ""
echo "=== Stopping modernity-gate stack ==="
docker compose $COMPOSE_FILES down --remove-orphans 2>/dev/null || true
docker stop modernity-gate 2>/dev/null || true
docker rm modernity-gate 2>/dev/null || true

echo ""
echo "=== Stopping other Docker containers on :9000 ==="
for cid in $(docker ps -q --filter "publish=9000" 2>/dev/null); do
  echo "Stopping container $cid"
  docker stop "$cid" 2>/dev/null || true
done

if ss -tlnp 2>/dev/null | grep -q ':9000 '; then
  echo ""
  echo "WARNING: Port 9000 still in use:"
  ss -tlnp | grep ':9000 ' || true
  echo ""
  echo "Stop the process above manually, then re-run deploy."
  exit 1
fi

echo ""
echo "Port 9000 is free."
