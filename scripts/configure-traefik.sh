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
INSTALLED=""

install_to_host_dir() {
  dir="$1"
  if [ -d "$dir" ] && [ -w "$dir" ]; then
    cp "$SRC" "$dir/modernitygate.yml"
    echo "Installed: $dir/modernitygate.yml"
    INSTALLED=1
  fi
}

install_into_container() {
  cid="$1"
  dest="$2"
  if docker exec "$cid" test -d "$dest" 2>/dev/null; then
    docker cp "$SRC" "$cid:$dest/modernitygate.yml"
    echo "Installed in container $cid: $dest/modernitygate.yml"
    INSTALLED=1
  fi
}

echo "=== Traefik detected — routing $DOMAIN -> 127.0.0.1:9000 ==="

for dir in \
  /etc/traefik/dynamic \
  /etc/traefik/conf.d \
  /opt/traefik/dynamic \
  /root/traefik/dynamic \
  /var/lib/traefik/dynamic \
  /data/traefik/dynamic \
  /data/coolify/proxy/dynamic \
  /data/dokploy/traefik/dynamic; do
  install_to_host_dir "$dir"
done

TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)
if [ -n "$TRAEFIK_CID" ]; then
  echo "Traefik container: $TRAEFIK_CID"

  docker inspect "$TRAEFIK_CID" --format '{{range .Mounts}}{{.Source}} {{.Destination}}{{"\n"}}{{end}}' 2>/dev/null \
    | while read -r host dest; do
        [ -z "$host" ] && continue
        case "$dest" in
          *traefik*|*dynamic*|*conf.d*)
            install_to_host_dir "$host"
            ;;
        esac
      done

  for dest in \
    /etc/traefik/dynamic \
    /etc/traefik/conf.d \
    /dynamic \
    /config/dynamic \
    /traefik/dynamic \
    /etc/dokploy/traefik/dynamic; do
    install_into_container "$TRAEFIK_CID" "$dest"
  done

  docker kill -s HUP "$TRAEFIK_CID" 2>/dev/null || docker restart "$TRAEFIK_CID" 2>/dev/null || true
fi

systemctl reload traefik 2>/dev/null || systemctl restart traefik 2>/dev/null || true

if [ -z "$INSTALLED" ]; then
  echo ""
  echo "Could not find Traefik dynamic config folder automatically."
  echo ""
  echo "Inspect Traefik mounts:"
  echo "  docker inspect \$(docker ps -q --filter name=traefik) --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{\"\\n\"}}{{end}}'"
  echo ""
  echo "Try copying into the container:"
  echo "  docker exec \$(docker ps -q --filter name=traefik) ls -la /etc/traefik/"
  echo "  docker cp $SRC \$(docker ps -q --filter name=traefik):/etc/traefik/dynamic/modernitygate.yml"
  echo "  docker restart \$(docker ps -q --filter name=traefik)"
  echo ""
  echo "Or stop Traefik and use nginx:"
  echo "  sudo systemctl stop traefik"
  echo "  sudo docker stop \$(docker ps -q --filter name=traefik) 2>/dev/null"
  echo "  sudo sh scripts/fix-nginx-port.sh"
  exit 1
fi

echo "Traefik config installed. SSL is handled by Traefik (no certbot needed)."
