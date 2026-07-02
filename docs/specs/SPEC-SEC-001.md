# SPEC-SEC-001 — Sección 01: Nav

- **ID:** SPEC-SEC-001
- **Estado:** Implemented
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001
- **Fuente:** `design/template/sections/01-nav.html` (+ `components/logo.css`, `button.css`)

## Contexto / problema
Barra de navegación. Se porta 1:1 desde su HTML de sección, usando las primitivas compartidas.

## Requisitos funcionales (testeables)
- **RF-1 (estructura/estilo)** — `Nav.astro` porta el markup/CSS de `01-nav.html`: **píldora blanca translúcida flotante** (`.nav-inner`, glass/blur), `Logo`, enlaces de navegación, `Button` CTA (pill). Fiel a la fuente.
- **RF-2 (contenido tipado)** — props tipadas: `links[]` (`label`,`href`,`active?`), `cta` (`label`,`href`). Nada de copy hardcodeado.
- **RF-3 (móvil sin JS)** — menú móvil con `<details>/<summary>` accesible (breakpoint del diseño). Los estados `scrolled`/`hide` los aplica `interactions.js` (DS-001); el organismo solo aporta clases/markup.
- **RF-4 (hooks)** — `data-reveal`/`.magnetic` donde el diseño los use.

## Requisitos no funcionales
- **RNF-1 (a11y)** — `<nav aria-label>`, `aria-current` en el activo, menú operable por teclado, contraste AA (ink/indigo sobre glass).
- **RNF-2 (perf)** — sin JS propio (usa el módulo global).
- **RNF-3 (fidelidad)** — **regresión visual** (Playwright) contra `01-nav.html`.

## Invariantes
- **INV-1 (SRP)** — un archivo, ≤ ~150 líneas; usa `Logo`/`Button`.
- **INV-2** — color/medida por tokens; copy por props.

## Criterios de aceptación (Gherkin)
```gherkin
Scenario: Nav píldora clara fiel
  Given los links y cta
  When se renderiza Nav
  Then coincide visualmente con 01-nav.html (píldora blanca glass) y el activo lleva aria-current
```

## Fuera de alcance
- Resto de secciones.

## Trazabilidad
- **Tests:** `[SPEC-SEC-001/RF-1..4]`, `[.../RNF-1..3]`, `[.../INV-1..2]` — render + a11y + teclado + regresión visual.
- **PRs:** —
