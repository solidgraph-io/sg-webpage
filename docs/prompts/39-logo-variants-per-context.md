---
type: Prompt
title: "Prompt 39 — Usar el variante de logo correcto en cada contexto (navbar / footer / hero)"
description: "Usar el variante de logo correcto en cada contexto (navbar / footer / hero)"
tags: [prompt]
timestamp: 2026-07-09T19:50:12-04:00
---

# Prompt 39 — Usar el variante de logo correcto en cada contexto (navbar / footer / hero)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Corrección de branding + assets.
> **Supersede el prompt 38** para el hero (este cambio también arregla el `image-aspect-ratio`).

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y las skills (Atomic/SRP, tokens,
component-as-folder, `design-to-components`). TDD + trazabilidad. Todo va contra `develop`.

## Problema

Todo el sitio renderiza el mismo `logo_avatar.png` (el ícono redondo) en vez de los variantes de marca
correctos, que ya existen en **`design/assets/`** pero **no** se copiaron a la app:

- Navbar (`apps/web/src/components/Logo.astro`): ícono avatar **+ wordmark "SolidGraph SOLUTIONS" tipeado a mano**.
- Footer (`apps/web/src/components/Footer/Footer.astro`): ícono avatar (+ wordmark de texto).
- Hero "core" (`apps/web/src/components/Hero/Hero.astro:102`, vía `home.yaml` `logoSrc`): ícono avatar en crudo.

## Assets a incorporar

Copia estos 4 `.webp` de `design/assets/` → **`apps/web/src/assets/`** (ignora los `*Zone.Identifier`):

| Asset (design/assets) | Uso |
| --- | --- |
| `logo_linear_primary_288h.webp` | **Navbar** (lockup horizontal completo: ícono + wordmark, color primary sobre la pill clara) |
| `logo_full_contrast_icon_288h.webp` | **Footer** (lockup completo en contrast, para el fondo oscuro del footer) |
| `logo_nav_icon_primary_288h.webp` | **Hero core** (ícono solo, primary, sobre el círculo blanco) |
| `logo_nav_icon_contrast_294h.webp` | **Solo disponible** — cópialo a assets, **no lo asignes** a ningún slot todavía |

> Astro `<Image>` sobre asset importado toma las dimensiones intrínsecas solo — **no** hardcodees width/height
> salvo para acotar el tamaño mostrado (usa `height`/`width` de layout + `object-fit` según haga falta).

## Cambios por componente

### 1. Navbar — `Logo.astro` (decisión: **solo la imagen lineal**)

- Reemplaza el `<Image>` del avatar por `logo_linear_primary_288h.webp` (import).
- **Elimina el `<span class="logo-text">…</span>`** (el wordmark ya está en la imagen). Mantén `alt="SolidGraph"`.
- **Quita el filtro de recolor** del CSS que recoloreaba el avatar (la imagen lineal ya viene en color).
- Ajusta el CSS para que el lockup se vea a la altura del nav (p. ej. `height: 34px; width: auto`), sin distorsión.
- Conserva el `href`/link wrapper y la accesibilidad (un solo nombre accesible "SolidGraph", sin texto duplicado).

### 2. Footer — `Footer.astro`

- Cambia el import `logo_avatar.png` → `logo_full_contrast_icon_288h.webp` y úsalo en el `<Image>`.
- Si el footer tiene además un **wordmark de texto** ("SolidGraph SOLUTIONS") al lado del logo, **quítalo**
  (el lockup `full` ya incluye el wordmark) para no duplicar. Mantén `alt="SolidGraph"`.
- Tamaño/alto acordes al footer, sin distorsión (`height` fijo + `width:auto` o `object-fit: contain`).

### 3. Hero core — `Hero.astro` (esto **supersede el prompt 38**)

- El "core" (círculo blanco de 92px) debe mostrar `logo_nav_icon_primary_288h.webp`.
- **Refactoriza a Astro `<Image>` importado** (como `Logo.astro`/`Footer.astro`) en vez del `<img>` crudo con
  `preview.logoSrc`. Así las dimensiones intrínsecas son correctas y **desaparece la distorsión** →
  el audit `image-aspect-ratio` (Best Practices) pasa. Aplica `width` ~58px + `height:auto` + `object-fit: contain`.
- La imagen es decorativa dentro del mockup → mantén `alt="SolidGraph"` (o `alt=""` + `aria-hidden` si el mockup
  ya es decorativo; respeta lo que dejó el prompt 37 para a11y).
- `home.yaml` `logoSrc`: ya no se usa para el core. O bien elimínalo del `home.yaml` + schema Zod + tipos
  (`Hero.types.ts`) + tests que lo referencien, **o** déjalo opcional sin uso. Elige lo que mantenga
  `pnpm type-check`/`trace` verdes sin dejar campos muertos aseverados por tests.
- **`/assets/logo_avatar.png`** (en `public/assets`) **se mantiene** para SEO/structured-data/og-image
  (`site.yaml` `logo`, `home.yaml` og) — **no** lo borres; el `seo-001.test.ts` lo asevera.

## Tests (coherencia SDD/TDD)

- `git grep -n "logo_avatar" apps/web/src` y revisa los tests que fijan el import/uso del avatar en Logo/Footer/Hero
  (p. ej. `sec-*.test.ts`, `seo-001.test.ts`): actualiza los de Logo/Footer/Hero al nuevo asset; **no** toques el
  de SEO (structured data sigue usando el avatar).
- Si algún test asevera la presencia de `.logo-text` en el navbar, actualízalo (ya no existe).
- Cita la spec correspondiente en los tests que ajustes.

## Fidelidad y a11y

- **QA-001 (fidelidad):** el render cambia (logos reales) → re-genera/compara contra el diseño de referencia
  en `design/`. Debería **acercarse** al diseño; si el gate marca deriva > tolerancia por el cambio esperado,
  reporta el diff para revisar.
- **A11y intacto:** un solo nombre accesible por logo, sin wordmark duplicado, headings sin tocar (100 se mantiene).

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check
```

- Verdes + `test:e2e`. Re-corre Lighthouse contra el preview: **Best Practices 100** (el hero ya no distorsiona
  la imagen) y las otras tres categorías en 100.

## Git (ciclo de vida — AGENTS.md §4)

Rama `feat/logo-variants-per-context` **desde `develop`**; Conventional Commit (`feat`, scope `ui`/`brand`),
incluye `docs/` y los assets. `pnpm exec prettier --write .` (solo código) antes de commitear. Al terminar y
verde: **merge a `develop` y borra la rama**.

## Entregable

Los 4 webp en `apps/web/src/assets/`; navbar con lockup lineal (sin texto tipeado ni filtro); footer con el
lockup contrast; hero core con el ícono primary (vía Astro Image, sin distorsión → Best Practices 100); ícono
contrast copiado y disponible; tests y fidelidad coherentes. Reporta archivos tocados.
