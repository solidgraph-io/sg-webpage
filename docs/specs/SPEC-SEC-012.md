# SPEC-SEC-012 — Sección 12: CTA strip

- **ID:** SPEC-SEC-012
- **Estado:** Approved
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001, SPEC-QA-001
- **Fuente:** `design/template/sections/12-cta.html` (+ `components/{cta-strip,aurora,button}.css`)

## Contexto / problema

"Get a Website Like This": **NO** es sección oscura completa — es un contenedor **claro** con una
**tarjeta oscura flotante** redondeada. Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (estructura/estilo)** — `CtaStrip.astro` porta `12-cta.html`: contenedor claro (`cta-wrap`) + `cta-strip` **oscura** (`--night`, `--radius-xl`, `Aurora` tenue) con `heading`, `subtitle?`, `Button`.
- **RF-2 (contenido tipado)** — props: `heading`,`subtitle?`,`cta`{`label`,`href`}. Copy por props.
- **RF-3 (hooks)** — `data-reveal`/`--d`; `.magnetic` en el CTA como la fuente.

## Requisitos no funcionales

- **RNF-1 (a11y)** — heading correcto; contraste AA (texto claro sobre la tarjeta oscura); foco visible en el CTA.
- **RNF-2 (perf)** — animación CSS; sin JS por sección.
- **RNF-3 (responsive)** — la tarjeta apila en móvil como el diseño.
- **RNF-4 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff contra `12-cta.html` bajo umbral (desktop+mobile). Self-baselines (`toHaveScreenshot`) retirados per ADR-0014.

## Invariantes

- **INV-1 (SRP)** — un archivo ≤ ~150 líneas.
- **INV-2** — color/medida por tokens; copy por props; usa `Aurora`/`Button`.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: cta es tarjeta oscura flotante, no sección
  Given heading, subtitle y cta
  When se renderiza contra 12-cta.html
  Then coincide (bajo umbral): fondo de sección claro + tarjeta oscura redondeada flotante con el CTA
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-012/RF-1..3]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + a11y + gate de fidelidad.
- **PRs:** —
