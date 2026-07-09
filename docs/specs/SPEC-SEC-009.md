# SPEC-SEC-009 — Sección 09: Portfolio

- **ID:** SPEC-SEC-009
- **Estado:** Verified
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001, SPEC-QA-001
- **Fuente:** `design/template/sections/09-portfolio.html` (+ `components/{portfolio-card,section-head,button}.css`)

## Contexto / problema

"Our Work": **blanca** (`#fff`) con grid de tarjetas de trabajos + CTA central. Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (estructura/estilo)** — `Portfolio.astro` porta `09-portfolio.html`: `SectionHead`, `p-grid` de `PortfolioCard` (thumb con SVG que escala en hover, `p-tag`, `category`, título, `location`, descripción) + `center-cta` (`Button`).
- **RF-2 (moléculas)** — extrae `PortfolioCard` como componente propio (SRP), portando `portfolio-card.css`.
- **RF-3 (contenido tipado)** — props: `eyebrow?`,`heading`,`subheading?`,`items[]`{`category`,`title`,`location?`,`description`,`tag?`,`thumb?`},`cta?`. Copy por props.
- **RF-4 (hooks)** — `data-reveal`/`--d` escalonados.

## Requisitos no funcionales

- **RNF-1 (a11y)** — headings; thumbs decorativos `aria-hidden` o con alt significativo; contraste AA.
- **RNF-2 (perf)** — hover por CSS; sin JS por sección.
- **RNF-3 (responsive)** — 3→1 columna.
- **RNF-4 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff contra `09-portfolio.html` bajo umbral (desktop+mobile). Self-baselines (`toHaveScreenshot`) retirados per ADR-0014.

## Invariantes

- **INV-1 (SRP)** — `Portfolio.astro` ≤ ~150 líneas delegando en `PortfolioCard`.
- **INV-2** — color/medida por tokens; copy por props.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: portfolio fiel
  Given items y cta
  When se renderiza contra 09-portfolio.html
  Then coincide (bajo umbral): blanco, tarjetas con thumb/tag/category/location, CTA central
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-009/RF-1..4]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + a11y + gate de fidelidad.
- **PRs:** —
