---
type: Spec
title: "SPEC-SEC-008 — Sección 08: Testimonials (+ stats)"
description: "\"What Local Business Owners Are Saying\": clara (--lilac-2) con grid de stats + tarjetas de testimonio."
tags: [sec]
timestamp: 2026-07-09T00:32:49-04:00
---

# SPEC-SEC-008 — Sección 08: Testimonials (+ stats)

- **ID:** SPEC-SEC-008
- **Estado:** Verified
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001, SPEC-QA-001
- **Fuente:** `design/template/sections/08-testimonials.html` (+ `components/{stat,testimonial-card,section-head}.css`)

## Contexto / problema

"What Local Business Owners Are Saying": **clara** (`--lilac-2`) con grid de stats + tarjetas de
testimonio. Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (stats)** — grid de `stat` blancos: valor en **gradiente** (indigo→periwinkle) + label.
- **RF-2 (testimonials)** — `t-grid` de `TestimonialCard`: `stars` (amarillas `--star`), `quote`, y `t-author` (avatar en gradiente con iniciales + nombre + rol).
- **RF-3 (moléculas)** — extrae `TestimonialCard` como componente propio (SRP), portando `testimonial-card.css`; usa/ajusta `stat`.
- **RF-4 (contenido tipado)** — props: `eyebrow?`,`heading`,`stats?[]`{`value`,`label`}, `items[]`{`stars?`,`quote`,`author`,`role?`,`initials?`,`avatarSrc?`}. Copy por props.
- **RF-5 (hooks)** — `data-reveal`/`--d` escalonados.

## Requisitos no funcionales

- **RNF-1 (a11y)** — testimonios con `figure`/`blockquote`; estrellas con etiqueta accesible o `aria-hidden` + texto; contraste AA sobre claro.
- **RNF-2 (perf)** — hover por CSS; sin JS por sección.
- **RNF-3 (responsive)** — grids 3→1 columna.
- **RNF-4 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff contra `08-testimonials.html` bajo umbral (desktop+mobile). Self-baselines (`toHaveScreenshot`) retirados per ADR-0014.

## Invariantes

- **INV-1 (SRP)** — `Testimonials.astro` ≤ ~150 líneas delegando en `TestimonialCard`/`stat`.
- **INV-2** — color/medida por tokens; copy por props.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: testimonials claro con estrellas y stats en gradiente
  Given stats e items
  When se renderiza contra 08-testimonials.html
  Then coincide (bajo umbral): sección clara, stats en gradiente, cards con estrellas + avatar iniciales
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-008/RF-1..5]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + a11y + gate de fidelidad.
- **PRs:** —
