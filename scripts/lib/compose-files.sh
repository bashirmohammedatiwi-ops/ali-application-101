#!/usr/bin/env sh
# Single source of truth for VPS Docker Compose file list.

vps_compose_files() {
  APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
  FILES="-f docker-compose.yml -f docker-compose.prod.yml"
  if [ -f "$APP_DIR/docker-compose.traefik-net.yml" ]; then
    FILES="$FILES -f docker-compose.traefik-net.yml"
  elif [ -f "$APP_DIR/docker-compose.traefik.yml" ]; then
    FILES="$FILES -f docker-compose.traefik.yml"
  fi
  printf '%s' "$FILES"
}
