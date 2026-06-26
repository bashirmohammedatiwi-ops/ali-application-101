#!/usr/bin/env sh
set -e

cd "$(dirname "$0")/.."

if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  echo "Created .env.production — edit AUTH_SECRET and NEXTAUTH_URL before continuing."
  exit 1
fi

docker compose build
docker compose up -d

echo ""
echo "App running at http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'YOUR_SERVER'):9000"
echo "First deploy: set SEED_ON_START=true in .env.production, then: docker compose up -d --force-recreate"
echo "Logs: docker compose logs -f app"
