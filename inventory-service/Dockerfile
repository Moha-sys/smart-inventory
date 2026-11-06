# syntax=docker/dockerfile:1
# ============================================================
# inventory-service — PRODUCTION image
# Development uses Dockerfile.dev instead.
# ============================================================

# ---- 1. deps: production dependencies only ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- 2. runtime ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
USER node
EXPOSE 3000
# 127.0.0.1 (not "localhost") — busybox wget may resolve to IPv6
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "src/index.js"]
