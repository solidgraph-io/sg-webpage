# SPEC-SEC-003 — Sección 03: Marquee

- **ID:** SPEC-SEC-003
- **Estado:** Verified
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001
- **Fuente:** `design/template/sections/03-marquee.html` (+ `components/marquee.css`)

## Contexto / problema

Banda oscura con texto en scroll continuo (CSS `scroll-x`), pausa en hover. Port 1:1.

## Requisitos funcionales (testeables)

- **RF-1 (estructura/estilo)** — `Marquee.astro` porta `03-marquee.html`: banda `--night`, `marquee-track` animado (`scroll-x`), items con separador (`dot`), duplicado para loop continuo; pausa en `:hover`.
- **RF-2 (contenido tipado)** — prop `items[]` (`label`). Copy por props.

## Requisitos no funcionales

- **RNF-1 (a11y)** — el marquee no atrapa foco; contenido legible; respeta `prefers-reduced-motion` (la animación se detiene/reduce).
- **RNF-2 (perf)** — animación CSS pura; sin JS.
- **RNF-3 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff impl vs `03-marquee.html` bajo umbral. Self-baselines (`toHaveScreenshot`) retirados per ADR-0014 (drift de entorno).

## Invariantes

- **INV-1 (SRP)** — un archivo, ≤ ~150 líneas.
- **INV-2** — color/medida por tokens; copy por props.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: Marquee scroll y pausa
  Given items
  When se renderiza
  Then la banda oscura desplaza los items en loop y se pausa al hover; reduced-motion la detiene
```

## Fuera de alcance

- Resto de secciones.

## Trazabilidad

- **Tests:** `[SPEC-SEC-003/RF-1..2]`, `[.../RNF-1..3]`, `[.../INV-1..2]` — render + reduced-motion + regresión visual.
- **PRs:** —
