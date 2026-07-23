---
type: Prompt
title: "Prompt 60 — Endurecimiento de seguridad (auditoría PT-2026-002): fixes de repo en TDD"
description: "Implementa SPEC-SEC-016: middleware de cabeceras de seguridad + CSP (F-02), IP de rate-limit desde CF-Connecting-IP (F-03), 400 controlado ante JSON malformado (F-05), noindex de staging env-gated (F-06) y /.well-known/security.txt. Un test de regresión por hallazgo. Los fixes de infra (F-01/03-WAF/04/07 + HSTS/Access) son del humano (runbook)."
tags: [prompt, security, headers, api]
timestamp: 2026-07-11T13:20:00Z
---

# Prompt 60 — Endurecimiento de seguridad (fixes de repo)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa **[SPEC-SEC-016](/specs/SPEC-SEC-016.md)**
> ([ADR-0018](/adr/0018-http-security-headers-and-csp.md)). TDD + trazabilidad. Todo va contra `develop`.
> **Un test de regresión por hallazgo.** Los fixes de infra van en el runbook (humano) — no los toques.

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4, **SPEC-SEC-016**, **ADR-0018**, y de contexto
[SPEC-FORM-001](/specs/SPEC-FORM-001.md) (`/api/lead`) y [SPEC-ANALYTICS-001](/specs/SPEC-ANALYTICS-001.md) (Umami same-origin).

## F-02 — Cabeceras de seguridad + CSP (RF-1, INV-1)

Crea `apps/web/src/middleware.ts` (Astro middleware) que fije en respuestas **de documento**:
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`, y la **CSP** de ADR-0018.

- **CSP:** preferentemente vía **`experimental.csp` de Astro** (auto-hashea sus inline scripts/styles) con las
  adiciones `script-src https://challenges.cloudflare.com`, `frame-src https://challenges.cloudflare.com`,
  `connect-src https://challenges.cloudflare.com`, `style-src 'unsafe-inline'`, `img-src data:`,
  `frame-ancestors 'none'`. Si `experimental.csp` no encaja, ponla en el middleware **verificando** que no haya
  inline scripts sin hash. **`script-src` sin `'unsafe-inline'`** (INV-1).
- **`/admin`:** política **relajada u omitida** (está Access-gated; carga de CDN). No apliques la CSP estricta a
  `/admin/*`.
- **HSTS: NO** (lo pone Cloudflare — runbook).
- **Verificación empírica (obligatoria):** build + serve, carga la home y confirma en **consola cero
  violaciones de CSP** — Turnstile carga, el form postea a `/api/lead`, Umami envía a `/stats`. Si algo rompe,
  ajusta la directiva concreta y **documenta** el porqué. No relajes `script-src` para tapar un síntoma.

## F-03 — IP fiable del rate-limit (RF-2, INV-2)

En `apps/web/src/pages/api/lead.ts`, hoy la IP sale del **primer** valor de `X-Forwarded-For` (suplantable).
Cámbiala por:

```ts
const ip =
  request.headers.get('cf-connecting-ip') ??
  request.headers.get('x-real-ip') ??
  request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ??  // ÚLTIMO hop, no el primero
  'unknown';
```

El limitador en memoria (`rate-limit.ts`) se queda como capa barata; el **límite real** es una regla WAF de
Cloudflare (runbook). No reescribas el store.

## F-05 — JSON malformado → 400 (RF-3, INV-3)

En `lead.ts`, `await request.json()` va **sin** try/catch → 500. Envuélvelo:

```ts
if (ct.includes('application/json')) {
  try { data = (await request.json()) as Record<string, unknown>; }
  catch { return isJson ? json({ error: 'Invalid request body' }, 400) : redirect(request, '/?contact=error'); }
}
```

## F-06 — Staging noindex (RF-4)

Env `SITE_ENV` vía `astro:env` (`context:'server', access:'secret', optional:true`; runtime, como Turnstile).
Cuando `SITE_ENV === 'staging'`:

- `apps/web/src/pages/robots.txt.ts` → `User-agent: *\nDisallow: /`.
- middleware → `X-Robots-Tag: noindex, nofollow`.
- `BaseLayout.astro` → `<meta name="robots" content="noindex, nofollow">`.

En prod (sin `SITE_ENV=staging`): comportamiento actual (`index, follow`). El **bloqueo** del staging es
Cloudflare Access (runbook).

## security.txt (RF-5)

Ruta `apps/web/src/pages/.well-known/security.txt.ts` (RFC 9116): `Contact:` (email de seguridad — usa
`security@solidgraph.io` como placeholder y **pregunta al humano** el definitivo), `Expires:` (~1 año),
`Preferred-Languages: es, en`.

## Tests (TDD — uno por hallazgo)

`[SPEC-SEC-016/RF-1..5, RNF-1..2, INV-1..3]`:
- **F-02:** una respuesta de documento lleva las 5 cabeceras + la CSP con las directivas esperadas; `script-src`
  sin `'unsafe-inline'`; `/admin` no lleva la CSP estricta.
- **F-03:** `handleLead` con headers rotando `X-Forwarded-For` pero misma `CF-Connecting-IP` → el limitador usa la
  misma clave (rotación no evade); prioridad CF-Connecting-IP > X-Real-IP > último XFF.
- **F-05:** POST JSON con body no parseable → **400** (no 500/excepción).
- **F-06:** con `SITE_ENV=staging` → `robots.txt` Disallow / y `X-Robots-Tag: noindex`; sin él → normal.
- **security.txt:** la ruta responde con `Contact:` y `Expires:`.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- Gates verdes; **Lighthouse 100/100/100/100 intacto** y **QA-001 verde** (las cabeceras no cambian el render).
- Confirmado a mano: CSP sin violaciones (Turnstile/form/Umami OK).
- Reporta el email usado en `security.txt` (pendiente de confirmación del humano) y cualquier directiva CSP que
  hubo que ajustar tras la verificación.

## Git (ciclo de vida — AGENTS.md §4)

Rama `feat/security-hardening` **desde `develop`**; Conventional Commit (`feat`/`fix`, scope `security`), incluye
`docs/`. Añade `security` al `scope-enum` de commitlint si falta. Al terminar y verde: **merge a `develop`**.
Regenera `pnpm okf:index` (entran ADR-0018, SPEC-SEC-016, runbook y este prompt).

## Entregable

Middleware de cabeceras + CSP verificada (F-02), IP de rate-limit desde CF-Connecting-IP (F-03), 400 ante JSON
malformado (F-05), noindex de staging env-gated (F-06), `security.txt` (RF-5); un test de regresión por hallazgo;
Lighthouse 100 y QA-001 intactos. Reporta lo tocado. Los hallazgos de infra (F-01, WAF de F-03, F-04, F-07, HSTS,
Access) **no** son de este prompt — van en el runbook del humano.
