# ── Stage 1: Install dependencies ──────────────────────────────────────────────
FROM node:20-alpine AS deps

# Build tools needed for better-sqlite3 native module
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


# ── Stage 2: Build the app ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for the current platform
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/data/db.sqlite"

RUN npm run build


# ── Stage 3: Production runner ──────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma migration files
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Full node_modules — needed because Prisma CLI has deep deps (valibot, @prisma/dev, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Startup script
COPY --chown=nextjs:nodejs docker-start.sh ./docker-start.sh
RUN chmod +x docker-start.sh

# Persistent data dirs
RUN mkdir -p /data public/uploads && \
    chown -R nextjs:nodejs /data public/uploads

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-start.sh"]
