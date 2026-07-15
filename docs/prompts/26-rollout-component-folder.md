---
type: Prompt
title: "Prompt 26 — Rollout component-as-folder a los organismos restantes + fix test `0.10`"
description: "Rollout component-as-folder a los organismos restantes + fix test `0.10`"
tags: [prompt]
timestamp: 2026-07-08T14:53:25-04:00
---

# Prompt 26 — Rollout component-as-folder a los organismos restantes + fix test `0.10`

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. El piloto de Hero ya validó el patrón
> (ver `docs/adr/0012-component-as-folder.md`); esto lo generaliza y deja el CI de `develop` en verde.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md` (§2 actualizado), `CLAUDE.md`,
`docs/adr/0012-component-as-folder.md` y la skill `design-to-components`. TDD + Atomic Design.
**Recuerda (AGENTS.md §4):** `docs/` se commitea. Usa **Explore/Plan** por componente.

## Referencia canónica
`src/components/Hero/` es el ejemplo ya migrado (barrel + `Hero.module.scss` con la frontera
local/`:global()` + `Hero.types.ts`). **Replica ese patrón exacto.**

## Tarea A — migrar los 8 organismos restantes a component-as-folder
Para cada uno, aplica [ADR-0012](/adr/0012-component-as-folder.md) (carpeta + `Name.astro` solo template + `Name.module.scss` +
`Name.types.ts` + `index.ts` barrel), portando el `<style>` a SCSS con la regla local/`:global()`:

| Componente | Límite `.astro` |
|---|---|
| `PainPoints` | ≤150 |
| `Value` | ≤150 |
| `HowItWorks` | ≤150 |
| `Plans` | ≤150 |
| `PlanCard` | ≤150 |
| `About` | ≤150 |
| `Contact` | ≤160 |
| `Footer` | ≤130 |

Reglas por componente (idénticas al piloto):
- **Local por defecto**; **`:global()`** para clases del design-system, hooks de `interactions.js` y
  hooks de gates/Playwright (patrón `:global()` anidado dentro de la local). Tokens siguen `var(--x)`.
- **Actualiza los consumidores** (imports en `index.astro` u otros → `../components/Name` vía barrel).
- **Actualiza TODAS las rutas de test** que apunten a la ruta plana `components/Name.astro` →
  `components/Name/Name.astro` (según el piloto, varios test files por componente).
- **Elimina los filtros `f !== 'Name.astro'`** en scans de `components/` (a11y-001, seo-001…): ahora
  `readdirSync` devuelve el directorio, que `endsWith('.astro')` descarta solo.
- **Sin cambios de copy ni props**; contenido desde Content Collections.

## Tarea B — arreglar el test frágil `0.10` (sigue en rojo)
`src/__tests__/qa-001.test.ts` → `[SPEC-QA-001/RNF-1] mobile threshold is 0.10 …` compara el **string**
`'0.10'`, pero prettier normaliza `0.10`→`0.1`. Cámbialo para validar el **valor numérico** del
`threshold` (extrae con regex y `toBeCloseTo(0.1)` / `toBeCloseTo(0.08)` en el test hermano). No
reintroduzcas el literal `0.10`.

## Tarea C — metodología
- Actualiza la skill `design-to-components` para que genere/asuma la estructura **component-as-folder**
  (barrel + `.module.scss` + `.types.ts`) por defecto, citando ADR-0012.

## Alcance
- **NO** es obligatorio migrar ahora los átomos/moléculas pequeños ya bajo límite; la estructura de
  carpeta es el estándar **para componentes nuevos o que se toquen**, y estos 8 organismos. El resto se
  migra oportunísticamente en otro incremento (evita un churn masivo). Si algún átomo se comparte entre
  los organismos migrados y conviene, migrarlo también.

## Gates (verdes, por componente antes de pasar al siguiente)
- **QA-001 (fidelidad)**: diff vs diseño **sin cambios** (píxeles; los hashes no afectan).
- **a11y** (axe) y **perf** (budgets) sin regresión.
- `[SPEC-SEC-XXX/INV-1]`: path actualizado; el `.astro` (solo template) pasa bajo su límite. No relajes números.

## Git y specs
- Rama `refactor/component-folder-rollout`; **un commit por organismo** (scope por sección), Conventional
  Commits, incluye `docs/`. Actualiza la **INV-1** de cada `SPEC-SEC-XXX` (nueva estructura de carpeta);
  mantiene `Verified` solo tras re-pasar el gate.

## Verificación final
```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check
```
Los 10 tests que fallaban ahora pasan (9 de línea vía carpeta + 1 de umbral), gate de fidelidad verde,
el nº de tests no baja. **CI de `develop` en verde.**

## Entregable
Los 8 organismos en component-as-folder (como Hero), el test `0.10` robusto, la skill actualizada. Resume
por componente: sub-estructura, inventario local/`:global()` si hubo algo no trivial, y confirma gate
verde. Con esto `develop` queda listo para el arranque del stage dev (prompts 23 → 21 → 22).
