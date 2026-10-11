# Multi-stage Dockerfile for Wishlist Manager PH
# Builds for linux/amd64 and linux/arm64 architectures

# ==========================================
# STAGE 1: Build Frontend (SvelteKit SPA)
# ==========================================
FROM --platform=$BUILDPLATFORM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Build Backend (Rust Axum Binary)
# ==========================================
FROM rust:bookworm AS backend-builder
WORKDIR /app

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy workspace & crate definitions for dependency layer caching
COPY Cargo.toml ./
COPY backend/Cargo.toml ./backend/

# Create a dummy main to cache compiled external dependencies
RUN mkdir -p backend/src && echo "fn main() {}" > backend/src/main.rs
WORKDIR /app/backend
RUN cargo build --release || true
RUN rm -rf src

# Now copy full backend source code
WORKDIR /app
COPY backend ./backend

WORKDIR /app/backend
# Pre-compile release binary with dependencies already cached
RUN cargo build --release

# ==========================================
# STAGE 3: Final Production Runtime Container
# ==========================================
FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    sqlite3 \
    tzdata \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup persistent directory
ENV DATA_DIR=/app/data
ENV PORT=3000
ENV FRONTEND_DIR=/app/frontend_build
RUN mkdir -p /app/data /app/frontend_build

# Copy compiled backend binary
COPY --from=backend-builder /app/target/release/wishlist-manager-ph-backend /app/wishlist-manager-ph

# Copy compiled static frontend SPA assets
COPY --from=frontend-builder /app/frontend/build /app/frontend_build

# Expose Web Port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/system/sale-calendar || exit 1

# Mount persistent data directory
VOLUME ["/app/data"]

ENTRYPOINT ["/app/wishlist-manager-ph"]
