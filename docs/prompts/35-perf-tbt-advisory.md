---
type: Prompt
title: "Prompt 35 — Perf: subir el budget de TBT a un techo CI-safe (sigue bloqueante)"
description: "El gate perf-test (Lighthouse CI) ya funciona."
tags: [prompt]
timestamp: 2026-07-09T16:37:21-04:00
---

# Prompt 35 — Perf: subir el budget de TBT a un techo CI-safe (sigue bloqueante)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Ajuste de política de budget (SPEC-PERF-001).

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y `SPEC-PERF-001`. Cambio de config + spec.

## Contexto / decisión (consensuada con el humano)
El gate `perf-test` (Lighthouse CI) ya funciona. Falló por **Total Blocking Time = 653ms vs budget 600**
(9% por encima, una sola corrida en contenedor CI). TBT es la métrica **más ruidosa** de Lighthouse y muy
dependiente del runner; el sitio es Astro con JS mínimo → es **ruido de CI, no regresión real**.

**Decisión:** **subir el budget de TBT** a un techo **CI-safe**, manteniéndolo **bloqueante** (`error`).
Una regresión real serían **cientos de ms** de salto — el gate sigue atrapándola; el techo solo absorbe el
ruido del runner. **LCP y CLS sin cambios** (siguen `error` con sus budgets actuales).

## Tareas
1. En `.lighthouserc.js` (`ci.assert.assertions`): sube `total-blocking-time` de
   `['error', { maxNumericValue: 600 }]` → **`['error', { maxNumericValue: 900 }]`** (headroom ~40% sobre
   el 653 observado; sigue bloqueando regresiones grandes). Actualiza el comentario explicando el porqué
   (ruido de TBT en CI; regresiones reales = saltos de cientos de ms). **No** toques `largest-contentful-paint`
   ni `cumulative-layout-shift`.
   - *(Si prefieres un valor distinto tú decides, pero 900 es el acordado por defecto.)*
2. Actualiza **SPEC-PERF-001** (RF/assertions): documenta el nuevo budget de TBT (**900ms**, CI-safe;
   apretar con datos reales de prod). LCP + CLS son los budgets estrictos. Mantén estado `Implemented`.
3. Si algún test fija el valor `600` de TBT (p. ej. `perf-001.test.ts` validando el `.lighthouserc.js`),
   actualízalo a `900` (coherencia test↔config↔spec).

## Verificación
```
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check
```
`pnpm test` verde. En CI, `perf-test` deja de fallar por TBT (653 < 900); LCP/CLS siguen bloqueando ante
regresión real.

## Git (ciclo de vida — AGENTS.md §4)
Rama `fix/perf-tbt-budget` **desde `develop`**; Conventional Commit (`ci`/`perf`, scope `perf`), incluye
`docs/`. Corre `pnpm exec prettier --write .` (solo código) antes de commitear. Al terminar y verde:
**merge a `develop` y borra la rama**.

## Entregable
Budget TBT = 900 (`error`, bloqueante); LCP + CLS sin cambios; SPEC-PERF-001 y tests coherentes;
`pnpm test` verde. La corrida de `develop` debería pasar `perf-test` y llegar a `build-push-web-dev`.
Reporta archivos tocados.
