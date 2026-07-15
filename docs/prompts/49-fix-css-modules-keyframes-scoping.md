---
type: Prompt
title: "Prompt 49 — Animaciones muertas: CSS Modules renombra animation-name y no encuentra los @keyframes globales"
description: "Los badges flotantes del hero y About (y el orbit de About) no animan: los @keyframes viven en el global animations.css pero se referencian desde *.module.scss, y CSS Modules localiza el animation-name a un nombre hasheado inexistente. Fix + test de regresión en runtime."
tags: [prompt, ui, bugfix, css]
timestamp: 2026-07-11T04:10:00Z
---

# Prompt 49 — Animaciones muertas (CSS Modules + `@keyframes` globales)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Bugfix de CSS con test de regresión.
> TDD + trazabilidad. Todo va contra `develop`.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4, **[ADR-0012](/adr/0012-component-as-folder.md)** (component-as-folder / CSS Modules) y
**[SPEC-DS-001](/specs/SPEC-DS-001.md)** (tokens + `animations.css`, RF-4: keyframes compartidos).

## Bug

Los **badges flotantes del hero y de About no animan**, y el **orbit de About no gira**.

**Causa raíz:** los `@keyframes` (`bob`, `spin`, `ping`, `float1..3`, `scroll-x`) están definidos en el **global**
`apps/web/src/styles/animations.css`, pero se **referencian desde CSS Modules**:

- `apps/web/src/components/Hero/Hero.module.scss` → `:global(.f1)`, `:global(.f2)` con `animation: bob …`
- `apps/web/src/components/About/About.module.scss` → `:global(.b1)`, `:global(.b2)`, `:global(.b3)` con
  `animation: bob …` y `:global(.orbit)` con `animation: spin …`

CSS Modules **localiza el valor de `animation-name`** por defecto → lo reescribe a un nombre hasheado
(`_bob_xxxx`) que **no existe** en el CSS global → la animación **no corre, en silencio**. Poner `:global()` en el
**selector** (que es lo que hay) **no** afecta al **valor** `animation-name`: son cosas distintas.

Comprobación de consistencia: `Marquee.astro`, `Aurora.astro` y `Pill.astro` usan `<style>` **scoped de Astro**
(que **no** renombra animation-names) y por eso **sí** siguen animando. Solo fallan los que pasaron a CSS Modules
(probablemente se rompió en la migración de ADR-0012). **No** es culpa del `inlineStylesheets: 'always'` del
prompt 47.

## Fix

Haz que el `animation-name` referenciado desde los módulos apunte al keyframe **global**. Orden de preferencia:

1. **Preferido — `:global()` en el valor**, manteniendo los estilos co-locados con el componente (ADR-0012):
   ```scss
   :global(.f1) {
     animation: :global(bob) 5s ease-in-out infinite;
   }
   ```
   Si Sass/PostCSS no digiere el shorthand, usa la forma larga:
   ```scss
   animation-name: :global(bob);
   animation-duration: 5s;
   animation-timing-function: ease-in-out;
   animation-iteration-count: infinite;
   animation-delay: 0.8s;
   ```
2. **Fallback** (si (1) no produce el nombre correcto): declara los keyframes necesarios **dentro del propio
   módulo** (se scopean juntos, referencia y definición, y funcionan). Documenta la duplicación.

**Verifica empíricamente cuál funciona** (no asumas): en el build, el `animation-name` **computado** de `.f1`
debe ser exactamente **`bob`**, no un hash.

Aplica a **todas** las referencias afectadas: `Hero.module.scss` (`.f1`, `.f2` → `bob`) y `About.module.scss`
(`.b1`, `.b2`, `.b3` → `bob`; `.orbit` → `spin`, conservando los overrides de `.o2`
`animation-duration`/`animation-direction`). Revisa si hay más módulos con `animation:` referenciando keyframes
globales (`git grep -n "animation:" apps/web/src/**/*.module.scss`) y arréglalos todos.

No toques `Marquee/Aurora/Pill` (funcionan). Respeta los bloques `@media (prefers-reduced-motion: reduce)` con
`animation: none` (siguen válidos).

## Test de regresión (esto es lo importante)

Un test estático de markup **no** habría cazado este bug: la clase está, el CSS está, y aun así no anima. Añade
un test **de runtime**:

- **E2E (Playwright)** `[SPEC-DS-001/RF-4]`: en la página cargada, el `animation-name` **computado** de
  `.f1`, `.f2`, `.b1`, `.b2`, `.b3` es `bob` y el de `.orbit` es `spin` (es decir, **no** un nombre hasheado y
  **no** `none`). Rojo antes del fix, verde después. Este test es el guardián contra que CSS Modules vuelva a
  comerse un `animation-name`.
- Opcional: extiende el test existente `[SPEC-DS-001/RF-4]` de `ds.test.ts` (que solo verifica que los
  `@keyframes` **existan** en `animations.css`) con una nota de que la existencia no implica que se apliquen.

## Documentar la trampa (para que no se repita)

Añade una línea a las **Consecuencias de ADR-0012** (o a la skill `design-to-components`, donde encaje mejor):
*"CSS Modules localiza `animation-name`: para usar un `@keyframes` global de `animations.css` desde un
`*.module.scss` hay que envolver el **nombre** en `:global()` — `:global()` en el selector no basta."*

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- Gates verdes. Visual: los badges flotantes del hero y de About **flotan** otra vez y el orbit **gira**.
- **QA-001 (fidelidad):** el estado estático no debería cambiar (la animación es movimiento, no layout); si el
  gate captura un frame intermedio y se vuelve flaky, congela la animación en la captura en vez de silenciar el
  gate.

## Git (ciclo de vida — AGENTS.md §4)

Rama `fix/css-modules-keyframes` **desde `develop`**; Conventional Commit (`fix`, scope `ui`/`ds`), incluye
`docs/`. `pnpm exec prettier --write .` (solo código). Al terminar y verde: **merge a `develop` y borra la rama**.

## Entregable

Animaciones `bob`/`spin` vivas otra vez en Hero y About (animation-name computado = keyframe global, no hash);
E2E de regresión sobre el `animation-name` computado; trampa documentada en ADR-0012/skill; gates verdes.
Reporta archivos tocados y si hubo más módulos afectados.
