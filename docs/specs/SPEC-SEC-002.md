# SPEC-SEC-002 — Sección 02: Hero

- **ID:** SPEC-SEC-002
- **Estado:** Verified
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001
- **Fuente:** `design/template/sections/02-hero.html` (+ `components/{aurora,floating-card,pill,button,icon-box}.css`)

## Contexto / problema
El hero: sección **oscura** (`--night`) con aurora, pill, titular, CTAs, snippet y el **panel de
preview 3D** con badges flotantes. Port 1:1.

## Requisitos funcionales (testeables)
- **RF-1 (estructura/estilo)** — `Hero.astro` porta `02-hero.html`: fondo oscuro, `Aurora`, `hero-grid-mesh`, `Pill` (con ping), `<h1>` claro centrado (único h1), subtítulo, `hero-ctas` (`Button` primary + ghost-light), snippet.
- **RF-2 (preview)** — porta el `hero-stage`/`hero-screen` (transform 3D, barra de navegador, lado izq/der con rings + core logo) y los `FloatingCard` (`bob`). Simplifica/oculta en móvil como el diseño.
- **RF-3 (contenido tipado)** — props: `pill?`, `title`, `subtitle?`, `ctas[]`, `snippet?`, `preview` (subcampos), `floats?[]`. Copy por props.
- **RF-4 (hooks)** — `data-reveal`/`--d` escalonados y `.magnetic` en CTAs, como la fuente.

## Requisitos no funcionales
- **RNF-1 (a11y)** — un solo `<h1>`; `section` etiquetada; contraste AA sobre oscuro; aurora/preview decorativos con `aria-hidden` donde aplique.
- **RNF-2 (perf)** — animaciones CSS + módulo global; imágenes optimizadas.
- **RNF-3 (responsive)** — apila; preview/floats se adaptan u ocultan en móvil.
- **RNF-4 (fidelidad)** — **regresión visual** contra `02-hero.html`.

## Invariantes
- **INV-1 (SRP)** — el Hero es rico; extrae sub-piezas (preview panel, floats) a componentes propios si supera ~150 líneas.
- **INV-2** — color/medida por tokens; copy por props; usa `Aurora`/`FloatingCard`/`Pill`/`Button`.

## Criterios de aceptación (Gherkin)
```gherkin
Scenario: Hero fiel con preview 3D
  Given el contenido del hero (pill, title, ctas, preview, floats)
  When se renderiza
  Then coincide con 02-hero.html: oscuro + aurora + panel 3D + floats, un solo h1
```

## Fuera de alcance
- Marquee (SPEC-SEC-003), resto de secciones.

## Trazabilidad
- **Tests:** `[SPEC-SEC-002/RF-1..4]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + a11y + regresión visual.
- **PRs:** —
