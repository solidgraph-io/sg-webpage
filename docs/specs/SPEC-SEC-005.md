# SPEC-SEC-005 — Sección 05: Value (propuesta de valor)

- **ID:** SPEC-SEC-005
- **Estado:** Verified
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001, SPEC-QA-001
- **Fuente:** `design/template/sections/05-value.html` (+ `components/{pillar,icon-box,eyebrow}.css`)

## Contexto / problema

"We Build It From Scratch…": sección **blanca** (`#fff`) con cabecera a 2 columnas y 4 pilares con
hover-fill. Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (estructura/estilo)** — `Value.astro` porta `05-value.html`: `value-head` (2 col: `Eyebrow`+h2 | `lead` con `strong`) y `pillars` (4 `pillar` blancos numerados: `num`, `IconBox`, título, texto) con **hover-fill** a gradiente oscuro. Fondo `#fff`.
- **RF-2 (contenido tipado)** — props: `heading`, `lead` {`strong?`,`text`}, `pillars[]` {`num?`,`icon`,`title`,`text`}. Copy por props.
- **RF-3 (hooks)** — `data-reveal="left"/"right"`/`--d` como la fuente.

## Requisitos no funcionales

- **RNF-1 (a11y)** — headings; contraste AA en reposo y en hover-fill (texto blanco sobre oscuro); foco visible.
- **RNF-2 (perf)** — hover por CSS; sin JS por sección.
- **RNF-3 (responsive)** — 2col→1col en cabecera; pillars 4→2→1.
- **RNF-4 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff contra `05-value.html` bajo umbral (desktop+mobile). Self-baselines (`toHaveScreenshot`) retirados per ADR-0014.

## Invariantes

- **INV-1 (SRP)** — un archivo ≤ ~150 líneas; extrae `Pillar` si crece.
- **INV-2** — color/medida por tokens; copy por props; usa `Eyebrow`/`IconBox`.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: pilares con hover-fill fieles
  Given lead y pillars
  When se renderiza contra 05-value.html
  Then coincide (bajo umbral): blanco, 4 pilares numerados con hover-fill oscuro
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-005/RF-1..3]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + a11y + gate de fidelidad.
- **PRs:** —
