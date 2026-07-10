---
type: Prompt
title: "Prompt 08 — Fase A: re-skin de organismos (para Claude Code)"
description: "Re-skinnear los 12 organismos existentes al tema y estructura correctos (v2), en estas specs Approved y en orden:"
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 08 — Fase A: re-skin de organismos (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills. Metodología (SDD + TDD + Atomic Design + SRP)
vinculante. Fuente de verdad visual: **`design/SolidGraph Website.html`**.

## Objetivo (Fase A del correctivo — impacto visual inmediato)

Re-skinnear los **12 organismos existentes** al tema y estructura correctos (v2), en estas specs
Approved y en orden:

1. `SPEC-BLOCK-101` — Nav + Footer
2. `SPEC-BLOCK-102` — Hero + CtaBand
3. `SPEC-BLOCK-103` — PainPoints (bento) + ValueProp + About
4. `SPEC-BLOCK-104` — Process (sticky) + Stats
5. `SPEC-BLOCK-105` — Testimonials + Faq
6. `SPEC-BLOCK-106` — Pricing + Hosting

Ya existen: sistema de diseño v2 (tokens/botones/`lib/animations.ts`) y contrato v2 + `home.json`
real (SPEC-LAYOUT-002 / BLOCK-100, Implemented). Aquí **corriges los componentes organismo**.

## Mapa de temas (corregido — respétalo)

- **Claras**: PainPoints (`--lilac-2`), ValueProp (`#fff`), Stats (`--lilac-2`), Testimonials (`--lilac-2`), FAQ (`#fff`), About (`--lilac-2`), Pricing (`#fff`), Hosting (`#fff`).
- **Oscuras** (`--night`/`--night-2`): Hero, Process ("how"), Footer.
- **Nav**: **píldora BLANCA translúcida** flotante (glass), texto `--ink`/`--indigo` — **NO oscuro**.
- **CtaBand**: sección **clara** con **tarjeta oscura flotante** redondeada (no sección oscura completa).
- **Plan popular**: card **oscura** escalada con `badge` (no solo color).

## Reglas (no negociables)

- **TDD:** por cada `RF/RNF/INV`, test en **rojo** citando la spec (`it('[SPEC-BLOCK-102/RF-3] CtaBand is a floating dark card in a light section')`), luego verde, luego refactor.
- **Fidelidad:** toma colores/estructura/valores del HTML real; **regresión visual** (Playwright) de cada organismo contra el diseño. Consume los **campos v2** (Hero preview/floats, plan excludes/bestFor, About cities/diffs, etc.).
- **Animaciones:** cablea los hooks `data-reveal`/`--d` (los mueve `lib/animations.ts`); no añadas JS propio por organismo.
- **Composición + SRP:** reutiliza las moléculas; si un organismo pasa de ~150 líneas, extrae sub-piezas a moléculas (BentoCard/Pillar/DiffItem/HostingCard…). Nada de copy/colores hardcodeados (props + tokens).
- **Registro:** cada organismo actualiza su entrada en `lib/blocks.ts`; el test de consistencia sigue verde.
- **Git:** una rama por spec (`feature/SPEC-BLOCK-101-nav-footer-v2`, …); Conventional Commits con footer `[SPEC-BLOCK-10x]`, scope `block`.

## Pasos por spec

1. Abre la sección correspondiente del diseño real y estúdiala (tema, estructura, hover, `data-reveal`).
2. Tests en rojo (render con `home.json` v2 + tema correcto + estructura v2 + a11y axe + composición + regresión visual + casos clave del mapa: Nav claro, CtaBand tarjeta flotante, popular oscuro, Faq plus-rota).
3. Re-skinnea el organismo (estructura + tema + campos v2) con tokens/utilidades.
4. Refactor asegurando SRP.
5. `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` en verde. Actualiza Trazabilidad + Estado (`Implemented`) de la spec y `docs/05`.

## Detente y confirma con el humano si

- Un dato requerido por el diseño no está en el schema v2 (Apéndice B de BLOCK-100) → propón el ajuste antes.
- Un organismo necesita interacción no cubierta por `lib/animations.ts`/`<details>` → proponlo antes de añadir JS nuevo.

## Entregable

Los 12 organismos con el **tema y estructura correctos**, fieles al diseño (regresión visual en
verde), specs `Implemented`, `docs/traceability.md` al día. La home debe verse **como el diseño**
salvo las 3 secciones nuevas (Marquee/Portfolio/Contact), que siguen en placeholder. Al terminar,
resume y confirma que sigue la **Fase B** (SPEC-BLOCK-107: Marquee + Portfolio + Contact).
