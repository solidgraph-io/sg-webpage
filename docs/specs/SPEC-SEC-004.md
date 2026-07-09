# SPEC-SEC-004 — Sección 04: Pain Points (bento)

- **ID:** SPEC-SEC-004
- **Estado:** Verified
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001, SPEC-QA-001
- **Fuente:** `design/template/sections/04-pain-points.html` (+ `components/{bento-card,icon-box,section-head}.css`)

## Contexto / problema

"The Walls You Hit": sección **clara** (`--lilac-2`) con **bento grid**. Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (estructura/estilo)** — `PainPoints.astro` porta `04-pain-points.html`: `SectionHead`, **bento grid** de `bento-card` blancas (icono en `IconBox`, hover lift + halo) y una **`bento-feature`** oscura (`--indigo`) destacada. `wide` → `span 2`. Fondo `--lilac-2`.
- **RF-2 (contenido tipado)** — props: `heading`, `intro?`, `items[]` {`icon?`,`text`,`wide?`}, `feature?` {`title`,`text`}. Copy por props.
- **RF-3 (hooks)** — `data-reveal`/`--d` escalonados como la fuente.

## Requisitos no funcionales

- **RNF-1 (a11y)** — headings correctos; contraste AA (ink sobre claro; blanco sobre la card oscura); iconos decorativos `aria-hidden`.
- **RNF-2 (perf)** — hover/animación CSS; sin JS por sección.
- **RNF-3 (responsive)** — bento 4→2→1 columnas como el diseño.
- **RNF-4 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff contra `04-pain-points.html` bajo umbral (desktop+mobile). Self-baselines (`toHaveScreenshot`) retirados per ADR-0014.

## Invariantes

- **INV-1 (SRP)** — un archivo ≤ ~150 líneas; extrae `BentoCard` a componente propio si crece.
- **INV-2** — color/medida por tokens; copy por props; usa `IconBox`/`SectionHead`.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: bento claro con card feature oscura
  Given items y feature
  When se renderiza contra 04-pain-points.html
  Then coincide (bajo umbral): sección clara, cards blancas, feature oscura destacada
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-004/RF-1..3]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + a11y + gate de fidelidad.
- **PRs:** —
