---
type: Spec
title: "SPEC-INFRA-001 — Fundaciones: monorepo Turborepo + tooling + testing + CI + trace"
description: "Dejar el monorepo ejecutable y verificable: pnpm install && pnpm build && pnpm test && pnpm trace -- --check en verde, con apps/web Astro vacío pero booteable."
tags: [infra]
timestamp: 2026-07-07T12:44:46-04:00
---

# SPEC-INFRA-001 — Fundaciones: monorepo Turborepo + tooling + testing + CI + trace

- **ID:** SPEC-INFRA-001
- **Estado:** Implemented
- **Épica / Story:** EPIC-01 / STORY-011
- **Capa atómica:** infra (habilita todo)
- **Depende de:** —

## Contexto / problema

El repo `sg-webpage` está vacío salvo los arneses (`AGENTS.md`, `CLAUDE.md`, `docs/`,
`.claude/`) y el `design/`. Para construir cualquier átomo hace falta el **scaffold del
monorepo** (Turborepo + `apps/web` Astro), el tooling (lint/format/commits), el **arnés de
tests** y el **script de trazabilidad** que exige la metodología (`docs/04`). Existen configs de
referencia (proyecto Strapi similar) en `../agency-structure/Agency Structure/assets/`
(`.drone.yml`, `Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`, `.env`) — hay que
**adaptarlas a web-only** (sin Strapi/`apps/cms`).

## Objetivo

Dejar el monorepo ejecutable y verificable: `pnpm install && pnpm build && pnpm test &&
pnpm trace -- --check` en verde, con `apps/web` Astro vacío pero booteable.

## Requisitos funcionales (testeables)

- **RF-1** — Monorepo **Turborepo**: `pnpm-workspace.yaml`, `turbo.json`, `package.json` raíz con `packageManager: pnpm@9.15.9` y `engines.node >=22`. Corepack.
- **RF-2** — `apps/web` = **Astro** (`@solidgraph/web`) con **`@astrojs/node` standalone** (`output: 'server'`/hybrid), **TypeScript strict**, integración **Tailwind**. `pnpm --filter @solidgraph/web build` produce `dist/client` + `dist/server`.
- **RF-3** — Paquetes compartidos: `packages/blocks-contract` (Zod; union de bloques como placeholder tipado), `packages/typescript-config`, `packages/eslint-config`.
- **RF-4** — Tooling: ESLint + Prettier + `astro check`; **commitlint** (Conventional Commits); scripts raíz `dev|build|lint|type-check|test|test:e2e|trace` cableados por Turbo.
- **RF-5** — Arnés de tests: **Vitest** + `astro/container`, **vitest-axe** (a11y), **Playwright** configurado (config + smoke test de la home). Un test de ejemplo verde por herramienta.
- **RF-6** — `scripts/trace.ts`: recorre `docs/specs/*`, extrae `RF-x`/`RNF-x`/`INV-x`, cruza con tests que citan `[SPEC-XXX/...]`, genera `docs/traceability.md`. `pnpm trace -- --check` **falla** si una spec `Approved` tiene un requisito sin test. Reconoce cabeceras `**Estado:**`/`**Status:**`.
- **RF-7** — Docker: `apps/web/Dockerfile` (multi-stage `deps→builder→runner`, base `node:22-alpine`, pnpm 9.15.9, runner sin devDeps, `USER node`, `EXPOSE 4321`, healthcheck, `CMD ["node","dist/server/entry.mjs"]`) y `Dockerfile.dev`; `docker-compose.yml` **solo web**. Adaptados de los ejemplos de `assets/`.
- **RF-8** — `.drone.yml` **web-only**: `install → validate (lint+type-check+prettier) → build (turbo) → build-push-web (docker→registry) → trigger-dokploy`. Sin pasos/-webhook de CMS. Secrets vía Drone.
- **RF-9** — `design/` contiene la fuente del diseño: copiar `SolidGraph Website (standalone).html` → `design/solidgraph-website.html` y los logos → `design/assets/` desde `../agency-structure/Agency Structure/assets/`.

## Requisitos no funcionales

- **RNF-1 (seguridad)** — sin secretos en el repo: `.env.example` con placeholders; `.gitignore` cubre `.env`, `node_modules`, `dist`, `.turbo`. gitleaks/`npm audit` en el paso de security scan del CI.
- **RNF-2 (DX)** — `pnpm install --frozen-lockfile` reproducible; `pnpm dev` levanta `apps/web`; `docker compose up` corre la web en contenedor.
- **RNF-3 (CI)** — el orden de gates de `AGENTS.md` §4 queda reflejado en `.drone.yml`/workflow.

## Invariantes

- **INV-1** — Conventional Commits obligatorio (commitlint) y `pnpm install` con lockfile congelado.
- **INV-2** — el `trace check` está presente y bloquea; ninguna spec `Approved` sin cobertura pasa CI.
- **INV-3 (SRP)** — la config vive modular (paquetes `typescript-config`/`eslint-config` compartidos), no duplicada por app.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: monorepo booteable
  Given un checkout limpio
  When se ejecuta pnpm install && pnpm build
  Then apps/web compila a dist/client + dist/server sin errores

Scenario: arnés de calidad en verde
  When se ejecuta pnpm lint && pnpm type-check && pnpm test
  Then todo pasa (con los tests de ejemplo por herramienta)

Scenario: trazabilidad operativa
  Given specs en docs/specs con RF/RNF/INV
  When se ejecuta pnpm trace -- --check
  Then se genera docs/traceability.md y falla si una spec Approved tiene un requisito sin test

Scenario: imagen de producción
  When se construye apps/web/Dockerfile
  Then el runner arranca con node dist/server/entry.mjs en el puerto 4321
```

## Fuera de alcance

- Tokens/tipografía/BaseLayout reales → [SPEC-DS-001](/specs/SPEC-DS-001.md) (design system).
- Átomos, moléculas, organismos, contenido, Sveltia, form de leads, analítica.
- Deploy real a producción (solo se deja el pipeline listo; activar es decisión humana).

## Trazabilidad

- **Tests:** (al implementar) `[SPEC-INFRA-001/RF-1..9]`, `[SPEC-INFRA-001/RNF-1..3]`, `[SPEC-INFRA-001/INV-1..3]` — smoke por herramienta + test del propio `trace.ts`.
- **PRs:** — · **ADR:** — (posible ADR futuro: "Astro Node adapter + Traefik + DroneCI/Dokploy"; nunca se escribió — la numeración pre-reset quedó retirada).
