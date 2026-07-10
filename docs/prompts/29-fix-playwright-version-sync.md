---
type: Prompt
title: "Prompt 29 — Sincronizar versión de Playwright (npm ↔ imagen Drone)"
description: "Sincronizar versión de Playwright (npm ↔ imagen Drone)"
tags: [prompt]
timestamp: 2026-07-08T19:36:42-04:00
---

# Prompt 29 — Sincronizar versión de Playwright (npm ↔ imagen Drone)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Desbloquea el gate E2E (visual/a11y/perf).

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 (ciclo de vida de rama). Fix de infra/tooling.

## Bug (con evidencia)
El gate E2E falla: `@playwright/test` se resolvió a **1.61.1** (el `^1.52.0` en `apps/web/package.json`
dejó flotar el paquete), pero la **imagen Docker de Drone sigue en `v1.52.0-noble`** → el navegador que
espera 1.61.1 no existe en esa imagen:
`Executable doesn't exist … required: mcr.microsoft.com/playwright:v1.61.1-noble`.

Causa raíz: paquete npm con `^` (flota) vs imagen hard-pinned → **drift**. Hay que dejarlos **sincronizados
y pineados a la misma versión exacta**, para que solo cambien juntos y a propósito.

## Tareas
1. **Pinear el paquete** — en `apps/web/package.json`, `@playwright/test` a **`1.61.1`** exacto (sin `^`).
   Corre `pnpm install` para actualizar el lockfile. (Si existe `playwright` como dep directa, misma versión.)
2. **Subir la imagen Drone** — en `.drone.yml`, las **3** ocurrencias
   `mcr.microsoft.com/playwright:v1.52.0-noble` (steps `visual-test`, `a11y-test`, `perf-test`; líneas
   ~72/92/134) → **`mcr.microsoft.com/playwright:v1.61.1-noble`**.
3. **Blindar contra recurrencia** — añade un comentario junto a la imagen en `.drone.yml`, p. ej.:
   `# La tag DEBE coincidir con @playwright/test en apps/web/package.json (pineado exacto; subir juntos).`
   Y una línea en `AGENTS.md` §4 (CI): "Playwright: versión npm pineada exacta = tag de la imagen Drone;
   se bumpean juntos (nunca `^` en playwright)."

## Verificación
```
pnpm install
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check
```
El `test:e2e` corre localmente contra los binarios de 1.61.1; en CI, la imagen `v1.61.1-noble` los trae.

## Git (ciclo de vida — AGENTS.md §4)
Rama `fix/playwright-version-sync` **desde `develop`**; Conventional Commits (`chore(infra)`/`ci`),
incluye `docs/`. Al terminar y verde: **merge a `develop` y borra la rama** (local y remota).

## Entregable
`@playwright/test` pineado exacto = tag de la imagen Drone (ambos `1.61.1`); gate E2E verde; regla
anti-drift documentada. Confirma el estado de `develop` y que `main`/prod no se tocó.
```
```
