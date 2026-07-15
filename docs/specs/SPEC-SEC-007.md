---
type: Spec
title: "SPEC-SEC-007 — Sección 07: Plans (+ hosting)"
description: "\"No Hidden Fees\": la sección más rica."
tags: [sec]
timestamp: 2026-07-09T00:32:49-04:00
---

# SPEC-SEC-007 — Sección 07: Plans (+ hosting)

- **ID:** SPEC-SEC-007
- **Estado:** Verified
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** [SPEC-DS-001](/specs/SPEC-DS-001.md), [SPEC-QA-001](/specs/SPEC-QA-001.md)
- **Fuente:** `design/template/sections/07-plans.html` (+ `components/{plan-card,hosting-card,note-bar,badge,button}.css`)

## Contexto / problema

"No Hidden Fees": la sección más rica. **Clara** (`#fff`) con 4 planes (el `popular` es una card
**oscura escalada**) + sub-bloque **hosting**. Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (Plans)** — `Plans.astro` porta `07-plans.html`: `SectionHead`, `note-bar` (pill lilac), `plan-grid` de 4 `PlanCard` con `name`/`tagline`/`price`+`priceNote`/`delivery`/`bestFor`/`includes` (check)/`excludes` (×)/`plan-cta`. El plan `popular` es **card oscura `--night` escalada** con `Badge` — destacado **no** solo por color.
- **RF-2 (Hosting)** — sub-bloque **claro**: `hosting-head` + `hosting-grid` de `HostingCard` (sobre `--lilac-2`, hover a blanco con borde peri): `name`/`price`/`desc`/`items`.
- **RF-3 (moléculas)** — extrae `PlanCard` y `HostingCard` como componentes propios (SRP), portando su `components/*.css`.
- **RF-4 (contenido tipado)** — props: `heading`,`subheading?`,`note?`,`plans[]`{…}, `hosting`{`heading`,`subheading?`,`cards[]`{…}}. Copy por props.
- **RF-5 (hooks)** — `data-reveal`/`--d` como la fuente.

## Requisitos no funcionales

- **RNF-1 (a11y)** — plan destacado con `Badge`/texto (no solo color); headings de plan correctos; CTAs foco visible; contraste AA (incl. texto claro sobre la card oscura).
- **RNF-2 (perf)** — hover por CSS; sin JS por sección.
- **RNF-3 (responsive)** — plan-grid 4→2→1; `popular` deja de escalarse en móvil; hosting 4→2→1.
- **RNF-4 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff contra `07-plans.html` bajo umbral (desktop+mobile). Self-baselines (`toHaveScreenshot`) retirados per [ADR-0014](/adr/0014-design-gate-sole-visual-regression.md).

## Invariantes

- **INV-1 (SRP)** — `Plans.astro` ≤ ~150 líneas delegando en `PlanCard`/`HostingCard`.
- **INV-2** — color/medida por tokens; copy por props; sin lógica de dominio (recibe planes ya resueltos).

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: plans fiel con popular oscuro y excludes
  Given plans (uno popular) y hosting
  When se renderiza contra 07-plans.html
  Then coincide (bajo umbral): claro, popular card oscura escalada con badge, includes(check)+excludes(×), hosting claro
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-007/RF-1..5]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + variantes (popular/excludes) + a11y + gate de fidelidad.
- **PRs:** —
