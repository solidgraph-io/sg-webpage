# syntax=docker/dockerfile:1.4
# Production Dockerfile for Astro web frontend (SPEC-INFRA-001/RF-7)
# Multi-stage: deps → builder → runner (no devDependencies in final image)
# Astro Node adapter (standalone) serves both SSG pages and server endpoints.
# Traefik handles TLS and routing — DO NOT expose port 80/443.

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ---- stage 1: install all deps (build needs tailwindcss, etc.) ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/blocks-contract/package.json ./packages/blocks-contract/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# ---- stage 2: build Astro (static + server bundle) ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY packages ./packages
COPY apps/web ./apps/web
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
RUN pnpm --filter @solidgraph/web build

# ---- stage 3: production image — devDeps excluded ----
FROM base AS runner
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/blocks-contract/package.json ./packages/blocks-contract/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/web/dist ./apps/web/dist

WORKDIR /app/apps/web

USER node

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321

EXPOSE 4321

HEALTHCHECK --interval=15s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4321/ || exit 1

CMD ["node", "dist/server/entry.mjs"]
