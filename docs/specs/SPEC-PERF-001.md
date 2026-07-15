---
type: Spec
title: "SPEC-PERF-001 — Performance: presupuestos Lighthouse + imágenes"
description: "La home es CSS-first con un interactions.js mínimo."
tags: [perf]
timestamp: 2026-07-09T16:37:21-04:00
---

# SPEC-PERF-001 — Performance: presupuestos Lighthouse + imágenes

- **ID:** SPEC-PERF-001
- **Estado:** Implemented
- **Épica / Story:** EPIC-07 / STORY-072 (performance)
- **Capa atómica:** cross-cutting (build + CI)
- **Depende de:** [SPEC-DS-001](/specs/SPEC-DS-001.md), [SPEC-SEC-015](/specs/SPEC-SEC-015.md) (home ensamblada)

## Contexto / problema

La home es CSS-first con un `interactions.js` mínimo. Falta blindar la performance como **gate**:
presupuestos Lighthouse en CI y optimización de imágenes, para que no se degrade.

## Requisitos funcionales (testeables)

- **RF-1 (Lighthouse CI)** — configurar **Lighthouse CI** con presupuestos que **fallan el CI** si se superan. Corre sobre la home (build de producción). Budgets actuales (CI-safe, todos `error`): LCP ≤ 3500ms, CLS ≤ 0.1, TBT ≤ 900ms. TBT es la métrica más ruidosa (dependiente del runner); 900ms absorbe el ruido de CI sin enmascarar regresiones reales (saltos de cientos de ms). Apretar con datos reales de prod.
- **RF-2 (imágenes)** — imágenes raster vía `astro:assets` (formatos modernos, `width`/`height` para evitar CLS, `loading=lazy` bajo el pliegue, `fetchpriority` en el LCP si aplica). Los SVG inline del diseño se mantienen.
- **RF-3 (fuentes)** — Poppins self-hosted **preload** de los pesos usados, `font-display: swap` (ya en DS-001, aquí se verifica el preload y que no hay CDN).
- **RF-4 (presupuesto de JS)** — el JS de cliente se mantiene en presupuesto: `interactions.js` ≤ ~5 KB gz + (futuro) hook de métricas; test que verifica que no se cuela JS pesado/island accidental.
- **RF-5 (CSS)** — CSS de la home dentro de presupuesto; sin CSS no usado significativo.

## Requisitos no funcionales

- **RNF-1** — presupuestos alcanzables en la home actual (definir umbrales realistas y documentarlos).
- **RNF-2 (a11y)** — la optimización no rompe contraste/foco (solapa con [SPEC-A11Y-001](/specs/SPEC-A11Y-001.md)).

## Invariantes

- **INV-1** — el gate de Lighthouse es **bloqueante** en CI (como el trace/fidelidad).
- **INV-2** — JS de cliente dentro de presupuesto; sin dependencias pesadas ni islands accidentales (test).
- **INV-3 (SRP)** — la config de perf vive en su archivo (`lighthouserc`), no dispersa.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: presupuesto Lighthouse bloqueante
  Given los presupuestos definidos (LCP/CLS/TBT/JS/img)
  When corre Lighthouse CI sobre la home
  Then si algún presupuesto se supera, el pipeline falla

Scenario: JS dentro de presupuesto
  Given la home
  When se analiza el build
  Then el JS de cliente es solo interactions.js (≤ ~5 KB gz), sin dependencias pesadas

Scenario: imágenes sin CLS
  Given una imagen raster del sitio
  When se renderiza
  Then tiene width/height y formato optimizado
```

## Fuera de alcance

- Cabeceras de caché/CDN (infra/Traefik/Cloudflare). SEO → [SPEC-SEO-001](/specs/SPEC-SEO-001.md).

## Trazabilidad

- **Tests:** `[SPEC-PERF-001/RF-1..5]`, `[.../RNF-1..2]`, `[.../INV-1..3]` — config Lighthouse + presupuestos, `astro:assets`, preload de fuentes, presupuesto de JS.
- **PRs:** —
