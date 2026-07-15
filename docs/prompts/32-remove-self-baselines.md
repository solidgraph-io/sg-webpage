---
type: Prompt
title: "Prompt 32 — Quitar los self-baselines visuales (diseño = único gate de regresión visual)"
description: "Los baselines toHaveScreenshot anti-regresión fallan en CI por drift de entorno: se generaron en WSL pero el CI usa el contenedor Playwright, y el layout difiere 1px (unas seccion…"
tags: [prompt]
timestamp: 2026-07-09T00:32:49-04:00
---

# Prompt 32 — Quitar los self-baselines visuales (diseño = único gate de regresión visual)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa `ADR-0014`. Desbloquea el gate
> E2E de `develop` (baselines `toHaveScreenshot` driftan 1px local↔CI).

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md`, `docs/adr/0014-design-gate-sole-visual-regression.md`,
`SPEC-QA-001` y los `SPEC-SEC-*`. **Recuerda:** `docs/` se commitea.

## Contexto (con evidencia)
Los baselines `toHaveScreenshot` anti-regresión fallan en CI por **drift de entorno**: se generaron en WSL
pero el CI usa el contenedor Playwright, y el layout difiere **1px** (unas secciones 1px más altas, otras
1px más bajas → ~8-9% de píxeles → fallan). El **gate de fidelidad contra el diseño** (`compareWithDesign`)
está **verde**. Decisión ([ADR-0014](/adr/0014-design-gate-sole-visual-regression.md)): **el gate del diseño es el único gate de regresión visual**; se
eliminan los self-baselines.

## Tareas
1. **Localiza** todos los tests de self-baseline: `git grep -n "toHaveScreenshot"` (en `tests/visual/*.spec.ts`
   y styleguide si aplica). Son los tagueados como "anti-regresión baseline" (`RNF-3`/`RNF-4` de cada SEC).
2. **Elimina** esos tests `toHaveScreenshot` y **borra los PNG commiteados** correspondientes
   (`tests/snapshots/visual/**` de esos baselines). **NO** toques:
   - `compareWithDesign(...)` (el gate de fidelidad vs el diseño) — **se queda, es el juez**.
   - Los tests de **comportamiento** (conteo de items, estado por defecto, no dev-toolbar, logo no roto…),
     **a11y** y **perf**.
3. **Actualiza specs:**
   - Cada `SPEC-SEC-*` afectada: **retira** el `RNF` de anti-regresión (self-baseline) y añade nota: "la
     regresión visual la cubre el gate de fidelidad ([SPEC-QA-001](/specs/SPEC-QA-001.md)); sin self-baselines (frágiles a entorno)".
   - `SPEC-QA-001`: codifica que `compareWithDesign` es el **único** gate de regresión visual; los
     self-baselines se retiran por dependientes de entorno. Cita ADR-0014.
   - `AGENTS.md` §3.1 (fila E2E/visual): si menciona baselines, actualízala a "regresión visual = vs diseño".
4. Si el proyecto `[mobile]` corría además los tests "desktop" (doble baseline), esa duplicación
   desaparece con la eliminación — verifica que no queden referencias colgando.

## Verificación
```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check
```
`test:e2e` **verde** (sin fallos de baseline); el gate de fidelidad vs diseño **sigue corriendo y verde**;
no baja el nº de tests unitarios. Confirma que ya no quedan `toHaveScreenshot` de anti-regresión.

## Git (ciclo de vida — AGENTS.md §4)
Rama `refactor/remove-visual-self-baselines` **desde `develop`**; Conventional Commits (`test`/`chore`,
scope `qa`), incluye `docs/`. Al terminar y verde: **merge a `develop` y borra la rama**.

## Entregable
Sin self-baselines `toHaveScreenshot`; el gate de fidelidad vs diseño como único gate visual; specs
(SEC + QA-001 + AGENTS §3.1) actualizadas; E2E verde y más rápido. Reporta cuántos tests/PNG se
eliminaron y confirma que el gate de fidelidad sigue verde.
