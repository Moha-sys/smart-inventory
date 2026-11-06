# syntax=docker/dockerfile:1
# ============================================================
# Frontend — PRODUCTION image (static build served by Nginx)
# Development uses Dockerfile.dev instead.
# ============================================================

# ---- 1. deps: install node_modules (cached until package*.json changes) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- 2. build: compile the Vite app to /app/dist ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- 3. runtime: tiny Nginx image with only the built files ----
FROM nginx:1.27-alpine AS runtime
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# 127.0.0.1 (not "localhost") — busybox wget may resolve to IPv6, where Nginx isn't listening
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
