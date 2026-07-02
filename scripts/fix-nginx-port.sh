#!/usr/bin/env sh
# Free port 80/443 for nginx and (re)start nginx.
# Run on server: sudo sh scripts/fix-nginx-port.sh
set -e

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh scripts/fix-nginx-port.sh"
  exit 1
fi

echo "=== What is using port 80? ==="
ss -tlnp | grep -E ':80 |:443 ' || echo "(nothing on 80/443)"

echo ""
echo "=== Stopping conflicting services ==="
for svc in apache2 httpd caddy lsws; do
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    echo "Stopping $svc..."
    systemctl stop "$svc"
    systemctl disable "$svc" 2>/dev/null || true
  fi
done

echo "=== Stopping Docker containers bound to port 80/443 ==="
for cid in $(docker ps -q 2>/dev/null); do
  ports=$(docker port "$cid" 2>/dev/null || true)
  if echo "$ports" | grep -qE '0\.0\.0\.0:80|0\.0\.0\.0:443|\[::\]:80'; then
    name=$(docker inspect --format '{{.Name}}' "$cid" | sed 's/^\///')
    echo "Stopping container $name ($cid) — was using host port 80/443"
    docker stop "$cid" || true
  fi
done

if ss -tlnp | grep -q ':80 '; then
  echo ""
  echo "WARNING: Port 80 still in use:"
  ss -tlnp | grep ':80 '
  echo "Stop the process above manually, then re-run this script."
  exit 1
fi

echo ""
echo "=== Configuring nginx ==="
cd "$APP_DIR"
mkdir -p /var/www/certbot
cp deploy/nginx/modernitygate.http.conf /etc/nginx/sites-available/modernitygate.conf
ln -sf /etc/nginx/sites-available/modernitygate.conf /etc/nginx/sites-enabled/modernitygate.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx
systemctl status nginx --no-pager | head -5

echo ""
echo "Nginx is running on port 80."
