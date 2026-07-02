#!/usr/bin/env sh
# Start Hostinger/Dokploy Traefik stack and route modernitygate.com -> app :9000
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
TRAEFIK_DIR="${TRAEFIK_DIR:-/docker/traefik}"
SRC="$APP_DIR/deploy/traefik/modernitygate.yml"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

cd "$APP_DIR"

echo "=== Stop nginx (frees port 80/443 for Traefik) ==="
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

echo ""
echo "=== Start Traefik stack ==="
if [ ! -d "$TRAEFIK_DIR" ]; then
  TRAEFIK_DIR=$(docker inspect traefik-traefik-1 --format '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null || true)
fi
if [ -z "$TRAEFIK_DIR" ] || [ ! -d "$TRAEFIK_DIR" ]; then
  echo "Traefik directory not found. Set TRAEFIK_DIR=/path/to/traefik"
  exit 1
fi

echo "Using: $TRAEFIK_DIR"
cd "$TRAEFIK_DIR"

INSTALLED=""
for dir in ./dynamic ./config/dynamic ./data/dynamic /etc/traefik/dynamic; do
  if [ -d "$dir" ]; then
    cp "$SRC" "$dir/modernitygate.yml"
    echo "Installed: $TRAEFIK_DIR/$dir/modernitygate.yml"
    INSTALLED=1
    break
  fi
done

docker compose up -d
sleep 2

TRAEFIK_CID=$(docker ps -q --filter "name=traefik" | head -1)
if [ -z "$INSTALLED" ] && [ -n "$TRAEFIK_CID" ]; then
  for dest in /etc/traefik/dynamic /dynamic /config/dynamic; do
    if docker exec "$TRAEFIK_CID" test -d "$dest" 2>/dev/null; then
      docker cp "$SRC" "$TRAEFIK_CID:$dest/modernitygate.yml"
      echo "Installed in container: $dest/modernitygate.yml"
      docker restart "$TRAEFIK_CID"
      INSTALLED=1
      break
    fi
  done
fi

echo ""
echo "=== Ports ==="
ss -tlnp | grep -E ':80 |:443 ' || echo "(waiting for Traefik...)"

echo ""
echo "=== Traefik logs ==="
docker logs traefik-traefik-1 --tail 15 2>/dev/null || docker logs "$TRAEFIK_CID" --tail 15 2>/dev/null || true

echo ""
echo "=== App ==="
curl -sI http://127.0.0.1:9000/login | head -3 || echo "Start app: cd $APP_DIR && sudo sh scripts/resume-setup-traefik.sh"

echo ""
if [ -n "$INSTALLED" ]; then
  echo "Traefik started with modernitygate.com -> 127.0.0.1:9000"
  echo "SSL: Traefik ACME (letsencrypt) — no certbot/nginx needed"
else
  echo "Traefik started but routing file not installed."
  echo "Run: sudo sh $APP_DIR/scripts/configure-traefik.sh"
fi
echo "Test: curl -I https://modernitygate.com/login"
