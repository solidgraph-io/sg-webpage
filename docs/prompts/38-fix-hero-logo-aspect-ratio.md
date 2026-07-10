---
type: Prompt
title: "Prompt 38 — Best Practices a 100: aspect-ratio del logo del hero (fix CSS)"
description: "Best Practices a 100: aspect-ratio del logo del hero (fix CSS)"
tags: [prompt]
timestamp: 2026-07-09T19:50:12-04:00
---

# Prompt 38 — Best Practices a 100: aspect-ratio del logo del hero (fix CSS)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Cierra el último gap de Lighthouse.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y las skills (tokens, component-as-folder,
SRP). Cambio **solo de CSS** en un componente. Todo va contra `develop`.

## Estado (medido con Lighthouse tras el prompt 37)

- **Accessibility = 100** ✅ (el `heading-order` ya pasa; la parte A del 37 quedó bien).
- **Performance / SEO** — 100 en build de prod (la corrida de `pnpm dev` baja Perf por Vite sin minificar;
  **no es un problema real**, el gate corre contra `preview`/prod).
- **Best Practices = 96** ❌ — **única** auditoría fallando: `image-aspect-ratio` en `/assets/logo_avatar.png`
  (el logo del hero).

## Causa raíz CONFIRMADA (no son los atributos, es el CSS)

El `<img>` del hero ya declara los atributos correctos (`width="196" height="294"`, ratio natural 0.67),
pero la regla CSS en **`apps/web/src/components/Hero/Hero.module.scss`** solo fija el **ancho** y deja el
alto sin control proporcional:

```scss
:global(.core) {
  width: 92px;
  height: 92px;
  ...
  img {
    width: 58px;   // ← sin height proporcional → el alto queda en ~294px
  }
}
```

Resultado medido por Lighthouse: **displayed 58×294 (ratio 0.20)** vs **natural 196×294 (0.67)** → el logo
sale **aplastado horizontalmente** y falla el audit. (Antes del 37 era 58×58; el cambio de atributos sin
tocar el CSS lo dejó peor.)

## Fix (CSS, en `Hero.module.scss` → `:global(.core) img`)

Haz que el **box renderizado respete la relación natural 196:294** y quede sin distorsión. Aplica ambas
cosas (belt-and-suspenders):

```scss
img {
  width: 58px;
  height: auto;          // escala por el aspect-ratio de los atributos → ~87px (ratio 0.67)
  object-fit: contain;   // Lighthouse exime del audit a imágenes con object-fit ≠ fill; sin distorsión
}
```

- **58×~87** cabe dentro del `.core` de 92×92, así que no rompe el layout del mockup.
- Si `height: auto` por sí solo no bastara en algún navegador, fija explícito `height: 87px` (58 × 294/196 ≈ 87),
  manteniendo `object-fit: contain`.
- **No** cambies los atributos del `<img>` (196×294 son los correctos) ni el ancho de 58px (es el del diseño).

## Reglas

- Solo tocas `Hero.module.scss` (CSS). Sin componentes gigantes, sin secretos, tokens intactos.
- **Fidelidad (QA-001):** el logo pasa de aplastado a proporcionado — debería **mejorar** o quedar igual la
  fidelidad vs el diseño de referencia; confirma que el gate QA-001 sigue verde.
- Si algún test asevera el CSS del `.core img` (poco probable), actualízalo.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check
```

- `pnpm test` + gate de fidelidad verdes.
- Re-corre Lighthouse (o el gate de perf/BP) contra el build/preview y confirma **Best Practices 100**
  (sin `image-aspect-ratio`). Con eso: **Perf 100 / A11y 100 / Best Practices 100 / SEO 100**.

## Git (ciclo de vida — AGENTS.md §4)

Rama `fix/hero-logo-aspect-ratio` **desde `develop`**; Conventional Commit (`fix`, scope `ui`/`hero`),
incluye `docs/`. `pnpm exec prettier --write .` (solo código) antes de commitear. Al terminar y verde:
**merge a `develop` y borra la rama**.

## Entregable

`.core img` con aspect-ratio correcto (width 58 + height proporcional/auto + object-fit contain); logo del
hero sin distorsión; `image-aspect-ratio` en verde; **Lighthouse 100 en las cuatro categorías**. Reporta el
archivo tocado.
