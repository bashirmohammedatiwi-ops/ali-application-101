#!/usr/bin/env sh
# Request Let's Encrypt cert via Traefik and recreate app with TLS labels.
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TRAEFIK_DIR="${TRAEFIK_DIR:-/docker/traefik}"
DOMAIN="modernitygate.com"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.traefik-net.yml"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

cd "$APP_DIR"

echo "=== 1) DNS must point only to this VPS ==="
sh "$SCRIPT_DIR/preflight-dns.sh" "$DOMAIN" || {
  echo "Fix DNS first: delete A record 2.57.91.91, keep only 187.77.88.174"
  exit 1
}

echo ""
echo "=== 2) Re-apply Traefik labels (with www SAN) ==="
sh "$SCRIPT_DIR/install-traefik-route.sh"

echo ""
echo "=== 3) Recreate app ==="
docker compose $COMPOSE_FILES up -d --force-recreate

echo ""
echo "=== 4) Restart Traefik (triggers ACME) ==="
(cd "$TRAEFIK_DIR" && docker compose restart)
sleep 10

echo ""
echo "=== 5) Wait for Let's Encrypt (up to 2 min) ==="
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  ISSUER=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" 2>/dev/null \
    | openssl x509 -noout -issuer 2>/dev/null || true)
  if echo "$ISSUER" | grep -qi "lets encrypt"; then
    echo "SSL OK: $ISSUER"
    exit 0
  fi
  echo "Waiting... ($i/12) issuer: ${ISSUER:-none}"
  sleep 10
done

echo ""
echo "SSL not ready yet. Run: sudo sh scripts/check-ssl.sh"
docker logs traefik-traefik-1 2>&1 | grep -iE 'acme|error' | tail -15
