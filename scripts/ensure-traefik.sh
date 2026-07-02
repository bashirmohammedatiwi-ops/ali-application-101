#!/usr/bin/env sh
# Ensure Traefik is running (Hostinger VPS: /docker/traefik).
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
TRAEFIK_DIR="${TRAEFIK_DIR:-/docker/traefik}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)
if [ -n "$TRAEFIK_CID" ]; then
  echo "Traefik running: $TRAEFIK_CID"
  exit 0
fi

echo "Traefik not running — starting..."

systemctl stop nginx 2>/dev/null || true

# Try starting stopped container first
STOPPED=$(docker ps -aq --filter "name=traefik" 2>/dev/null | head -1)
if [ -n "$STOPPED" ]; then
  echo "Starting stopped Traefik container: $STOPPED"
  docker start "$STOPPED"
  sleep 3
  TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)
  if [ -n "$TRAEFIK_CID" ]; then
    echo "Traefik started: $TRAEFIK_CID"
    exit 0
  fi
fi

# Hostinger default path
if [ ! -d "$TRAEFIK_DIR" ]; then
  TRAEFIK_DIR=$(docker inspect traefik-traefik-1 --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null || true)
fi

if [ -n "$TRAEFIK_DIR" ] && [ -d "$TRAEFIK_DIR" ]; then
  echo "Starting Traefik from: $TRAEFIK_DIR"
  (cd "$TRAEFIK_DIR" && docker compose up -d)
  sleep 3
  TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)
  if [ -n "$TRAEFIK_CID" ]; then
    echo "Traefik started: $TRAEFIK_CID"
    sh "$SCRIPT_DIR/install-traefik-route.sh" || true
    exit 0
  fi
fi

# Host process (not Docker)
if systemctl is-enabled traefik >/dev/null 2>&1 || systemctl list-unit-files traefik.service >/dev/null 2>&1; then
  echo "Starting system Traefik service..."
  systemctl start traefik 2>/dev/null || true
  sleep 2
  if pgrep -x traefik >/dev/null 2>&1; then
    echo "Traefik process running"
    sh "$APP_DIR/scripts/configure-traefik.sh" || true
    exit 0
  fi
fi

echo ""
echo "ERROR: Could not start Traefik."
echo "  ls -la /docker/traefik"
echo "  docker ps -a | grep traefik"
echo "  sudo sh scripts/start-traefik-stack.sh"
echo "  sudo sh scripts/find-traefik.sh"
exit 1
