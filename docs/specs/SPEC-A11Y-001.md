# SPEC-A11Y-001 — Accesibilidad transversal (WCAG 2.1 AA)

- **ID:** SPEC-A11Y-001
- **Estado:** Implemented
- **Épica / Story:** EPIC-08 / STORY-081 (accesibilidad)
- **Capa atómica:** cross-cutting (layout + CI)
- **Depende de:** SPEC-DS-001, SPEC-SEC-015 (home ensamblada)

## Contexto / problema

Cada sección se testeó con axe, pero falta la **auditoría a nivel de página** y los detalles
transversales (skip-link, orden de foco, landmarks, reduced-motion) + un **gate** que evite regresiones.

## Requisitos funcionales (testeables)

- **RF-1 (auditoría de página)** — axe sobre la **home montada** = **0 violaciones** WCAG AA.
- **RF-2 (skip-link)** — `BaseLayout` incluye un "skip to main content" como primer foco; `<main id>` presente; el skip-link **oculto hasta el foco** (no altera el gate de fidelidad visual).
- **RF-3 (landmarks + outline)** — estructura `header`/`nav`/`main`/`footer` completa; un solo `<h1>` (Hero); outline de headings válido.
- **RF-4 (teclado)** — todo lo interactivo alcanzable y operable por teclado con foco visible: menú móvil (`<details>`), FAQ (`<details>`), todos los CTAs/enlaces, campos del form. Orden de tabulación lógico.
- **RF-5 (contraste)** — verificar los pares texto/fondo realmente usados (tokens y estados, claro y oscuro) ≥ AA (4.5:1 texto normal, 3:1 grande).
- **RF-6 (reduced-motion)** — todas las animaciones (reveal, aurora, órbita, marquee, magnetic) respetan `prefers-reduced-motion: reduce` (ya en DS-001; aquí se verifica a nivel de página).
- **RF-7 (gate CI)** — axe de página corre en CI (home) y **bloquea** si hay violaciones.

## Requisitos no funcionales

- **RNF-1 (perf)** — el skip-link/estilos de foco no añaden JS.
- **RNF-2 (fidelidad)** — los añadidos a11y (skip-link oculto) **no** rompen el gate de fidelidad (QA-001).

## Invariantes

- **INV-1** — el gate de a11y es **bloqueante** en CI.
- **INV-2** — sin regresiones: un cambio que introduzca una violación AA falla el pipeline.
- **INV-3 (SRP)** — skip-link/estilos de foco en el layout/estilos globales, no duplicados por sección.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: home sin violaciones AA
  Given la home montada
  When corre axe (WCAG 2.1 AA)
  Then hay 0 violaciones

Scenario: skip-link operativo sin afectar el diseño
  Given la home
  When el usuario tabula una vez
  Then el primer foco es un "skip to main content" visible que lleva a <main>
  And en el estado por defecto (sin foco) el gate de fidelidad sigue verde

Scenario: navegación por teclado completa
  Given la home
  When se recorre solo con teclado
  Then menú móvil, FAQ, CTAs y campos del form son operables con foco visible
```

## Fuera de alcance

- Copy/SEO (SPEC-SEO-001), presupuestos de perf (SPEC-PERF-001).

## Trazabilidad

- **Tests:** `[SPEC-A11Y-001/RF-1..7]`, `[.../RNF-1..2]`, `[.../INV-1..3]` — axe de página, skip-link/landmarks/outline, recorrido de teclado, matriz de contraste, reduced-motion, gate de fidelidad intacto.
- **PRs:** —
