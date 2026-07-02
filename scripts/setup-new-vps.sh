#!/usr/bin/env sh
# First-time VPS setup for modernitygate.com
# Run ON THE SERVER as root (Ubuntu 22.04/24.04):
#   cd /opt/modernity-gate && sudo sh scripts/setup-new-vps.sh
set -e

DOMAIN="modernitygate.com"
APP_DIR="${APP_DIR:-/opt/modernity-gate}"
REPO_URL="${REPO_URL:-https://github.com/bashirmohammedatiwi-ops/ali-application-101.git}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root: sudo sh scripts/setup-new-vps.sh"
  exit 1
fi

echo "=== 1. System packages ==="
apt-get update
apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx ufw

echo "=== 2. Docker ==="
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable docker
systemctl start docker

echo "=== 3. Firewall ==="
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=== 4. App directory ==="
mkdir -p "$APP_DIR" /var/www/certbot
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "Repo already exists at $APP_DIR — skipping clone"
fi

cd "$APP_DIR"

if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  SECRET=$(openssl rand -base64 32)
  sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=$SECRET|" .env.production
  sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|" .env.production
  echo ""
  echo "Created .env.production with random AUTH_SECRET"
  echo "Edit if needed: nano $APP_DIR/.env.production"
fi

echo "=== 5. Nginx (HTTP bootstrap) ==="
sh "$SCRIPT_DIR/fix-nginx-port.sh"

echo "=== 6. Build & start app ==="
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
export APP_BUILD_ID=$(date +%Y%m%d%H%M%S)
docker compose $COMPOSE_FILES build --build-arg "APP_BUILD_ID=$APP_BUILD_ID"
docker compose $COMPOSE_FILES up -d --force-recreate

echo ""
echo "=== Setup complete (HTTP) ==="
echo "1. Point DNS A records to this server:"
echo "     $DOMAIN      -> $(curl -4 -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')"
echo "     www.$DOMAIN  -> same IP"
echo ""
echo "2. Wait for DNS (5–30 min), then issue SSL:"
echo "     cd $APP_DIR && sudo CERTBOT_EMAIL=you@email.com sh scripts/issue-ssl.sh"
echo ""
echo "3. After SSL, set SEED_ON_START=false in .env.production and redeploy:"
echo "     cd $APP_DIR && ./scripts/deploy-vps.sh"
echo ""
echo "App (HTTP): http://$DOMAIN"
