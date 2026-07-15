---
type: Prompt
title: "Prompt 30 — Endurecer E2E: a11y `networkidle` + regenerar baselines post-refactor"
description: "Endurecer E2E: a11y `networkidle` + regenerar baselines post-refactor"
tags: [prompt]
timestamp: 2026-07-08T20:43:20-04:00
---

# Prompt 30 — Endurecer E2E: a11y `networkidle` + regenerar baselines post-refactor

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Deja el gate E2E de `develop` verde
> (bloquea el deploy dev). Dos fallos pre-existentes, independientes entre sí.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y `docs/specs/SPEC-QA-001.md`
(disciplina de baselines) y `SPEC-A11Y-001.md`. TDD donde aplique.

## Tarea A — a11y: quitar `waitForLoadState('networkidle')` (flaky)
En `tests/a11y/` el `beforeEach` usa `page.waitForLoadState('networkidle')`, que puede no resolver nunca
(HMR/actividad de red continua) → timeout de 30s. `networkidle` está **desaconsejado por Playwright**.
- Reemplázalo por una espera **determinista**: `waitForLoadState('domcontentloaded')` (o `'load'`) **+**
  `await page.locator('<selector estable, p.ej. main o el skip-link>').waitFor()` para asegurar que la
  página está lista antes de correr axe.
- Verifica que los tests a11y pasan **local y** en el contexto de build de CI. No relajes las assertions
  de axe (WCAG AA sigue igual de estricto).

## Tarea B — regenerar baselines anti-regresión (About/Contact/Footer) — CON GUARDA
Tras el refactor component-as-folder, las baselines `toHaveScreenshot` de esas 3 secciones no matchean.
**Orden obligatorio ([SPEC-QA-001](/specs/SPEC-QA-001.md)):**
1. **Primero** corre el **gate de fidelidad** (`compareWithDesign` vs el diseño) de About, Contact y Footer.
   - Si **verde** (diff bajo umbral): el render sigue fiel; el mismatch es solo del PNG viejo (el CSS
     Modules movió sub-píxeles dentro de tolerancia). Procede al paso 2.
   - Si **rojo**: **DETENTE y reporta** — es regresión real del refactor, no baseline vieja. No regeneres.
2. Regenera **solo** las baselines de esas 3 secciones: `pnpm --filter @solidgraph/web exec playwright test <specs> --update-snapshots` (acota a About/Contact/Footer; no regeneres todo a ciegas).
3. **Revisa el diff** de los PNGs nuevos (que el cambio sea el sub-píxel esperado, no algo roto) y commitéalos.

## Verificación
```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check
```
Todo verde, incluido el gate de fidelidad y los a11y sin timeout.

## Git (ciclo de vida — AGENTS.md §4)
Rama `fix/e2e-a11y-baselines` **desde `develop`**; Conventional Commits (`test`/`fix`, scope `a11y`/`qa`),
incluye `docs/`. Al terminar y verde: **merge a `develop` y borra la rama** (local y remota).

## Entregable
a11y sin `networkidle` (espera determinista); baselines de About/Contact/Footer regeneradas **solo tras**
gate de fidelidad verde (o reporte de regresión si estuviera rojo); gate E2E de `develop` verde. Confirma
el estado de `develop` y que el gate de fidelidad pasó antes de regenerar.
```
```
