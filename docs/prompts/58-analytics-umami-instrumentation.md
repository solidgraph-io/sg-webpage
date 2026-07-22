---
type: Prompt
title: "Prompt 58 — Analítica Umami: tracker por astro:env + eventos de conversión (perf 100 intacto)"
description: "Instrumenta el sitio con Umami self-hosted (SPEC-ANALYTICS-001): script async/defer leído por astro:env en runtime (no-op sin env), pageviews automáticos y eventos declarativos de conversión (CTAs, éxito de lead). Cookieless, sin banner, sin regresar Lighthouse 100 ni QA-001. TDD."
tags: [prompt, analytics, perf]
timestamp: 2026-07-11T11:10:00Z
---

# Prompt 58 — Analítica Umami (instrumentación)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa **[SPEC-ANALYTICS-001](/specs/SPEC-ANALYTICS-001.md)**
> (EPIC-10). TDD + trazabilidad. Todo va contra `develop`. **No** depende de que Umami esté desplegado (degrada a
> no-op sin env).

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4, **SPEC-ANALYTICS-001**, y de contexto
**[SPEC-FORM-002](/specs/SPEC-FORM-002.md)** (estado `success` del form) y **[SPEC-FORM-001](/specs/SPEC-FORM-001.md)/RF-7**
(patrón `astro:env` en runtime).

## 1. Env (astro:env, runtime) — RF-1/RF-5/RNF-3

En `apps/web/astro.config.ts`, añade al schema (mismo criterio que Turnstile: **`access: 'secret'`** para lectura
en **runtime**, `optional`):

```ts
ANALYTICS_UMAMI_HOST: envField.string({ context: 'server', access: 'secret', optional: true }),        // URL interna de la instancia Umami (adonde reenvía el proxy)
ANALYTICS_UMAMI_WEBSITE_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
```

## 2. Tracker first-party (mismo origen) — RF-1, INV-1

Componente pequeño (p. ej. `apps/web/src/components/Analytics.astro`) incluido en el `<head>` del layout base:

- Lee `ANALYTICS_UMAMI_WEBSITE_ID` de `astro:env/server`. **Solo si existe** (y hay host), emite:
  ```html
  <script async defer src="/stats/script.js" data-website-id={ID} data-host-url="/stats"></script>
  ```
  El `src` y el `data-host-url` son **del propio dominio** (no el host de Umami) → first-party. Umami
  auto-registra pageviews (RF-2). **Sin env → no emite nada** (no-op).
- **`async defer`**, fuera del critical path → **no** render-blocking (RNF-1).
- **`/admin`** es estático (`public/admin/`), no pasa por el layout → confirma que **no** lleva tracker (INV-3).

## 2b. Proxy SSR first-party — RF-5

Dos rutas API del SSR (Astro node adapter) que reenvían a `ANALYTICS_UMAMI_HOST`:

- **`src/pages/stats/script.js.ts`** (GET) → hace fetch de `${HOST}/script.js` y lo devuelve con su
  `Content-Type` + cache razonable.
- **`src/pages/stats/api/send.ts`** (POST) → reenvía el body a `${HOST}/api/send`, **preservando la IP y el UA
  del cliente**: setea `X-Forwarded-For` con la IP del request y pasa el `User-Agent` (Umami cuenta visitantes
  por hash de IP+UA; sin esto, todo se contaría como un solo visitante = el servidor).
- Sin `ANALYTICS_UMAMI_HOST` → ambas rutas responden **404** (no-op). Sin secretos en el repo.

## 3. Eventos de conversión — RF-3

**Declarativos** con `data-umami-event` (sin JS imperativo donde se pueda):

- **CTAs primarios:** "Get a Free Quote" (nav + hero), "See Our Plans", "Get Started" (por plan). El `Button`
  ya hace spread de props → pasa `data-umami-event="<nombre-estable>"` desde donde se renderizan (o desde el
  contenido). Nombres estables y documentados (p. ej. `cta_quote_hero`, `cta_plans`, `cta_plan_start`).
- **Éxito de lead:** en el estado `success` de la máquina de `contact-form` ([SPEC-FORM-002](/specs/SPEC-FORM-002.md)),
  emite `window.umami?.track('lead', { plan: <plan_interest> })` — **guardado** (`?.`) para que sea no-op si el
  tracker no cargó. **Cero PII** (nada de email/nombre; `plan_interest` es categórico) — RF-4.

## 4. Privacy — RF-4, INV-2

Cookieless (Umami lo es), **sin banner**. Respeta **Do Not Track** (Umami lo maneja server-side; no fuerces
tracking). Ningún evento lleva PII.

## Tests (TDD)

- Estático (vitest) `[SPEC-ANALYTICS-001/RF-1, INV-1]`: sin env → el layout **no** incluye el `<script>`; con env
  (mock) → lo incluye **async/defer** con `src="/stats/script.js"` (**mismo origen**) + `data-website-id` +
  `data-host-url="/stats"`.
- Runtime `[.../RF-5]`: `GET /stats/script.js` y `POST /stats/api/send` **reenvían** a `ANALYTICS_UMAMI_HOST`
  (mock del upstream) y el POST propaga la **IP/UA** del cliente; sin `ANALYTICS_UMAMI_HOST` → **404**.
- Estático `[.../RF-3]`: los CTAs primarios llevan `data-umami-event`; el handler de `success` llama a
  `umami.track('lead', …)` (assert sobre el código/DOM del island).
- `[.../INV-3]`: `/admin` no lleva el tracker.
- **QA-001 (fidelidad):** el estado por defecto no cambia (el script no pinta) → gate verde.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- Gates verdes. Build de prod local con las env de Umami puestas: el `<script>` aparece **async/defer**; **sin**
  env, no aparece. **Lighthouse 100/100/100/100 se mantiene** (el tracker está fuera del critical path).
- Nota de ops para el humano: desplegar Umami (contenedor + Postgres en Dokploy), crear el website, poner
  `ANALYTICS_UMAMI_HOST` (URL interna de la instancia) + `ANALYTICS_UMAMI_WEBSITE_ID` en runtime, y **desactivar
  el beacon de Cloudflare Web Analytics** en el dashboard (consolidar, no duplicar). Verifica que `/stats/script.js`
  carga same-origin y que llegan eventos a Umami.

## Git (ciclo de vida — AGENTS.md §4)

Rama `feat/analytics-umami` **desde `develop`**; Conventional Commit (`feat`, scope `analytics`/`web`), incluye
`docs/`. Añade `analytics` al `scope-enum` de commitlint si falta. `pnpm exec prettier --write .` (solo código).
Al terminar y verde: **merge a `develop`**. Regenera `pnpm okf:index` (entran SPEC-ANALYTICS-001 y este prompt).

## Entregable

Sitio instrumentado con Umami: tracker condicional por env (no-op sin él, async/defer), pageviews + eventos
declarativos de conversión (CTAs + éxito de lead, sin PII), cookieless/DNT, `/admin` excluido; Lighthouse 100 y
QA-001 intactos; TDD verde. Reporta los nombres de evento definidos y la nota de ops (deploy de Umami + apagar CF
beacon). El **dashboard** de métricas queda para otra spec.
