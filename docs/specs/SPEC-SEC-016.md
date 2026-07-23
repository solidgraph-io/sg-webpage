---
type: Spec
title: "SPEC-SEC-016 — Endurecimiento de seguridad (remediación auditoría PT-2026-002, parte de repo)"
description: "Fixes de código de la auditoría PT-2026-002: cabeceras de seguridad por middleware (F-02), IP de rate-limit desde CF-Connecting-IP (F-03), 400 controlado ante JSON malformado (F-05), noindex de staging env-gated (F-06) y /.well-known/security.txt. Los hallazgos de infra (F-01/04/07) van en el runbook."
tags: [security, headers, api]
timestamp: 2026-07-11T13:10:00Z
---

# SPEC-SEC-016 — Endurecimiento de seguridad (parte de repo)

- **ID:** SPEC-SEC-016
- **Estado:** Approved
- **Épica / Story:** EPIC-06 / STORY-063 (seguridad post-auditoría)
- **Capa atómica:** feature (transversal: middleware + endpoint)
- **Depende de:** [ADR-0018](/adr/0018-http-security-headers-and-csp.md) (headers/CSP), [SPEC-FORM-001](/specs/SPEC-FORM-001.md) (endpoint lead), [SPEC-ANALYTICS-001](/specs/SPEC-ANALYTICS-001.md) (Umami same-origin), [ADR-0017](/adr/0017-cms-client-agnostic-auth-cloudflare-access-bridge.md) (Access /admin)

## Contexto / problema

La auditoría **PT-2026-002** identificó 7 hallazgos (0 críticos/altos). Esta spec cubre los que se corrigen **en
el repo**; los de **infra** (F-01 higiene de repo público, F-04 Access /admin, F-07 rotar webhook) van en el
runbook [security-remediation](/deploy/security-remediation.md) (acción del humano). El repo **se mantiene público
por diseño** (marketing/portfolio); F-01/F-07 no son "privatizar" sino garantizar cero secretos. Regla: **un test
de regresión por hallazgo**.

## Requisitos funcionales (testeables)

- **RF-1 (F-02 — cabeceras de seguridad)** — `src/middleware.ts` fija en las respuestas de documento
  `Content-Security-Policy`, `X-Frame-Options: DENY` (coherente con `frame-ancestors 'none'`),
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy:
  camera=(), microphone=(), geolocation=()`, según **[ADR-0018](/adr/0018-http-security-headers-and-csp.md)**.
  CSP afinada a Turnstile + Umami same-origin + estilos inline; **`/admin`** con política relajada/omitida (está
  Access-gated). **HSTS** no aquí (Cloudflare). **Verificar cero violaciones de CSP** en consola (Turnstile
  carga, form postea, Umami envía a `/stats`).
- **RF-2 (F-03 — IP fiable para rate-limit)** — en `apps/web/src/pages/api/lead.ts`, la IP se obtiene de
  **`CF-Connecting-IP`** primero, luego `X-Real-IP`, y como último recurso el **último** valor de
  `X-Forwarded-For` (no el primero, que es suplantable). El limitador en memoria se mantiene como capa barata; el
  **límite real** es una regla WAF de Cloudflare (runbook). Rotar XFF **no** debe evadir el contador.
- **RF-3 (F-05 — JSON malformado → 400)** — `request.json()` va en `try/catch`; body no parseable → **400**
  `{"error":"Invalid request body"}` (JSON) o redirect `?contact=error` (form), **nunca 500**.
- **RF-4 (F-06 — staging noindex)** — cuando el entorno es **staging** (env, p. ej. `SITE_ENV=staging` vía
  `astro:env`): `robots.txt` (`robots.txt.ts`) responde `Disallow: /`, el middleware añade `X-Robots-Tag:
  noindex, nofollow`, y el `<meta name="robots">` del layout dice `noindex, nofollow`. En prod: comportamiento
  normal (`index, follow`). (El **bloqueo de acceso** al staging = Cloudflare Access, runbook.)
- **RF-5 (security.txt)** — ruta `/.well-known/security.txt` con contacto de seguridad y `Expires` (RFC 9116).
  **Contacto confirmado: `andys@solidgraph.io`** (reemplaza el placeholder `security@solidgraph.io` del prompt 60).

## Requisitos no funcionales

- **RNF-1 (no romper)** — CSP y cabeceras **no** rompen Turnstile, el form (`/api/lead`), ni Umami (`/stats`).
  Verificación empírica obligatoria (RF-1).
- **RNF-2 (perf/fidelidad)** — cabeceras no afectan el render → **Lighthouse 100 y QA-001 intactos**.
- **RNF-3 (sin secretos)** — nada de secretos en el repo; el email de `security.txt` es público por diseño.

## Invariantes

- **INV-1** — `script-src` **sin** `'unsafe-inline'` (mitigación XSS real); si el build tiene inline scripts,
  resolver con `experimental.csp` de Astro (hashes) o nonces, no relajando la directiva.
- **INV-2** — el rate-limit **nunca** confía en el primer valor de `X-Forwarded-For`.
- **INV-3** — el endpoint `/api/lead` **nunca** responde 500 por input malformado del cliente (solo por fallos
  reales de entrega, que ya se manejan).

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: cabeceras presentes
  Given una respuesta de documento del sitio
  Then incluye CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy y Permissions-Policy

Scenario: rate-limit no evadible por XFF
  Given peticiones a /api/lead rotando X-Forwarded-For pero misma CF-Connecting-IP
  Then el contador es el mismo (no se multiplica)

Scenario: JSON malformado
  Given POST /api/lead con Content-Type application/json y body no parseable
  Then responde 400 con {"error":"Invalid request body"}, no 500

Scenario: staging no indexable
  Given SITE_ENV=staging
  Then robots.txt es Disallow: / y la respuesta lleva X-Robots-Tag: noindex

Scenario: CSP no rompe funcionalidad
  Given la CSP activa
  Then Turnstile carga, el form postea y Umami envía a /stats sin violaciones en consola
```

## Fuera de alcance (infra — runbook, humano)

- **F-01** repo **público por diseño** (no privatizar) + scan de historial (gitleaks/trufflehog) + secret scanning/branch protection.
- **F-03 (parte)** regla **WAF de Cloudflare** de rate-limit en `/api/lead` (límite real distribuido).
- **F-04/F-06** **Cloudflare Access** en staging y `/admin` (ADR-0017).
- **F-02 (parte)** **HSTS** en Cloudflare.
- **F-07** rotar webhook de Dokploy si el repo estuvo público.

Todo esto en el runbook [security-remediation](/deploy/security-remediation.md).

## Trazabilidad

- **Tests:** `[SPEC-SEC-016/RF-1..5]`, `[.../RNF-1..2]`, `[.../INV-1..3]` — headers presentes y CSP correcta;
  `/admin` con política aparte; IP desde CF-Connecting-IP y XFF-rotation no evade; JSON malformado → 400;
  staging → noindex; `security.txt` sirve.
- **PRs:** — · **ADR:** [ADR-0018](/adr/0018-http-security-headers-and-csp.md).
