---
type: Prompt
title: "Prompt 46 — Espaciado y tamaño del widget de Turnstile (margen + data-size flexible)"
description: "El div.cf-turnstile se renderiza sin margen (pegado al último input) y como cajita suelta. Añadir margen (token) y data-size='flexible' para que respire y ocupe el ancho del form. No se puede reestilizar el iframe de Cloudflare por dentro. Los errores de consola son del iframe de Turnstile (tercera parte), no accionables."
tags: [prompt, form, ui]
timestamp: 2026-07-11T02:40:00Z
---

# Prompt 46 — Espaciado/tamaño del widget de Turnstile

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Ajuste de UI acotado (CSS + 1 atributo).
> TDD + trazabilidad. Todo va contra `develop`.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y las skills (tokens, component-as-folder, SRP).
Contexto: **SPEC-FORM-001** (Turnstile en el form) y **SPEC-SEC-013** (UI del form).

## Problema

Tras el prompt 45 el widget de Turnstile ya carga en prod, pero:

- El `div.cf-turnstile` (en `apps/web/src/components/Contact/Contact.astro`) se renderiza **sin clase ni
  margen** → queda **pegado al último input** (textarea "Tell us…"), sin aire respecto al footer.
- Se ve como una **cajita suelta** que no acompaña el ancho del formulario.

> Nota de alcance: el widget es un **iframe de marca de Cloudflare**; **no** se puede reestilizar por dentro
> (colores/tipografía/borde). Solo controlamos `data-theme` (light/dark/auto), `data-size`
> (normal/compact/flexible) y el **margen del contenedor**. No intentes hackear el iframe.

## Cambios

### 1. `Contact.astro` — tamaño del widget

En el `<div class="cf-turnstile" …>` añade **`data-size="flexible"`** (que ocupe el ancho del form; mín. 300px)
y conserva `data-theme="light"` (encaja con el fondo claro del form). No cambies la condición
`turnstileSiteKey && (…)`.

### 2. `Contact.module.scss` — margen del contenedor

Añade una regla `:global(.cf-turnstile)` con **margen superior** usando **tokens** existentes, consistente con el
resto del form (p. ej. `margin-top: 24px`, igual que `.form-foot`), para separarlo del textarea. Si hace falta,
un pequeño `margin-bottom` para que no quede pegado al footer. Solo espaciado — **no** intentes estilar el
interior del widget.

## Tests (coherencia SDD/TDD)

- Estático (vitest) `[SPEC-FORM-001/RF-3]`: el `div.cf-turnstile` (cuando hay site key) lleva
  `data-size="flexible"`. Extiende un test existente del form si lo hay; si no, uno pequeño.
- **QA-001 (fidelidad):** el estado por defecto del form cambia levemente (aparece el widget con margen) — si el
  gate compara contra un diseño de referencia **sin** widget, actualiza la referencia o documenta la tolerancia
  citando SPEC-FORM-001/RF-3 (el widget es parte esperada del form con Turnstile activo). No lo silencies sin
  dejar constancia.

## Los errores de consola NO son de este prompt (constatar, no "arreglar")

Los mensajes que ve el humano (`OTS parsing error` WOFF, `Protected Audience API deprecated`, `Quirks Mode`,
`CSP blocks eval`) provienen del **iframe de Cloudflare Turnstile** (`normal?lang=auto`), **no** de nuestro
documento (no ponemos ninguna CSP; verifícalo con `git grep -i "content-security-policy" apps/web` → sin
resultados). **No** son accionables desde nuestro código ni afectan el score de Lighthouse. Déjalo constatado en
el reporte; **no** añadas CSP ni toques nada por ellos.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- Gates verdes. Build de prod local: el widget aparece con **margen** respecto al textarea y **ancho flexible**.
- Lighthouse sigue 100/100/100/100.

## Git (ciclo de vida — AGENTS.md §4)

Rama `fix/turnstile-widget-spacing` **desde `develop`**; Conventional Commit (`fix`/`style`, scope `form`/`ui`),
incluye `docs/`. `pnpm exec prettier --write .` (solo código). Al terminar y verde: **merge a `develop` y borra
la rama**.

## Entregable

`div.cf-turnstile` con `data-size="flexible"` + margen por token (separado del input, ancho del form); tests y
fidelidad coherentes; nota constatando que los errores de consola son del iframe de Cloudflare (no accionables).
Reporta archivos tocados y regenera índices OKF si aplica.
