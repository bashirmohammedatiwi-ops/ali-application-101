#!/usr/bin/env sh
# Configure existing Traefik to proxy modernitygate.com -> app on :9000
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
DOMAIN="modernitygate.com"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

cd "$APP_DIR"
SRC="$APP_DIR/deploy/traefik/modernitygate.yml"

echo "=== Traefik detected — routing $DOMAIN -> 127.0.0.1:9000 ==="

INSTALLED=""
for dir in \
  /etc/traefik/dynamic \
  /etc/traefik/conf.d \
  /opt/traefik/dynamic \
  /root/traefik/dynamic \
  /var/lib/traefik/dynamic; do
  if [ -d "$dir" ]; then
    cp "$SRC" "$dir/modernitygate.yml"
    echo "Installed: $dir/modernitygate.yml"
    INSTALLED=1
  fi
done

# Traefik in Docker — copy into mounted volume if found
TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)
if [ -n "$TRAEFIK_CID" ]; then
  echo "Traefik container: $TRAEFIK_CID"
  for mount in $(docker inspect "$TRAEFIK_CID" --format '{{range .Mounts}}{{.Source}}:{{.Destination}}{{"\n"}}{{end}}' 2>/dev/null | grep -i dynamic || true); do
    host="${mount%%:*}"
    if [ -d "$host" ]; then
      cp "$SRC" "$host/modernitygate.yml"
      echo "Installed via mount: $host/modernitygate.yml"
      INSTALLED=1
    fi
  done
  docker kill -s HUP "$TRAEFIK_CID" 2>/dev/null || docker restart "$TRAEFIK_CID" 2>/dev/null || true
fi

systemctl reload traefik 2>/dev/null || systemctl restart traefik 2>/dev/null || true

if [ -z "$INSTALLED" ]; then
  echo ""
  echo "Could not find Traefik dynamic config folder automatically."
  echo "Add this file manually to your Traefik dynamic directory:"
  echo "  $SRC"
  echo ""
  echo "Or stop Traefik and use nginx instead:"
  echo "  sudo systemctl stop traefik"
  echo "  sudo docker stop \$(docker ps -q --filter name=traefik) 2>/dev/null"
  echo "  sudo sh scripts/fix-nginx-port.sh"
  exit 1
fi

echo "Traefik config installed. SSL is handled by Traefik (no certbot needed)."
