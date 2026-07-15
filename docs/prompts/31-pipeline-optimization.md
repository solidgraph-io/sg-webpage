---
type: Prompt
title: "Prompt 31 — Optimizar el pipeline: build-once + gates en paralelo + promote-image"
description: "Eliminar la redundancia del pipeline (build 3–4× → 1×), correr los gates pesados en paralelo, y dejar prod como promoción de la misma imagen (no rebuild)."
tags: [prompt]
timestamp: 2026-07-08T23:13:03-04:00
---

# Prompt 31 — Optimizar el pipeline: build-once + gates en paralelo + promote-image

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa `docs/specs/SPEC-DEPLOY-002.md`
> + `docs/adr/0013-modern-cd-build-once-promote.md`. **Toca CI/CD** — cambios cuidadosos, gates intactos.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4, `SPEC-DEPLOY-002`, `ADR-0013`, `SPEC-QA-001`,
`SPEC-A11Y-001`, `SPEC-PERF-001`. **Recuerda:** `docs/` se commitea. Usa subagente **Plan** para el rediseño
del `.drone.yml`.

## Objetivo
Eliminar la redundancia del pipeline (build 3–4× → **1×**), correr los gates pesados **en paralelo**, y
dejar prod como **promoción de la misma imagen** (no rebuild). **Ningún gate de calidad se elimina.**

## Tarea A — build-once + gates en paralelo (dev; valor inmediato)
Rediseña `.drone.yml` así:

1. **Un solo build.** Añade/usa un step `build` (image `node:22-alpine`) que corre **después** de `test` y
   produce `apps/web/dist`. Drone comparte el workspace (`/drone/src`, incluido `node_modules` y `dist`)
   entre steps → los steps siguientes **NO** reinstalan ni reconstruyen.
2. **Quita los `pnpm install` + `pnpm build` redundantes** de `visual-test`, `a11y-test`, `perf-test`.
   Deben **consumir el `dist/` ya construido**. Ajusta la config de Playwright (`webServer`) para **servir
   el build existente** (`astro preview`/node server) en vez de reconstruir; y `lhci` para apuntar al mismo.
3. **Paraleliza:** `visual-test`, `a11y-test` y `perf-test` → **todos** `depends_on: [build]` (quita
   `a11y depends_on visual`). Corren concurrentes contra el mismo `dist/`.
4. **Deploy tras los gates:** `build-push-web-dev` → `depends_on: [visual-test, a11y-test, perf-test]`
   (esperan en paralelo, no en serie). `perf` **sigue bloqueante** (honra [SPEC-PERF-001](/specs/SPEC-PERF-001.md)/README), pero ya
   no serializa.
5. **Caching:** documenta/usa cache del pnpm store + Turbo remote cache para que el build único sea rápido
   y persista entre corridas. Cuida que el store se comparta entre el step `node` y los steps con imagen
   Playwright (mismo workspace).

> **Sub-opción (NO por default):** deja comentado cómo mover `perf-test` a una corrida **nightly**
> (cron) si más adelante se prioriza velocidad de deploy sobre gating por commit. Default = perf bloqueante paralelo.

## Tarea B — build-once → promote-image (prod; forward-looking, prod aún no activo)
- La imagen se construye **una vez** (en `develop`): tags `dev` + `sha-${DRONE_COMMIT_SHA}`.
- **Prod NO reconstruye.** Reemplaza el rebuild de `main` por un **promote por retag**: `crane`/`skopeo`
  re-taggea in-registry `…/solidgraph-web:sha-<SHA>` → `:latest` y dispara `DOKPLOY_WEBHOOK_WEB`, **sin**
  re-correr gates. Documenta el requisito: `main` **fast-forward desde develop** (mismo SHA) para que la
  imagen `sha-<SHA>` exista; o usar Drone promotion event.
- Como **prod no está en vivo**, si el retag no es viable ya, **deja el step de promote documentado/ stubbed**
  y mantén `main` sin romperse; NO actives prod. Explica el estado en el commit.

## Reglas
- **Cero gates eliminados**; fidelidad (QA-001) + a11y siguen bloqueando la certificación.
- **No rompas prod** (main): si el promote no queda 100%, main conserva comportamiento actual.
- Actualiza la **cabecera de `.drone.yml`** (el diagrama de gates) y **AGENTS.md §4** (nueva forma:
  build-once, gates en paralelo, promote-image).

## Verificación
- Inspección: **un solo** `pnpm build` en el `.drone.yml`; `depends_on` de visual/a11y/perf = `[build]`
  (paralelos); prod por retag.
- `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check` verde localmente.
- Idealmente, medir el wall-clock de la corrida en Drone antes/después y reportarlo.

## Git (ciclo de vida — AGENTS.md §4)
Rama `feature/SPEC-DEPLOY-002-pipeline-opt` **desde `develop`**; Conventional Commits (scope `infra`/`ci`),
incluye `docs/`. Al terminar y verde: **merge a `develop` y borra la rama**.

## Entregable
`.drone.yml` con build 1× + gates en paralelo + deploy tras gates; prod por promote-image (o stubbed si
prod no activo); AGENTS.md §4 actualizado; gates verdes. Reporta la nueva forma del pipeline y, si puedes,
el ahorro de tiempo medido.
