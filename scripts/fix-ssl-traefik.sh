#!/usr/bin/env sh
# Request Let's Encrypt cert via Traefik and recreate app with TLS labels.
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TRAEFIK_DIR="${TRAEFIK_DIR:-/docker/traefik}"
DOMAIN="modernitygate.com"
. "$SCRIPT_DIR/lib/compose-files.sh"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

cd "$APP_DIR"

resolve_compose() {
  COMPOSE_FILES=$(vps_compose_files)
}

echo "=== 1) DNS must point only to this VPS ==="
sh "$SCRIPT_DIR/preflight-dns.sh" "$DOMAIN" || {
  echo "Fix DNS in Hostinger: delete A record 2.57.91.91, keep only $(curl -4 -s ifconfig.me)"
  exit 1
}

echo ""
echo "=== 2) Stop nginx (if running) ==="
systemctl stop nginx 2>/dev/null || true

echo ""
echo "=== 3) Re-apply Traefik labels (HTTPS only — fixes Let's Encrypt) ==="
sh "$SCRIPT_DIR/install-traefik-route.sh"
resolve_compose

echo ""
echo "=== 4) Recreate app ==="
docker compose $COMPOSE_FILES up -d --force-recreate

echo ""
echo "=== 5) Restart Traefik (triggers ACME) ==="
(cd "$TRAEFIK_DIR" && docker compose up -d && docker compose restart)
sleep 15

echo ""
echo "=== 6) Wait for Let's Encrypt (up to 3 min) ==="
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18; do
  ISSUER=$(echo | openssl s_client -connect "${DOMAIN}:443" -servername "$DOMAIN" 2>/dev/null \
    | openssl x509 -noout -issuer 2>/dev/null || true)
  if echo "$ISSUER" | grep -qi "lets encrypt"; then
    echo ""
    echo "SSL OK: $ISSUER"
    echo "Open: https://$DOMAIN/login"
    exit 0
  fi
  echo "Waiting... ($i/18) issuer: ${ISSUER:-none}"
  sleep 10
done

echo ""
echo "SSL not ready. Diagnostics:"
sh "$SCRIPT_DIR/check-ssl.sh"
docker logs traefik-traefik-1 2>&1 | grep -iE 'acme|certificate|error' | tail -25
