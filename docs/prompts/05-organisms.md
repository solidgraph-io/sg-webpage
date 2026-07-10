---
type: Prompt
title: "Prompt 05 — Organismos (para Claude Code)"
description: "Implementar los 13 organismos contra el contrato ya congelado (SPEC-BLOCK-000, Implemented), en estas specs Approved y en este orden:"
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 05 — Organismos (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills `.claude/skills/` (`design-to-components`,
`spec-driven-development`). Metodología (SDD + TDD + Atomic Design + SRP) vinculante.

## Objetivo

Implementar **los 13 organismos** contra el contrato ya congelado (`SPEC-BLOCK-000`, Implemented),
en estas specs Approved y en este orden:

1. `SPEC-BLOCK-001` — Nav + Footer.
2. `SPEC-BLOCK-002` — Hero + CtaBand.
3. `SPEC-BLOCK-003` — PainPoints + ValueProp + About.
4. `SPEC-BLOCK-004` — Process + Stats.
5. `SPEC-BLOCK-005` — Testimonials + Faq.
6. `SPEC-BLOCK-006` — Pricing + MaintenancePlans.

Ubicación: `apps/web/src/components/organisms/`. El contenido real ya está en
`content/pages/home.json`. Fuente visual: `design/solidgraph-website.html`.

## Reglas (no negociables)

- **TDD:** por cada `RF/RNF/INV`, test en **rojo** citando la spec: `it('[SPEC-BLOCK-002/RF-1] hero renders single h1 + CtaGroup')`. Luego verde, luego refactor.
- **Composición, no duplicación:** cada organismo **compone las moléculas/átomos ya construidos** (Nav→NavItem/Logo/CtaGroup; Pricing→PlanCard; Faq→FaqItem; etc.). Prohibido reimplementar su markup; test que lo verifique.
- **SRP:** un organismo = un archivo, ≤ ~150 líneas, delegando en moléculas.
- **Sin JS de cliente:** menú móvil del Nav con **`<details>/<summary>`**; Faq con `<details>` (ya en la molécula). Nada de islands en M0.
- **Semántica:** cada organismo aporta su landmark (`<nav>`/`<footer>`/`<section aria-labelledby>`); un solo `<h1>` en toda la página (Hero).
- **Registro:** cada organismo sustituye su entrada `pending` en `lib/blocks.ts`; el test de consistencia de `SPEC-BLOCK-000` (INV-2) debe seguir verde. Al acabar `SPEC-BLOCK-006`, **0 pending**.
- **Regresión visual:** añade Playwright visual regression de cada organismo contra `design/solidgraph-website.html`.
- **Git:** una rama por spec (`feature/SPEC-BLOCK-001-structural`, …); Conventional Commits con footer `[SPEC-BLOCK-00x]`, scope `block`.

## Pasos por spec

1. Lee la spec y abre el diseño para el look de cada organismo.
2. Tests en rojo: render con contenido de `home.json` (`astro/container`) + a11y (axe) + composición (usa las moléculas) + casos clave (Nav móvil sin JS, un solo h1, Faq sin JS, plan highlighted no-solo-color) + regresión visual.
3. Implementa el organismo componiendo moléculas; estilos por tokens/utilidades.
4. Registra el componente en `lib/blocks.ts` (quita `pending`).
5. Refactor asegurando SRP.
6. `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` en verde. Actualiza Trazabilidad + Estado (`Implemented`) de la spec y `docs/05`.

## Detente y confirma con el humano si

- El diseño exige un campo no presente en el contrato (`SPEC-BLOCK-000` Apéndice A) → propón el cambio de contrato **antes** (no lo modifiques sin OK).
- Un organismo necesita interacción que no se resuelva con `<details>`/CSS → propón un island acotado antes de añadir JS.

## Entregable

Los 13 organismos implementados y testeados, **0 pending** en el registro, la **home completa
renderizando** (`pnpm dev`) fiel al diseño, specs `Implemented`, `docs/traceability.md` al día.
Con esto M0 (sitio en vivo) queda esencialmente alcanzado. Al terminar, resume y confirma que
lo siguiente es **EPIC-06 (form de leads)** o el pulido **SEO/PERF/A11Y** (EPIC-07/08).
