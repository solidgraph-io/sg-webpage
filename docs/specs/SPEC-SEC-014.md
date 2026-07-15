---
type: Spec
title: "SPEC-SEC-014 — Sección 14: Footer"
description: "Pie oscuro (--night-2) con marca, columnas de enlaces, barra legal y watermark gigante."
tags: [sec]
timestamp: 2026-07-09T00:32:49-04:00
---

# SPEC-SEC-014 — Sección 14: Footer

- **ID:** SPEC-SEC-014
- **Estado:** Approved
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** [SPEC-DS-001](/specs/SPEC-DS-001.md), [SPEC-QA-001](/specs/SPEC-QA-001.md)
- **Fuente:** `design/template/sections/14-footer.html` (+ `components/logo.css`)

## Contexto / problema

Pie **oscuro** (`--night-2`) con marca, columnas de enlaces, barra legal y **watermark** gigante.
Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (estructura/estilo)** — `Footer.astro` porta `14-footer.html`: `<footer>` oscuro con `foot-grid` (`foot-brand`: `Logo` + descripción + pills de `locations`; + columnas de enlaces), `foot-bottom` (legal), y el **`foot-big`** watermark semitransparente.
- **RF-2 (contenido tipado)** — props: `brand`{`logo?`,`description?`,`locations?[]`}, `columns[]`{`title`,`links[]`}, `legal?[]`, `watermark?`, **`brandLink`**{`label`,`href`} (a solidgraph.dev). Copy por props.
- **RF-3 (hooks)** — `data-reveal`/`--d` si la fuente los usa.

## Requisitos no funcionales

- **RNF-1 (a11y)** — landmark `<footer>`; enlaces descriptivos; watermark decorativo `aria-hidden`; contraste AA (claro sobre oscuro).
- **RNF-2 (perf)** — sin JS por sección.
- **RNF-3 (responsive)** — `foot-grid` colapsa como el diseño.
- **RNF-4 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff contra `14-footer.html` bajo umbral (desktop+mobile). Self-baselines (`toHaveScreenshot`) retirados per [ADR-0014](/adr/0014-design-gate-sole-visual-regression.md).

## Invariantes

- **INV-1 (SRP)** — un archivo ≤ ~150 líneas; usa `Logo`.
- **INV-2** — color/medida por tokens; copy por props; `brandLink` a solidgraph.dev obligatorio.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: footer oscuro con watermark y brandLink
  Given brand, columns, legal, watermark
  When se renderiza contra 14-footer.html
  Then coincide (bajo umbral): oscuro, watermark decorativo, enlace a solidgraph.dev presente
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-014/RF-1..3]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + a11y + gate de fidelidad.
- **PRs:** —
