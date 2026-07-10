---
type: Prompt
title: "Prompt 09 — RESET a estado inicial (para Claude Code)"
description: "RESET a estado inicial (para Claude Code)"
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 09 — RESET a estado inicial (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. **Operación destructiva** —
> autorizada por el humano: empezamos de cero la capa de página/componentes, conservando el setup.

---

Eres un implementador en `sg-webpage`. Vamos a **resetear el proyecto a su estado inicial de
setup**, borrando toda la capa de página/componentes (que quedó incoherente) **y el historial
git**, para reconstruir desde cero contra el nuevo diseño por secciones (`design/template/`).

## BORRAR (todo lo de página / estructura / componentes)

- `apps/web/src/components/**` (atoms, molecules, organisms, templates) — todo.
- `apps/web/src/content/**` (config de colecciones + `pages/*.json`).
- `apps/web/src/layouts/**`, `apps/web/src/lib/**` (blocks.ts, seo.ts, animations.ts), `apps/web/src/styles/**` (tokens, global), `apps/web/src/pages/**`.
- `apps/web/public/**` **excepto** lo estrictamente necesario para bootear (déjalo vacío o con un `favicon` mínimo).
- `packages/blocks-contract/src/**` → resetear a un **placeholder vacío** (un `index.ts` que exporte un stub tipado; sin schemas de bloque). Mantén el `package.json` del paquete.
- **Todos los tests** de esos componentes/contrato (`**/*.spec.ts` de atoms/molecules/organisms/blocks/layout/seo/animations).
- **Specs de build ya obsoletas** en `docs/specs/`: borra `SPEC-LAYOUT-001.md`, `SPEC-LAYOUT-002.md`, `SPEC-ATOM-00*.md`, `SPEC-MOLECULE-00*.md`, `SPEC-BLOCK-000.md`, `SPEC-BLOCK-00[1-6].md`, `SPEC-BLOCK-100.md`, `SPEC-BLOCK-10[1-6].md`. **Conserva** `SPEC-INFRA-001.md` y `SPEC-TEMPLATE.md`.
- Deja `apps/web` como una **app Astro mínima que bootea**: un `src/pages/index.astro` placeholder (“SolidGraph — coming soon” o vacío), `BaseLayout` mínimo si hace falta para que compile, y nada más.

## CONSERVAR (setup inicial — NO tocar)

- **Monorepo/scaffold:** `package.json` raíz, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `.gitignore`, `.env.example`.
- **Paquetes de config:** `packages/typescript-config`, `packages/eslint-config`.
- **Tooling:** ESLint, Prettier, commitlint; **config** de Vitest, Playwright, vitest-axe (borra los tests de componentes, **conserva** la configuración y un smoke test mínimo verde).
- **Trazabilidad:** `scripts/trace.ts`.
- **Docker/CI:** `apps/web/Dockerfile`, `apps/web/Dockerfile.dev`, `docker-compose.yml`, `.drone.yml`.
- **Arneses/metodología (NO tocar):** `AGENTS.md`, `CLAUDE.md`, `.claude/**` (skills, commands), `docs/01-architecture-and-stack.md`, `docs/04-engineering-methodology.md`, `docs/specs/SPEC-TEMPLATE.md`, `docs/specs/SPEC-INFRA-001.md`.
- **Diseño:** `design/**` (incluye `design/template/sections/*.html`, `design/template/styleguide.html`, `design/template/index.html`, y el standalone/logos). **NO tocar.**

## Reset de git

- `rm -rf .git`, luego `git init` (rama `main`).
- Deja el working tree en el estado "solo setup" descrito arriba.
- Un **único commit inicial**: `chore: initial project setup (monorepo + tooling + CI/Docker + harnesses + design)`.

## Plan/trazabilidad

- Resetea `docs/05-implementation-plan.md` a un **stub**: conserva EPIC-01 (SPEC-INFRA-001 = Implemented) y marca el resto como "**Reset — re-planificación por el arquitecto contra `design/template`**". Regenera `docs/traceability.md` vacío/solo INFRA-001.

## Verificación final (debe quedar verde)

```
pnpm install --frozen-lockfile && pnpm lint && pnpm type-check && pnpm test && pnpm build && pnpm trace -- --check
```

La app mínima debe bootear (`pnpm dev`) y el trace solo debe ver `SPEC-INFRA-001` (Implemented, con sus tests de scaffold).

## Al terminar

Resume qué borraste y qué conservaste, confirma que todo está verde y que el repo quedó en
"solo setup" con git re-inicializado (un commit). **No reconstruyas componentes** — el arquitecto
va a re-planificar las specs contra `design/template/` y te pasará el siguiente prompt.
