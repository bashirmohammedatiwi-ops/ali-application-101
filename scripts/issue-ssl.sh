#!/usr/bin/env sh
# Issue Let's Encrypt certificate and enable HTTPS nginx config.
# Prerequisites: DNS for modernitygate.com points to this server, port 80 open.
# Run on server: sudo sh scripts/issue-ssl.sh
set -e

DOMAIN="modernitygate.com"
APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-admin@modernitygate.com}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh scripts/issue-ssl.sh"
  exit 1
fi

cd "$APP_DIR"

echo "=== Requesting certificate for $DOMAIN and www.$DOMAIN ==="
certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --non-interactive --agree-tos \
  --email "$CERTBOT_EMAIL" \
  --keep-until-expiring

echo "=== Enabling HTTPS nginx config ==="
cp deploy/nginx/modernitygate.conf /etc/nginx/sites-available/modernitygate.conf
nginx -t
systemctl reload nginx

echo "=== Auto-renewal timer ==="
systemctl enable certbot.timer 2>/dev/null || true
systemctl start certbot.timer 2>/dev/null || true

# Renew hook reloads nginx
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'HOOK'
#!/bin/sh
nginx -t && systemctl reload nginx
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

echo ""
echo "SSL active: https://$DOMAIN"
echo "Test renewal: certbot renew --dry-run"
