---
type: Prompt
title: "Prompt 40 — Recuperar Performance: dimensionar bien las Images de logo"
description: "Recuperar Performance: dimensionar bien las Images de logo"
tags: [prompt]
timestamp: 2026-07-10T21:23:58.631Z
---

# Prompt 40 — Recuperar Performance: dimensionar bien las Images de logo

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Regresión de performance tras el prompt 39.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4. Cambio pequeño de render (props de `<Image>`).
Todo va contra `develop`.

## Causa raíz de la regresión

Tras cambiar a los logos webp (prompt 39), el Performance bajó. Motivo: las `<Image>` del **navbar** y del
**footer** no declaran **dimensiones de salida**, así que Astro emite el asset a su resolución **intrínseca
(288px de alto)** aunque se muestren a 34–40px. Se sirven logos ~8× más grandes de lo necesario, y el del
navbar está **above-the-fold** (compite con el LCP y suma byte weight; sin width/height de salida además
arriesga CLS).

- `apps/web/src/components/Logo.astro:15` — `<Image src={logoLinear} alt="SolidGraph" />` (sin dimensiones; CSS `height:34px`).
- `apps/web/src/components/Footer/Footer.astro:53` — `<Image src={logoContrast} … style="height:40px" loading="lazy" />` (sin dimensiones de salida).
- `apps/web/src/components/Hero/Hero.astro:103` — ya tiene `width={58}`; **déjalo como está** (correcto).

## Fix — emitir al tamaño de display (con densidad retina)

Pásale a Astro la altura de salida = **2× la altura mostrada** y deja que calcule el ancho por el aspect-ratio
intrínseco, usando `densities` para HiDPI. Mantén el CSS `height` + `width:auto`.

**Navbar (`Logo.astro`):**
```astro
<Image src={logoLinear} alt="SolidGraph" height={68} densities={[1, 2]} />
```
(display 34px → salida base 68px de alto; Astro genera 1x/2x y añade `srcset`. Deja el CSS `.logo img { height:34px; width:auto }`.)

**Footer (`Footer.astro`):**
```astro
<Image src={logoContrast} alt="SolidGraph" height={80} densities={[1, 2]} loading="lazy" />
```
(display 40px → salida base 80px; mantiene `loading="lazy"`. Puedes conservar el `style` de tamaño o pasarlo a CSS del módulo.)

### Requisitos

- Deben quedar atributos `width`/`height` en el `<img>` resultante (Astro los infiere del asset) para **reservar
  espacio y evitar CLS**. Si hace falta, fija explícito el `width` calculado además del `height`.
- **No** cambies el hero core (`width={58}` ya limita la salida).
- Navbar: carga normal (eager por defecto está bien para un logo pequeño above-the-fold); **no** le pongas
  `loading="lazy"` (es LCP-adjacent). Footer sigue `lazy`.
- Si algún test asevera props del `<Image>` del logo, actualízalo citando la spec.

## Verificación — contra el BUILD DE PROD, no dev

`pnpm dev` (Vite sin minificar) da Performance ruidoso/bajo y **no** representa prod. Mide siempre contra el
preview del build:

```
pnpm build && pnpm --filter @solidgraph/web preview   # y corre Lighthouse contra ese puerto
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check
```

- Confirma **Performance de vuelta a 100** (o al nivel previo) en el preview, y que **A11y/Best Practices/SEO
  siguen en 100**.
- Revisa que el logo del navbar ya no aparezca como "properly size images" / gran contribuyente de bytes en el
  reporte.
- Gate de fidelidad QA-001 verde (el tamaño visual no cambia, solo la resolución servida).

## Git (ciclo de vida — AGENTS.md §4)

Rama `fix/logo-image-sizing` **desde `develop`**; Conventional Commit (`perf`/`fix`, scope `ui`), incluye `docs/`.
`pnpm exec prettier --write .` (solo código) antes de commitear. Al terminar y verde: **merge a `develop` y
borra la rama**.

## Entregable

Navbar y footer sirviendo el logo al tamaño de display (con retina), sin CLS; hero intacto; Performance
recuperado en el preview con las otras tres categorías en 100. Reporta archivos tocados y los números
antes/después del preview.
