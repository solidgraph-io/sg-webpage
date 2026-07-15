---
type: Spec
title: "SPEC-SEC-010 — Sección 10: About (órbita/ciudades)"
description: "\"Developers Who Build From Scratch\": clara (--lilac-2), 2 columnas: visual con órbita animada + contenido (diffs + ciudades)."
tags: [sec]
timestamp: 2026-07-09T00:32:49-04:00
---

# SPEC-SEC-010 — Sección 10: About (órbita/ciudades)

- **ID:** SPEC-SEC-010
- **Estado:** Approved
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** [SPEC-DS-001](/specs/SPEC-DS-001.md), [SPEC-QA-001](/specs/SPEC-QA-001.md)
- **Fuente:** `design/template/sections/10-about.html` (+ `components/{floating-card,icon-box,eyebrow}.css`)

## Contexto / problema

"Developers Who Build From Scratch": **clara** (`--lilac-2`), 2 columnas: visual con **órbita
animada** + contenido (diffs + ciudades). Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (visual)** — `about-visual`: **órbita** dashed animada (`spin`, 2 anillos) + `center-logo` + `badge-card` flotantes (`bob`) de `visual.badges` (usa `FloatingCard`).
- **RF-2 (contenido)** — `Eyebrow?` + h2 + `sub?` + `body` (párrafos) + `diff-list` (`IconBox`+título+texto de `diffs`) + `about-cities` (2 `cities`).
- **RF-3 (moléculas)** — extrae `DiffItem` (y `CityItem` si conviene) como componentes propios (SRP).
- **RF-4 (contenido tipado)** — props: `eyebrow?`,`heading`,`sub?`,`body[]`,`diffs[]`{`icon`,`title`,`text`},`cities[]`{`name`,`note`},`visual`{`badges[]`{`icon`,`title`,`subtitle`}}. Copy por props.
- **RF-5 (hooks)** — `data-reveal`/`--d`; órbita `spin` respeta `prefers-reduced-motion`.

## Requisitos no funcionales

- **RNF-1 (a11y)** — headings; órbita/badges decorativos `aria-hidden`; contraste AA sobre claro.
- **RNF-2 (perf)** — animación CSS; sin JS por sección.
- **RNF-3 (responsive)** — 2col→1col; visual centrado en móvil; badges flotantes **ocultos ≤760px**
  (tamaño fijo en px sobre un `.about-visual` que encoge → se solapan; paridad con `.hero-float`.
  La información persiste en la `diff-list`. Decisión humana, prompt 50).
- **RNF-4 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff contra `10-about.html` bajo umbral (desktop+mobile). Self-baselines (`toHaveScreenshot`) retirados per [ADR-0014](/adr/0014-design-gate-sole-visual-regression.md).

## Invariantes

- **INV-1 (SRP)** — `About.astro` ≤ ~150 líneas delegando en `DiffItem`/`FloatingCard`.
- **INV-2** — color/medida por tokens; copy por props.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: about con órbita y ciudades
  Given body, diffs, cities y visual.badges
  When se renderiza contra 10-about.html
  Then coincide (bajo umbral): claro, órbita animada con badges, diffs y 2 ciudades
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-010/RF-1..5]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + a11y + reduced-motion + gate de fidelidad.
- **PRs:** —
