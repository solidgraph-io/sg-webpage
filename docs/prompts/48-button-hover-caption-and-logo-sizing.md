---
type: Prompt
title: "Prompt 48 — Fix hover del botón (caption tapado por el overlay) + tamaño/centrado de logos (nav y footer)"
description: "El caption de los botones desaparece en hover porque el ::before (z-index:0) tapa el texto pasado como nodo suelto; se resuelve envolviendo el slot en un span con z-index:1. Además el logo del nav es ilegible (34px) y el del footer (badge full) es pequeño y debería ir centrado en su columna."
tags: [prompt, ui, brand]
timestamp: 2026-07-11T03:40:00Z
---

# Prompt 48 — Hover del botón + tamaño/centrado de logos

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Correcciones de UI/branding acotadas.
> TDD + trazabilidad. Todo va contra `develop`. Empareja bien con el deploy del prompt 47 (o va aparte).

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y las skills (Atomic/SRP, tokens, component-as-folder).
Contexto de branding: **prompt 39** (variantes de logo por contexto) y las specs de header/footer/botón (SEC-*).

## Issue 1 — El caption del botón desaparece en hover

**Causa raíz (stacking, no opacidad):** en `apps/web/src/components/Button.astro`, `.btn-primary::before` es un
overlay de degradado `position:absolute; z-index:0`. Solo los **hijos-elemento** se elevan por encima vía
`.btn-primary > * { z-index:1 }`. Los botones cuyo label se pasa como **nodo de texto suelto**
(`<Button>Get a Free Quote</Button>`, `See Our Plans`, `Get Started`, etc.) no tienen envoltorio → ese texto es
contenido inline que se pinta **debajo** del `::before` posicionado → en hover el degradado lo tapa. (El
`Send My Request`, que envuelve el texto en `<span>`, no se ve afectado — de ahí que solo pase en algunos.)

**Fix (robusto, en el átomo):** en `Button.astro`, envuelve el `<slot />` en **un solo** `<span class="btn__label">`
y mueve ahí el layout inline:

```astro
<Tag class={cls} href={href} {...rest}>
  <span class="btn__label"><slot /></span>
</Tag>
```

```css
.btn__label {
  position: relative;
  z-index: 1;               /* siempre por encima del ::before */
  display: inline-flex;
  align-items: center;
  gap: 10px;                /* el gap texto↔svg vive aquí ahora */
}
```

- **Elimina** la regla frágil `.btn-primary > * { position:relative; z-index:1 }` (queda cubierta por el span).
- El `gap:10px` del `.btn` pasa al `.btn__label` (ahora el `.btn` tiene un único hijo). Conserva
  `.btn:hover svg { transform: translateX(4px) }` (sigue siendo descendiente, funciona).
- Verifica que todas las variantes (primary/white/ghost-light/outline) siguen bien; el texto ya **no** se tapa en
  hover en ninguna. *(Alternativa mínima si se prefiere sin tocar markup: `.btn { isolation: isolate }` +
  `.btn-primary::before { z-index: -1 }`. Elige una; la del span es la recomendada por ser explícita.)*

## Issue 2 — Logo del nav ilegible (muy pequeño)

En `apps/web/src/components/Logo.astro` el lockup lineal se muestra a `height:34px` → el wordmark queda casi
ilegible.

- Sube el alto mostrado a ~**44px** (`.logo img { height: 44px }`) y **emite mayor** para nitidez en 2x:
  `<Image … height={96} densities={[1,2]} />` (mantén `width:auto`, sin distorsión).
- Ajusta el alto/padding del nav si hiciera falta para que el lockup respire sin romper el layout del header.
- **Si aun a ~44px el wordmark no resulta legible**, es una limitación del propio lockup lineal a tamaño de nav:
  **no** lo fuerces — **detente y repórtalo** como decisión de diseño (revisitar prompt 39: usar el ícono solo +
  wordmark en texto real/nítido). No cambies la variante de logo sin OK del humano.

## Issue 3 — Logo del footer (badge `full`): más grande y centrado en su columna

En `apps/web/src/components/Footer/Footer.astro` + `Footer.module.scss`, el logo es el badge `full` (ícono +
wordmark **apilado**, no inline) a `height:40px`, alineado a la izquierda de `.foot-brand`.

- Súbelo a ~**64px** (badge, no lockup inline) y **céntralo horizontalmente** en la primera columna
  (`.foot-brand`): p. ej. `.foot-brand .logo { align-self: center }` o centra el bloque de marca. Que el
  tagline/locations bajo el logo queden coherentes (centrar el bloque de marca o dejar el texto como está según
  se vea mejor — usa criterio y el gate de fidelidad).
- Mantén la variante contrast (fondo oscuro), `loading="lazy"`, `alt="SolidGraph"`, sin distorsión.

## Fidelidad (QA-001)

Estos son **cambios visuales intencionales** (logos más grandes, footer centrado, hover corregido). Si el gate
QA-001 compara contra la referencia en `design/` y marca deriva, **actualiza la referencia** (o la tolerancia
puntual) **dejando constancia** citando la spec correspondiente — no lo silencies a ciegas. Si la referencia ya
contemplaba estos tamaños, mejor aún.

## Tests (coherencia SDD/TDD)

- Estático (vitest): `Button.astro` renderiza el `<span class="btn__label">` envolviendo el slot (cita la spec
  del botón). Si existe test del botón, extiéndelo.
- Estático: `Logo.astro` con alto ~44px / `Footer` logo ~64px centrado (asevera lo que sea estable, p. ej. la
  clase/estilo de centrado del footer). Cita las specs de header/footer.
- E2E (opcional, si el harness lo permite): el caption del botón sigue visible en `:hover` (assert de estilo
  computado o de que el `.btn__label` está por encima) — no imprescindible si el estático cubre el markup.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- Gates verdes. Revisión visual: hover de todos los botones **conserva** el texto; logo del nav legible; logo del
  footer más grande y centrado en su columna. Lighthouse sigue 100/100/100/100.

## Git (ciclo de vida — AGENTS.md §4)

Rama `fix/button-hover-and-logo-sizing` **desde `develop`**; Conventional Commit (`fix`/`style`, scope
`ui`/`brand`), incluye `docs/`. `pnpm exec prettier --write .` (solo código). Al terminar y verde: **merge a
`develop` y borra la rama**.

## Entregable

Botón con `.btn__label` (caption nunca tapado en hover, regla `> *` eliminada); logo del nav a ~44px legible
(o escalado a decisión de diseño si no basta); logo del footer ~64px centrado en su columna; tests y fidelidad
coherentes. Reporta archivos tocados y regenera índices OKF si aplica.
