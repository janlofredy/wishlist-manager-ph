# syntax=docker/dockerfile:1

# ==========================================
# STAGE 1: Install dependencies (Natively on host CPU)
# ==========================================
FROM --platform=$BUILDPLATFORM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# ==========================================
# STAGE 2: Build the Next.js application (Natively on host CPU)
# ==========================================
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG APP_VERSION
ENV NEXT_PUBLIC_APP_VERSION=${APP_VERSION}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ==========================================
# STAGE 3: Swap native binary addons for target architecture (Natively on host CPU)
# ==========================================
FROM --platform=$BUILDPLATFORM builder AS standalone-arch
ARG TARGETARCH

RUN --mount=type=cache,target=/root/.npm \
    NODE_ARCH=$([ "$TARGETARCH" = "amd64" ] && echo "x64" || echo "$TARGETARCH") && \
    HOST_ARCH=$(node -p "process.arch") && \
    if [ "$NODE_ARCH" != "$HOST_ARCH" ]; then \
      cd /app/.next/standalone/node_modules/better-sqlite3 && \
      npm_config_platform=linux LIBC=musl node /app/node_modules/prebuild-install/bin.js --arch="$NODE_ARCH" --force && \
      rm -rf /app/.next/standalone/node_modules/@img && \
      npm install --prefix /app/.next/standalone --no-save --no-package-lock --no-audit --prefer-offline --force \
        "@img/sharp-linuxmusl-${NODE_ARCH}@0.33.5" \
        "@img/sharp-libvips-linuxmusl-${NODE_ARCH}"; \
    fi

# ==========================================
# STAGE 4: Minimal production runtime (Target Architecture)
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATA_DIR=/app/data

# Install curl for docker healthcheck & create non-root user in a single cached layer
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data && \
    chown -R nextjs:nodejs /app/data

# Copy built artifacts from builder & standalone-arch
COPY --from=builder /app/public ./public
COPY --from=standalone-arch --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/login || exit 1

CMD ["node", "server.js"]

