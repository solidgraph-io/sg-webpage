---
type: Spec
title: "SPEC-SEC-011 — Sección 11: FAQ"
description: "\"Questions We Hear All the Time\": blanca (#fff), lista de FAQ con disclosure nativo."
tags: [sec]
timestamp: 2026-07-09T00:32:49-04:00
---

# SPEC-SEC-011 — Sección 11: FAQ

- **ID:** SPEC-SEC-011
- **Estado:** Approved
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001, SPEC-QA-001
- **Fuente:** `design/template/sections/11-faq.html` (+ `components/{faq-item,section-head}.css`)

## Contexto / problema

"Questions We Hear All the Time": **blanca** (`#fff`), lista de FAQ con disclosure nativo. Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (estructura/estilo)** — `Faq.astro` porta `11-faq.html`: `SectionHead` + `faq-list` de `FaqItem`.
- **RF-2 (FaqItem)** — molécula `FaqItem` con **`<details>/<summary>`** nativo: `summary` con icono **`plus`** que **rota 135°** al abrir (`[open]`, pasa a periwinkle), `answer` en `--muted`. **Sin JS.**
- **RF-3 (contenido tipado)** — props: `eyebrow?`,`heading`,`items[]`{`question`,`answer`}. Copy por props.
- **RF-4 (hooks)** — `data-reveal`/`--d` escalonados.

## Requisitos no funcionales

- **RNF-1 (a11y)** — disclosure operable por teclado sin JS; contraste AA sobre claro.
- **RNF-2 (perf)** — sin JS por sección (FAQ nativo; rotate por CSS).
- **RNF-3 (responsive)** — lista fluida.
- **RNF-4 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff contra `11-faq.html` bajo umbral (desktop+mobile). _(Estado consistente: cerrado por defecto.)_ Self-baselines (`toHaveScreenshot`) retirados per ADR-0014.

## Invariantes

- **INV-1 (SRP)** — `Faq.astro` ≤ ~150 líneas delegando en `FaqItem`.
- **INV-2** — color/medida por tokens; copy por props.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: faq plus rota al abrir, sin JS
  Given items
  When se renderiza contra 11-faq.html y se abre un item
  Then coincide (bajo umbral): blanco, plus rota 135° a periwinkle, operable por teclado sin JS
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-011/RF-1..4]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + teclado + a11y + gate de fidelidad.
- **PRs:** —
