---
type: Prompt
title: "Prompt 25 — PILOTO: componente-en-carpeta (barrel + CSS Modules + types) en Hero"
description: "Validar la nueva estructura component-as-folder en un solo componente (Hero) y reportar qué funciona y qué fricciona, para luego codificarla como metodología."
tags: [prompt]
timestamp: 2026-07-08T00:08:46-04:00
---

# Prompt 25 — PILOTO: componente-en-carpeta (barrel + CSS Modules + types) en Hero

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. **Es un piloto para VALIDAR el patrón**
> antes de aplicarlo a todos los componentes. No migres nada más que Hero.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md` y las skills. TDD + Atomic
Design. **Recuerda (AGENTS.md §4):** `docs/` se commitea. Usa subagentes **Explore** (mapear qué clases
usa Hero: propias vs design-system vs hooks de JS/gate) y **Plan** (frontera local/global) antes de tocar.

## Objetivo
Validar la nueva estructura **component-as-folder** en **un solo componente (Hero)** y reportar qué
funciona y qué fricciona, para luego codificarla como metodología. Elegimos Hero porque ejercita **todo**
lo difícil: dominado por CSS + hooks de `interactions.js` + hooks del gate de fidelidad.

## Estructura objetivo
```
src/components/Hero/
  Hero.astro          # SOLO template + frontmatter mínimo (importa styles + types)
  Hero.module.scss    # CSS portado a SCSS; clases locales por defecto, :global() para hooks
  Hero.types.ts       # interface de Props (deriva de z.infer del schema si aplica)
  index.ts            # barrel: export { default } from './Hero.astro'
  # Hero.stories.* → NO crear stories reales (Storybook-Astro inmaduro); solo deja hueco si es trivial
  # Hero.test.ts → co-localiza aquí el/los test de Hero si ayuda; o mantenlos donde están
```

**Setup previo:** añade la dependencia `sass` (dev) en `apps/web` (Astro procesa `.scss` nativo).

## Reglas de la migración (el núcleo del piloto)
1. **CSS → `Hero.module.scss`**: mueve el `<style>` del `.astro` al `.module.scss`, portando las reglas
   **lo más verbatim posible** (puedes usar nesting de SCSS para compactar, pero **no** cambies valores).
   Elimina el `<style>` del `.astro`. **Los tokens siguen siendo CSS custom properties** (`var(--x)`);
   **NO** conviertas tokens a variables Sass (`$x`) — romperían el runtime/theming (SPEC-DS-001/INV-1).
   Sass solo para ergonomía (nesting, mixins, `@use`).
2. **Frontera local/global (CRÍTICO)** — en `Hero.module.css`:
   - **Local** (hasheadas) = clases propias e internas de Hero.
   - **`:global()`** obligatorio para: (a) clases del **design-system** que Hero usa pero no posee
     (`.container`, `.grad-text`, botones, `.eyebrow`, `.section-head`, etc.); (b) clases que toca
     **`interactions.js`** (`.magnetic`, `.aurora`, `.in`, y las que use el reveal si son de clase);
     (c) clases que engancha el **gate QA-001** (el gate inyecta CSS sobre `.aurora b`, `.spotlight`,
     `.hero-grid-mesh` — deben seguir siendo globales). Atributos (`data-reveal`, `data-*`) no cambian.
3. **Markup**: referencia las clases locales como `class={styles.x}` (kebab → `styles['preview-card']`).
   Las globales/atributos se quedan como están.
4. **Consumidores**: actualiza el import en `index.astro` para usar el barrel (`../components/Hero`).
   Verifica que `interactions.js` y el helper del gate (`tests/visual/helpers.ts` / specs) sigan
   seleccionando los hooks (ahora globales) correctamente; ajústalos si hiciera falta.
5. **Nada de cambios de copy ni de props**; el contenido sigue viniendo de las Content Collections.

## Gates (deben quedar verdes)
- **Fidelidad QA-001 (hero)**: el diff vs el diseño **no cambia** (píxeles idénticos; los hashes no
  afectan). Este es el juez del piloto.
- **a11y** (axe) y **perf** (budgets) sin regresión.
- **`[SPEC-SEC-002/INV-1]`**: actualiza el path del test a `components/Hero/Hero.astro`; ahora el `.astro`
  (solo template) pasa holgado bajo su límite. No relajes el número.

## Verificación
```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check
```

## Git
- Rama `refactor/pilot-hero-component-folder`; Conventional Commits (scope `hero`); incluye `docs/`.
- Actualiza **SPEC-SEC-002** (INV-1): nueva estructura de carpeta; mantiene `Verified` **solo tras**
  re-pasar el gate.

## Entregable — REPORTE para decidir la metodología
Al terminar, además del resumen habitual, responde explícitamente:
1. ¿El **barrel** (`index.ts` re-exportando el `.astro`) funcionó sin fricción de tipos/HMR? ¿Algún ajuste?
2. **Inventario final local vs `:global()`** de las clases de Hero (esto será la plantilla de la regla).
3. ¿Hubo que tocar `interactions.js` o el helper del gate por los hooks? ¿Qué exactamente?
4. ¿Cuántas líneas quedó `Hero.astro` (solo template) y `Hero.module.scss`?
5. ¿**Sass + CSS Modules** compusieron sin problema (nesting + `:global()` + hashes)? ¿Los tokens
   `var(--x)` siguen resolviéndose bien?
6. Fricciones o sorpresas que debamos codificar antes de aplicar esto a los ~30 componentes.
```
```
