---
type: ADR
title: "ADR-0012 — Component-as-folder: barrel + CSS Modules (SCSS) + types"
description: "Cada componente es una carpeta:"
tags: [adr]
timestamp: 2026-07-08T14:59:14-04:00
---

# ADR-0012 — Component-as-folder: barrel + CSS Modules (SCSS) + types

- **Estado:** Accepted (validado por el piloto de `Hero`, 2026-07)
- **Contexto atómico:** arquitectura de componentes (transversal)
- **Relacionado:** SPEC-DS-001 (port de CSS, tokens = fuente única), SPEC-QA-001 (gate de fidelidad),
  AGENTS.md §2 (Atomic Design + SRP)

## Contexto

El CSS portado del diseño vivía **inline** en el `<style>` de cada `.astro`, hinchando los archivos
(Hero 371 líneas, PlanCard 272, etc.) y disparando la invariante SRP de línea. Además no había lugar
natural para **tipos**, **stories** ni **tests co-localizados**. Queríamos mejor encapsulación sin
perder la estrategia de **CSS portado verbatim** ni la de **tokens como fuente única en runtime**.

## Decisión

Cada componente es una **carpeta**:

```
src/components/Name/
  Name.astro        # SOLO template + frontmatter mínimo (importa styles + types)
  Name.module.scss  # CSS portado a SCSS (CSS Modules + Sass)
  Name.types.ts     # interface de Props (deriva de z.infer del schema si aplica)
  index.ts          # barrel: export { default } from './Name.astro'
  Name.stories.*    # opcional (Storybook-Astro inmaduro → diferido; solo hueco)
  Name.test.ts      # opcional, co-localizado
```

### Reglas (vinculantes)

1. **Barrel** `index.ts` con `export { default } from './Name.astro'` → se importa como
   `../components/Name` (Astro/Vite resuelven `index.ts` por convención Node; sin fricción de tipos/HMR).
2. **CSS Modules + Sass** en `Name.module.scss`:
   - **Local por defecto** (hasheada, `class={styles.x}`, kebab → `styles['x-y']`): wrappers y piezas
     puramente internas del componente.
   - **`:global()` obligatorio** para clases que alguien externo necesita seleccionar por nombre:
     (a) clases del **design-system** compartidas (`.container`, `.grad-text`, botones, `.eyebrow`…),
     (b) clases que toca **`interactions.js`** (`.magnetic`, `.aurora`, `.in`…) o que se togglean por JS,
     (c) clases que enganchan los **gates de CI / selectores de Playwright** (QA-001).
   - **Patrón clave:** `:global()` anidado dentro de una local →
     `.hero-stage { :global(.f1) { … } }` compila a `.hash_hero-stage .f1 { … }` (padre hasheado,
     hijo seleccionable por FloatingCard/Playwright). Regla mnemónica: **si aparece en un selector de
     Playwright, en `interactions.js` o en un gate → `:global()`.**
   - **Tokens siguen siendo CSS custom properties** (`var(--x)`), **nunca** variables Sass (`$x`) —
     preservan runtime/theming (SPEC-DS-001/INV-1). Sass solo para ergonomía (nesting, mixins, `@use`);
     **no** se cambian valores (el CSS se porta verbatim salvo el nesting).
   - `@keyframes` globales (p. ej. `animations.css`) se **referencian** desde el módulo sin redefinir.
3. **SRP de línea** aplica al **`.astro` (solo template)**, ~≤150 líneas; el CSS ya no cuenta (vive en
   `.module.scss`). El límite deja de penalizar el CSS portado.

## Consecuencias

- Los tests de línea `[SPEC-SEC-XXX/INV-1]` apuntan a `components/Name/Name.astro`. Varios test files
  referenciaban la ruta plana → migrarlos es el trabajo más mecánico.
- Los filtros `f !== 'Name.astro'` en scans de `components/` (a11y-001, seo-001) se vuelven innecesarios:
  `readdirSync` devuelve el **directorio** `Name`, que `endsWith('.astro')` ya descarta.
- El **gate de fidelidad (QA-001) sigue siendo la red**: compara **píxeles**, así que los hashes de las
  clases no lo afectan mientras los hooks (JS/gate) sigan `:global()`.
- Habilita a futuro `*.stories.*` y `*.test.ts` co-localizados sin re-estructurar.

## Validación (piloto Hero)

`Hero.astro` 371 → **112** líneas (template); `Hero.module.scss` 259; `index.ts` 1; `Hero.types.ts` 22.
Barrel sin fricción; `interactions.js` intacto; gate de fidelidad verde. Inventario local/global de Hero
sirve de plantilla para el resto.
