# SPEC-SEC-006 — Sección 06: How It Works (sticky)

- **ID:** SPEC-SEC-006
- **Estado:** Verified
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001, SPEC-QA-001
- **Fuente:** `design/template/sections/06-how-it-works.html` (+ `components/{step,aurora,eyebrow,button}.css`)

## Contexto / problema

"How It Works": sección **oscura** (`--night`, aurora tenue) a 2 columnas: izquierda **sticky** +
pasos con duración. Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (estructura/estilo)** — `HowItWorks.astro` porta `06-how-it-works.html`: `Aurora` tenue; columna izquierda **sticky** (`Eyebrow` peri, h2 claro, intro, `how-progress` barras, `ctas` con `Button`); columna derecha `steps` (cada `step`: `num` en gradiente, `h4` + `dur` pill + texto). Fondo `--night`.
- **RF-2 (contenido tipado)** — props: `eyebrow?`, `heading`, `intro?`, `progress?` (nº), `ctas?[]`, `steps[]` {`title`,`duration?`,`text`}. Copy por props.
- **RF-3 (hooks)** — `data-reveal="left"/"right"`/`--d` como la fuente.

## Requisitos no funcionales

- **RNF-1 (a11y)** — pasos como lista/ordinal semántica; sticky no atrapa foco; contraste AA (claro sobre oscuro).
- **RNF-2 (perf)** — sticky/hover por CSS; sin JS por sección.
- **RNF-3 (responsive)** — 2col→1col (sticky→estático) en móvil.
- **RNF-4 (fidelidad)** — **gate QA-001**: diff contra `06-how-it-works.html` bajo umbral (desktop+mobile).

## Invariantes

- **INV-1 (SRP)** — un archivo ≤ ~150 líneas; extrae `Step` si crece.
- **INV-2** — color/medida por tokens; copy por props; usa `Aurora`/`Eyebrow`/`Button`.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: how-it-works oscuro con sticky y duraciones
  Given steps con duration y progress
  When se renderiza contra 06-how-it-works.html
  Then coincide (bajo umbral): oscuro, columna izquierda sticky, pasos con duración
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-006/RF-1..3]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + a11y + gate de fidelidad.
- **PRs:** —
