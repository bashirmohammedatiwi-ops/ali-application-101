#!/usr/bin/env sh
# Verify app + Traefik routing after deploy. Exits 1 on failure (stops deploy).
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="${APP_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
DOMAIN="${DOMAIN:-modernitygate.com}"
. "$SCRIPT_DIR/lib/compose-files.sh"
COMPOSE_FILES=$(vps_compose_files)

cd "$APP_DIR"

wait_for_app() {
  echo "Waiting for app health..."
  for i in $(seq 1 25); do
    if curl -sf --max-time 3 http://127.0.0.1:9000/login >/dev/null 2>&1; then
      echo "  App responds on 127.0.0.1:9000"
      return 0
    fi
    if docker exec modernity-gate wget -qO- http://127.0.0.1:9000/login >/dev/null 2>&1; then
      echo "  App responds inside container"
      return 0
    fi
    sleep 2
  done
  echo "ERROR: App not responding on port 9000"
  docker compose $COMPOSE_FILES logs --tail 30 app 2>/dev/null || docker logs modernity-gate --tail 30 2>/dev/null || true
  return 1
}

has_traefik_labels() {
  docker inspect modernity-gate --format '{{index .Config.Labels "traefik.enable"}}' 2>/dev/null | grep -q true
}

check_https() {
  CODE=$(curl -sko /dev/null -w "%{http_code}" --max-time 15 "https://${DOMAIN}/login" 2>/dev/null || echo "000")
  echo "  HTTPS /login -> HTTP $CODE"
  case "$CODE" in
    200|301|302|307|308) return 0 ;;
    *) return 1 ;;
  esac
}

TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)

wait_for_app

if [ -z "$TRAEFIK_CID" ]; then
  echo "Traefik not running — local app check only (OK)"
  exit 0
fi

echo "Traefik container: $TRAEFIK_CID"

if ! has_traefik_labels; then
  echo "ERROR: Container missing Traefik labels"
  docker inspect modernity-gate --format '{{json .Config.Labels}}' 2>/dev/null | tr ',' '\n' | grep -i traefik || echo "(no traefik labels)"
  exit 1
fi

echo "Traefik labels: OK"

# Refresh dynamic route file (backend URL may change after recreate)
sh "$SCRIPT_DIR/install-traefik-route.sh"
sleep 4

if check_https; then
  echo "Routing verified: https://${DOMAIN}/login"
  exit 0
fi

TRAEFIK_CID=$(docker ps -q --filter "name=traefik" 2>/dev/null | head -1)
if [ -n "$TRAEFIK_CID" ]; then
  echo "Restarting Traefik..."
  docker restart "$TRAEFIK_CID"
  sleep 5
  if check_https; then
    echo "Routing verified after Traefik restart: https://${DOMAIN}/login"
    exit 0
  fi
fi

echo ""
echo "=== Self-heal: recreate container + re-apply routes ==="
docker compose $COMPOSE_FILES up -d --force-recreate
sleep 5
wait_for_app
sh "$SCRIPT_DIR/install-traefik-route.sh"
sleep 4

if check_https; then
  echo "Routing fixed after recreate: https://${DOMAIN}/login"
  exit 0
fi

echo ""
echo "ERROR: Still getting 404 from Traefik"
echo "  docker logs $TRAEFIK_CID --tail 40"
echo "  docker inspect modernity-gate --format '{{json .Config.Labels}}'"
echo "  sudo sh scripts/finalize-vps.sh"
exit 1
