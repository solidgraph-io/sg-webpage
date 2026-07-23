---
type: Prompt
title: "Prompt 63 — Endurecimiento de seguridad ronda 2 (2ª auditoría): fixes de repo en TDD"
description: "Implementa SPEC-SEC-017: nosniff/Referrer-Policy en TODAS las respuestas no solo HTML (F-007), COOP same-origin sin COEP (F-002), security.txt completo + Canonical (F-004) y check de Origin en /api/lead como anti-CSRF barato (F-010). No añade COEP (rompería Turnstile). Middleware sigue header-only, sin leer body. Infra (TLS/HSTS/CAA) es del humano."
tags: [prompt, security, headers, api]
timestamp: 2026-07-11T16:10:00Z
---

# Prompt 63 — Endurecimiento ronda 2 (fixes de repo)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa **[SPEC-SEC-017](/specs/SPEC-SEC-017.md)**
> ([ADR-0018](/adr/0018-http-security-headers-and-csp.md)). TDD + trazabilidad. Va contra `develop`. **No añadas
> COEP** ni toques CI. Los fixes de infra van en el runbook (humano).

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4, **SPEC-SEC-017**, y de contexto **[SPEC-SEC-016](/specs/SPEC-SEC-016.md)** /
`lib/security-headers.ts` / `src/middleware.ts` (lo que extiendes) y `src/pages/api/lead.ts`.

## F-007 — headers en TODAS las respuestas (RF-1, INV-1, INV-3)

Hoy `headersFor` devuelve `null` para respuestas no-HTML, así que JSON/assets/`robots.txt`/`security.txt`/`/stats`
no llevan ningún header. Cambia la lógica en `lib/security-headers.ts` (sigue **pura**, sin leer body):

- **En toda respuesta no exenta** (`/admin` sigue exento): fija `X-Content-Type-Options: nosniff` y
  `Referrer-Policy: strict-origin-when-cross-origin`, **sin importar** el content-type.
- **Solo en documentos** (`text/html`): además CSP (ya la pone `experimental.csp`), `X-Frame-Options: DENY`,
  `Permissions-Policy`, y el COOP de F-002.
- El middleware **sigue sin leer el body** (INV-3 / lección prompt 61): solo `response.headers.set(...)`.

## F-002 — COOP sí, COEP no (RF-2, INV-2)

En documentos, añade `Cross-Origin-Opener-Policy: same-origin`. **NO añadas `Cross-Origin-Embedder-Policy`**:
`require-corp` rompe el iframe de Turnstile (`challenges.cloudflare.com`) y cualquier recurso cross-origin sin
CORP, y solo habilita SharedArrayBuffer, que el sitio no usa. Deja un comentario explicando por qué se omite (para
que nadie lo "arregle" luego).

## F-004 — security.txt completo (RF-3)

En `src/pages/.well-known/security.txt.ts` añade, junto a `Contact`/`Expires`/`Preferred-Languages`:
`Canonical: https://solidgraph.io/.well-known/security.txt` (ubicación canónica en prod — resuelve el mismatch:
el contacto `andys@solidgraph.io` coincide con el dominio canónico). Opcional `Policy:` si hay URL. Mantén el
`Expires` calculado (~1 año).

## F-010 — anti-CSRF barato en `/api/lead` (RF-4)

Antes de procesar el lead, valida el origen de la petición: lee `Origin` (fallback `Referer`) y compáralo con el
origen propio de la request (`new URL(request.url).origin`). Si no coincide → **403**
(`{"error":"Cross-origin request rejected"}` en JSON, o redirect `?contact=error` en form). Peticiones same-origin
(el form del sitio) pasan. **No** introduzcas token CSRF ni sesión — no hay estado que proteger; esto es defensa en
profundidad junto a Turnstile. Ubícalo antes del rate-limit/Turnstile para cortar temprano el cross-origin.

## Reglas

- **Sin COEP** (INV-2). Nada de tokens CSRF/sesión.
- **Middleware header-only, sin leer el body** (INV-3).
- No toques CI (`.drone.yml`/`.lighthouserc.js`) ni los budgets.
- No rompas F-03/F-05/F-06/security.txt de SPEC-SEC-016.

## Tests (TDD — uno por hallazgo)

`[SPEC-SEC-017/RF-1..4, RNF-1..2, INV-1..3]`:
- **F-007:** una respuesta **no-HTML** (JSON de `/api/lead`) lleva `nosniff` + `Referrer-Policy`; los headers
  document-only NO aparecen en no-HTML; `/admin` sigue exento.
- **F-002:** documento lleva `COOP: same-origin` y **NO** lleva `Cross-Origin-Embedder-Policy`.
- **F-004:** `security.txt` incluye `Canonical https://solidgraph.io/.well-known/security.txt` + `Contact` +
  `Expires`.
- **F-010:** POST a `/api/lead` con `Origin` ajeno → 403 sin procesar; con `Origin` propio → normal; sin `Origin`
  pero `Referer` propio → normal.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- **Empírica:** Chromium real, consola sin violaciones de CSP, **Turnstile carga y el form envía end-to-end**
  (confirma que COOP/nosniff no rompieron nada; que NO metiste COEP). `curl -I` a `/api/lead` (o su respuesta) y a
  un asset muestran `nosniff`.
- Lighthouse y QA-001 intactos.
- Reporta headers nuevos y el comportamiento de `/api/lead` ante Origin ajeno/propio.

## Git (ciclo de vida — AGENTS.md §4)

Rama `feat/security-hardening-round2` **desde `develop`**; Conventional Commit (`feat`/`fix`, scope `security`),
incluye `docs/`. Al terminar y verde: **merge a `develop`**. Regenera `pnpm okf:index` (entran SPEC-SEC-017 y este
prompt).

## Entregable

nosniff/Referrer en todas las respuestas (F-007), COOP sin COEP (F-002), security.txt con Canonical (F-004),
`/api/lead` rechaza cross-origin (F-010); un test por hallazgo; Turnstile/form intactos; middleware header-only.
Los hallazgos de infra (F-006 TLS, F-001 HSTS, F-009 CAA) y los aceptados (F-008/F-003/F-005/COEP) **no** son de
este prompt.
