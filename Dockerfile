FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --ignore-scripts && npm rebuild better-sqlite3 sharp

FROM base AS builder
ARG APP_BUILD_ID=dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV APP_BUILD_ID=$APP_BUILD_ID
RUN echo "APP_BUILD_ID=$APP_BUILD_ID" && npx prisma generate && npm run build

FROM base AS puppeteer-runtime
COPY --from=deps /app/node_modules ./node_modules
COPY docker/list-puppeteer-deps.mjs ./docker/list-puppeteer-deps.mjs
COPY docker/stage-puppeteer-modules.sh ./docker/stage-puppeteer-modules.sh
RUN chmod +x docker/stage-puppeteer-modules.sh && ./docker/stage-puppeteer-modules.sh /puppeteer-modules

FROM node:22-alpine AS runner
ARG APP_BUILD_ID=dev
RUN apk add --no-cache \
    libc6-compat vips wget su-exec \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont \
    udev dbus mesa-gbm alsa-lib
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=9000
ENV HOSTNAME=0.0.0.0
ENV SHOW_DEMO_ACCOUNTS=true
ENV APP_BUILD_ID=$APP_BUILD_ID
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Native modules used at runtime (may not be fully traced by standalone)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/adapter-better-sqlite3 ./node_modules/@prisma/adapter-better-sqlite3
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@img ./node_modules/@img
COPY --from=puppeteer-runtime --chown=nextjs:nodejs /puppeteer-modules/ ./node_modules/

# Full Prisma CLI tree for migrate deploy + optional seed
COPY --from=builder --chown=nextjs:nodejs /app/node_modules /opt/prisma/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts /opt/prisma/
COPY --from=builder --chown=nextjs:nodejs /app/prisma /opt/prisma/prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json /opt/prisma/
COPY --from=builder --chown=nextjs:nodejs /app/src/generated /opt/prisma/src/generated

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
  && mkdir -p public/uploads prisma \
  && chown nextjs:nodejs public/uploads prisma

EXPOSE 9000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
