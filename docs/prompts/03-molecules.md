---
type: Prompt
title: "Prompt 03 — Moléculas (para Claude Code)"
description: "Implementar todas las moléculas (EPIC-03), en estas specs Approved (en orden):"
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 03 — Moléculas (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills `.claude/skills/` (`design-to-components`,
`spec-driven-development`). Metodología (SDD + TDD + Atomic Design + SRP) vinculante.

## Objetivo

Implementar **todas las moléculas** (EPIC-03), en estas specs Approved (en orden):

1. `docs/specs/SPEC-MOLECULE-001.md` — NavItem, CtaGroup, FooterColumn.
2. `docs/specs/SPEC-MOLECULE-002.md` — TestimonialCard, FeatureItem, StepItem, StatItem, FaqItem.
3. `docs/specs/SPEC-MOLECULE-003.md` — PlanFeature, PlanCard.
4. `docs/specs/SPEC-MOLECULE-004.md` — FormField.

Ubicación: `apps/web/src/components/molecules/`. Fuente visual: `design/solidgraph-website.html`.
Los **átomos ya existen** en `apps/web/src/components/atoms/` — reutilízalos.

## Reglas (no negociables)

- **TDD:** por cada `RF-x`/`RNF-x`/`INV-x`, primero un test en **rojo** que cite la spec: `it('[SPEC-MOLECULE-002/RF-5] FaqItem uses native details, no JS')`. Luego verde mínimo, luego refactor.
- **Composición, no duplicación:** cada molécula **compone átomos existentes** (`Button`, `Icon`, `Heading`, `Prose`, `Avatar`, `Badge`, `PriceTag`, `Input`, `Textarea`). Está **prohibido** reimplementar el markup de un átomo. Test que verifique que la molécula usa el átomo.
- **SRP:** una molécula = un archivo, una responsabilidad, ≤ ~150 líneas. `PlanCard` delega en `PlanFeature` y átomos para no crecer.
- **Sin JS de cliente:** `FaqItem` usa **`<details>/<summary>` nativo** (no island).
- **Sin lógica de dominio:** reciben datos ya resueltos por props (PlanCard no calcula precios).
- **A11y AA** con `vitest-axe`: `aria-current` (NavItem), disclosure por teclado (FaqItem), destacado no-solo-color (PlanCard), cableado label/`aria-describedby`/`aria-invalid` (FormField).
- **Git:** una rama por spec (`feature/SPEC-MOLECULE-001-nav-cta`, …); Conventional Commits con footer `[SPEC-MOLECULE-00x]`, scope `molecule`.

## Pasos por spec

1. Lee la spec y abre el diseño para el look de cada molécula.
2. Tests en rojo: render por variante (`astro/container`) + a11y (axe) + **composición** (que use los átomos) + casos clave (FaqItem sin JS, PlanFeature included/no, FormField con error, NavItem activo).
3. Implementa componiendo átomos; estilos por tokens/utilidades.
4. Refactor; asegura SRP (si algo pasa de ~150 líneas o compone otra molécula "de más", repórtalo).
5. `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` en verde.
6. Actualiza Trazabilidad + Estado (`Implemented`) de cada spec y `docs/05`.

## Detente y confirma con el humano si

- Una molécula necesita componer otra molécula de forma que parezca ya un organismo → coméntalo.
- El diseño exige una variante/estado no previsto en la spec → propón el cambio de spec antes.

## Entregable

Las 11 moléculas implementadas y testeadas, specs `Implemented`, `docs/traceability.md` al día.
Al terminar, resume y confirma que la siguiente etapa es **EPIC-04**: `SPEC-BLOCK-000`
(BlockRenderer + contrato Zod) y luego los organismos (Nav, Hero, …).
