---
type: Prompt
title: "Prompt 37 — Lighthouse a 100: orden de headings (a11y) + aspect-ratio de imagen (best practices)"
description: "El sitio saca Perf 100 / A11y 99 / Best Practices 96 / SEO 100."
tags: [prompt]
timestamp: 2026-07-09T18:49:21-04:00
---

# Prompt 37 — Lighthouse a 100: orden de headings (a11y) + aspect-ratio de imagen (best practices)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Pulido de calidad; no toca lógica.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y respeta las skills (Atomic/SRP, tokens,
component-as-folder). TDD + trazabilidad. Todo va contra `develop`.

## Contexto (medido en el stage dev con Lighthouse)

El sitio saca **Perf 100 / A11y 99 / Best Practices 96 / SEO 100**. Faltan dos auditorías para dejar
**todo en 100**, ambas acotadas:

1. **A11y 99 — "Heading elements are not in a sequentially-descending order".** Varias secciones
   eligieron el nivel del heading por su **tamaño visual**, no por la jerarquía → hay saltos `h1→h4`,
   `h2→h4`, y un `h5` suelto.
2. **Best Practices 96 — "Displays images with incorrect aspect ratio".** `/assets/logo_avatar.png` en el
   hero se muestra **58×58** (ratio 1.0) pero el asset natural es **196×294** (ratio 0.67) → distorsión /
   dimensiones mal declaradas.

## Parte A — Orden de headings (lleva A11y a 100)

**Principio:** el nivel semántico (`h1..h6`) debe seguir la **jerarquía del documento**, no el tamaño.
El tamaño visual se conserva con una **clase/token**, no con el tag. **No** debe cambiar el render
(gate de fidelidad QA-001 verde). Mapa exacto a corregir:

| Archivo | Actual | Cambiar a | Motivo |
| --- | --- | --- | --- |
| `apps/web/src/components/Hero/Hero.astro:85` `<h4 set:html={preview.title} />` ("Built for your business — line by line") | `h4` tras el `h1` del hero | **quitar del outline**: pásalo a `<p class="preview-title">` con el mismo estilo (es texto decorativo dentro del mockup). *Alt aceptable: `<h2>`.* | elimina el salto `h1→h4` |
| `apps/web/src/components/HowItWorks/HowItWorks.astro:56` `<h4>` (los 4 pasos) | `h4` bajo el `h2` de sección | **`h3`** | `h2→h3` sin salto |
| `apps/web/src/components/DiffItem.astro:21` `<h4>{title}</h4>` (tarjetas de About) | `h4` bajo el `h2` de About | **`h3`** | `h2→h3` sin salto |
| `apps/web/src/components/Contact/Contact.astro:32` `<h4>{altHeading}</h4>` ("Prefer a direct conversation?") | `h4` bajo el `h2` de Contact | **`h3`** | `h2→h3` sin salto |
| `apps/web/src/components/Footer/Footer.astro:69` `<h5>{col.heading}</h5>` (columnas Navigate/Plans/Get in Touch) | `h5` | **`h2`** (subir de nivel **no** dispara la auditoría de "descending"; visualmente pequeño vía clase) | evita el salto hacia `h5` |

**Preservar el tamaño visual:** donde el estilo colgaba del selector de tag (`h4 {…}`, `h5 {…}` en el
`*.module.scss`/`<style>` del componente), muévelo a una **clase** (p. ej. `.stepTitle`, `.diffTitle`,
`.altTitle`, `.footerColTitle`) aplicada al nuevo tag, usando los **tokens** existentes. Sin componentes
gigantes ni estilos globales nuevos salvo los `:global()` justificados.

**Tests:**

- `apps/web/src/__tests__/sec-010.test.ts:72` asevera que `DiffItem` contiene `'h4'` →
  actualízalo a **`'h3'`** (mantén el tag `[SPEC-SEC-010/RF-3]`).
- Ningún otro test fija estos niveles (verificado). Si añades/ajustas cobertura de a11y, cita la spec.

*(Opcional, si te resulta natural y no infla el diff: extraer un átomo `Heading` component-as-folder con
`as`/`level` semántico + `size` visual desacoplados, y usarlo en estos puntos. Si lo haces, requiere una
ADR breve en `docs/adr/` y actualizar la spec de la sección. Si no, el fix por clase de arriba es
suficiente para llegar a 100.)*

## Parte B — Aspect-ratio de la imagen del hero (lleva Best Practices a 100)

`apps/web/src/components/Hero/Hero.astro:102`:

```astro
<img src={preview.logoSrc} alt="SolidGraph" width="58" height="58" />
```

El asset natural es **196×294** (ratio 0.67); mostrarlo **58×58** lo distorsiona y Lighthouse lo marca.
El **header y el footer** ya muestran este mismo logo **bien** (vía el `<Image>` optimizado de Astro con
la relación natural). Alinea el hero con ese patrón:

- **Preferido:** renderiza el logo con el mismo patrón `<Image>` (asset importado) que `Logo.astro` /
  `Footer.astro`, con `width`/`height` que **respeten la relación natural 196:294** (p. ej. 58×87), de modo
  que la ratio mostrada == natural.
- **Alternativa** (si el diseño exige un marco cuadrado fijo): mantén el marco 58×58 pero usa
  `object-fit: contain` en la imagen (Lighthouse exime a las imágenes con `object-fit` ≠ `fill`), sin
  distorsión.
- **Elige la opción que mantenga el gate de fidelidad QA-001 verde** contra el diseño de referencia. Ningún
  test asevera estas dimensiones (verificado).

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check
```

- `pnpm test` + `test:e2e` verdes; **gate de fidelidad QA-001 verde** (el render no cambia).
- Re-corre Lighthouse (o el gate de a11y/perf) y confirma **A11y 100** (sin "heading order") y
  **Best Practices 100** (sin "incorrect aspect ratio"). Perf y SEO siguen en 100.

## Git (ciclo de vida — AGENTS.md §4)

Rama `fix/lighthouse-100` **desde `develop`**; Conventional Commits (scope `a11y`/`ui`), incluye `docs/`.
`pnpm exec prettier --write .` (solo código) antes de commitear. Al terminar y verde: **merge a `develop`
y borra la rama**.

## Entregable

Headings con niveles semánticos correctos (outline sin saltos) preservando el tamaño visual; imagen del
hero con aspect-ratio correcto; `sec-010.test.ts` coherente; gates verdes; **Lighthouse 100/100/100/100**
en el stage dev. Reporta archivos tocados.
