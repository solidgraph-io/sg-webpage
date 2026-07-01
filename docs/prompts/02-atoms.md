# Prompt 02 — Átomos (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md`, y las skills `.claude/skills/` (**`design-to-components`**
y `spec-driven-development`). La metodología (SDD + TDD + Atomic Design + SRP) es vinculante.

## Objetivo
Implementar **todos los átomos** del sistema de diseño, en estas specs ya Approved (en orden):
1. `docs/specs/SPEC-ATOM-001.md` — Heading, Eyebrow, Prose, Logo.
2. `docs/specs/SPEC-ATOM-002.md` — Button, Icon, Badge, PriceTag, Divider, Avatar.
3. `docs/specs/SPEC-ATOM-003.md` — Input, Textarea.

Ubicación: `apps/web/src/components/atoms/`. Fuente visual: `design/solidgraph-website.html`
(ábrelo para el look de cada átomo). Tokens/tipografía ya existen (SPEC-LAYOUT-001).

## Reglas (no negociables)
- **TDD:** por cada `RF-x`/`RNF-x`/`INV-x`, primero un test en **rojo** cuyo nombre cite la spec: `it('[SPEC-ATOM-002/RF-1] button renders as anchor when href is set')`. Luego verde mínimo, luego refactor.
- **Atomic Design + SRP:** cada átomo = **un archivo, una responsabilidad, ≤ ~150 líneas**, **hoja** (no compone otros átomos). Si algo crece, es señal de que era una molécula: párate y coméntalo.
- **Sin lógica de dominio en átomos** (Button no conoce "plan"; PriceTag solo formatea). **Sin copy/colores hardcodeados** (props/slot + tokens).
- **A11y AA** en todos: foco visible (Button/Input), `alt`/labels (Logo/Avatar/Input), Icon decorativo `aria-hidden` vs accesible con `label`, `aria-invalid`/`aria-describedby` (Input/Textarea). Tests con `vitest-axe`.
- **Sin JS de cliente** en los átomos (Button = enlace/botón nativo; iconos inline).
- **Git:** una rama por spec (`feature/SPEC-ATOM-001-typography-brand`, etc.) o una rama de épica si prefieres PRs pequeños encadenados; Conventional Commits con footer `[SPEC-ATOM-00x]` y scope `atom`.

## Pasos por spec
1. Lee la spec y abre el diseño para el estilo de cada átomo (variantes, tamaños, tonos).
2. Escribe los tests en rojo (render por variante con `astro/container` + a11y con axe + casos de estado: `disabled`, `external`, `invalid`, decorativo vs accesible).
3. Implementa cada átomo pequeño consumiendo tokens/utilidades de Tailwind.
4. Refactor; extrae utilidades compartidas si procede (sin convertir un átomo en compositor).
5. `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` en verde.
6. Actualiza Trazabilidad + Estado (`Implemented`) de cada spec y refleja el avance en `docs/05`.

## Detente y confirma con el humano si
- Un "átomo" necesita componer otros → probablemente es una molécula (no la crees aquí; coméntalo).
- Falta una variante/estado en la spec que el diseño exige → propón el cambio de spec antes de implementar.
- Vas a añadir una librería de iconos/UI pesada (preferimos SVG inline propio).

## Entregable
Los 12 átomos implementados y testeados, specs `Implemented`, `docs/traceability.md` con todos
sus RF/RNF/INV cubiertos. Al terminar, resume y confirma que la siguiente etapa son las
**moléculas** (EPIC-03): NavItem, CtaGroup, PlanFeature, StepItem, StatItem, TestimonialCard,
FaqItem, FeatureItem, PlanCard, FooterColumn, FormField.
