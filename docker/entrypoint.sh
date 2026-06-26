#!/bin/sh
set -e

mkdir -p /app/prisma /app/public/uploads
chown -R nextjs:nodejs /app/prisma /app/public/uploads 2>/dev/null || true

export DATABASE_URL="${DATABASE_URL:-file:/app/prisma/prod.db}"

echo "[entrypoint] Applying database migrations..."
cd /opt/prisma
su-exec nextjs node ./node_modules/prisma/build/index.js migrate deploy

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "[entrypoint] Seeding database..."
  su-exec nextjs node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts
fi

echo "[entrypoint] Starting app on port ${PORT:-9000}..."
cd /app
exec su-exec nextjs "$@"
