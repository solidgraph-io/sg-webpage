---
type: Prompt
title: "Prompt 45 — Turnstile no carga en prod: site key inlineada en build (astro:env public→secret)"
description: "El widget de Turnstile no se renderiza en prod porque TURNSTILE_SITE_KEY está declarada server+public en astro:env → se hornea vacía en build. Pasarla a access: 'secret' para leerla en runtime desde Dokploy. Implementa SPEC-FORM-001/RF-7."
tags: [prompt, form, env, bugfix]
timestamp: 2026-07-11T02:00:00Z
---

# Prompt 45 — Turnstile no carga en prod (site key horneada vacía en build)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa **[SPEC-FORM-001](/specs/SPEC-FORM-001.md)/RF-7** (aclaración).
> Cambio pequeño de config + un test estático + verificación. TDD + trazabilidad. Todo va contra `develop`.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y **SPEC-FORM-001** (`docs/specs/SPEC-FORM-001.md`),
en particular **RF-7** (env en runtime vía `astro:env`).

## Bug

En prod (`https://sg-webpage.solidgraph.dev/`) el **widget de Turnstile no se renderiza**: el HTML servido no
contiene ni el `div.cf-turnstile` ni el `<script>` de `challenges.cloudflare.com`. Ambos son condicionales a
`turnstileSiteKey` (ver `apps/web/src/components/Contact/Contact.astro`), que llega **vacío** en el contenedor.

**Causa raíz:** en `apps/web/astro.config.ts` la var está declarada

```ts
TURNSTILE_SITE_KEY: envField.string({ context: 'server', access: 'public', optional: true }),
```

En `astro:env`, las variables **`server + public` se inlinean en build**; solo las **`access: 'secret'`** se
leen en **runtime**. El env real lo inyecta **Dokploy en runtime** (no en el build de Docker), así que en build
`TURNSTILE_SITE_KEY` queda `undefined` → `?? ''` → vacío → el widget nunca se pinta. Es el mismo problema que
RF-7 arregló para los secrets; la site key se quedó `public` por "no ser secreta" y por eso se coló.

## Fix (una línea de schema)

En `apps/web/astro.config.ts`, cambia **solo** el `access` de `TURNSTILE_SITE_KEY` de `public` a `secret`
(mantén `context: 'server'` y `optional: true`):

```ts
TURNSTILE_SITE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
```

No cambies el import (`import { TURNSTILE_SITE_KEY } from 'astro:env/server'` en `pages/index.astro` sigue
válido para `secret`). No toques `Contact.astro` ni la lógica del render (el `data-sitekey` sigue saliendo al
HTML: que sea `secret` en `astro:env` **no** lo oculta del cliente, solo cambia a lectura en runtime).

## Test (coherencia SDD/TDD)

Añade/ajusta un test estático `[SPEC-FORM-001/RF-7]` que **parsee `astro.config.ts`** y asevere que
`TURNSTILE_SITE_KEY` está declarada con `access: 'secret'` (y `context: 'server'`), documentando el motivo
(las `public` se inlinean en build). Si ya existe un test que fija el schema de env, extiéndelo; si no, crea uno
pequeño en `apps/web/src/__tests__/`. En rojo antes del cambio (hoy es `public`), verde después.

> Nota: no intentes cubrir el inlining de build con un unit test (no es observable ahí). El test estático del
> schema + la verificación manual del HTML bastan.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- Gates verdes.
- Build de prod local y comprueba el HTML del `#contact`: con `TURNSTILE_SITE_KEY` presente en el **runtime**
  (no en build), el `div.cf-turnstile[data-sitekey=…]` y el `<script src="…turnstile/v0/api.js">` **aparecen**.
  P. ej.: `TURNSTILE_SITE_KEY=<key> node dist/server/entry.mjs` y `curl -s localhost:4321 | grep cf-turnstile`.
  (Antes del fix, aunque exportes la var, sale vacío porque se horneó en build.)

## Acción de operaciones (fuera del repo — reportar al humano)

El fix hace que la key se **lea en runtime**; por tanto **debe existir** `TURNSTILE_SITE_KEY` en el env de
**runtime de Dokploy** (además de `TURNSTILE_SECRET_KEY` para `siteverify`). Verifica/recuerda al humano:
1. `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` configuradas en Dokploy (runtime), no solo en build.
2. El dominio `sg-webpage.solidgraph.dev` (y `solidgraph.dev`) está en los **hostnames permitidos** del widget
   en el dashboard de Cloudflare Turnstile, y la key corresponde a ese widget.

## Git (ciclo de vida — AGENTS.md §4)

Rama `fix/turnstile-sitekey-runtime` **desde `develop`**; Conventional Commit (`fix`, scope `form`/`env`),
incluye `docs/` + el test. `pnpm exec prettier --write .` (solo código). Al terminar y verde: **merge a
`develop` y borra la rama**.

## Entregable

`TURNSTILE_SITE_KEY` como `access: 'secret'` (lectura en runtime); test estático del schema `[.../RF-7]` verde;
widget de Turnstile visible en el HTML cuando la key está en runtime; nota de ops sobre Dokploy/Cloudflare.
Reporta archivos tocados y regenera índices OKF si aplica (`pnpm okf:index`).
