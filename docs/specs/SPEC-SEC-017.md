---
type: Spec
title: "SPEC-SEC-017 — Endurecimiento de seguridad ronda 2 (segunda auditoría, parte de repo)"
description: "Refinamientos de la segunda auditoría (B+, 10 hallazgos): headers de seguridad en TODAS las respuestas no solo HTML (F-007), COOP same-origin (F-002), security.txt completo RFC 9116 + Canonical (F-004) y check de Origin en /api/lead como anti-CSRF barato (F-010). Documenta los 4 hallazgos aceptados-con-rationale (BREACH, COEP, CORP, Server). Lo de infra (TLS 1.2, HSTS preload, CAA) va en el runbook."
tags: [security, headers, api]
timestamp: 2026-07-11T16:00:00Z
---

# SPEC-SEC-017 — Endurecimiento ronda 2 (parte de repo)

- **ID:** SPEC-SEC-017
- **Estado:** Approved
- **Épica / Story:** EPIC-06 / STORY-064 (seguridad post-auditoría, 2ª ronda)
- **Capa atómica:** feature (transversal: middleware + endpoint + security.txt)
- **Depende de:** [SPEC-SEC-016](/specs/SPEC-SEC-016.md), [ADR-0018](/adr/0018-http-security-headers-and-csp.md) (headers/CSP), [SPEC-FORM-001](/specs/SPEC-FORM-001.md) (`/api/lead`)

## Contexto / problema

Segunda auditoría del sitio (staging): **B+**, 10 hallazgos (0 críticos/altos; 1 Medium, 6 Low, 3 Info). En su
mayoría son **refinamientos** de lo ya hecho en la ronda 1 (SPEC-SEC-016). Esta spec cubre los **de repo que valen
la pena**; los de **infra** (F-006 TLS 1.0/1.1, F-001 HSTS preload, F-009 CAA) van en el runbook
[security-remediation](/deploy/security-remediation.md). Cuatro hallazgos se **aceptan con justificación** (ver
abajo) por bajo valor o costo funcional en este modelo de amenaza (marketing + form con Turnstile, sin sesión/auth).

## Requisitos funcionales (testeables)

- **RF-1 (F-007 — headers en todas las respuestas)** — `X-Content-Type-Options: nosniff` y `Referrer-Policy:
  strict-origin-when-cross-origin` se fijan en **toda** respuesta no exenta (JSON de `/api/lead`, assets,
  `robots.txt`, `security.txt`, proxy `/stats/*`), no solo en documentos HTML. Los headers que **solo aplican a
  documentos** (CSP, `X-Frame-Options`, `Permissions-Policy`, COOP de RF-2) siguen restringidos a `text/html`.
  `/admin` sigue exento. El middleware sigue **sin leer el body** (INV de SPEC-SEC-016 / ADR-0018).
- **RF-2 (F-002 — COOP)** — respuestas de documento llevan `Cross-Origin-Opener-Policy: same-origin`. **COEP NO se
  añade** (ver aceptados): `require-corp` rompería el iframe de Turnstile y todo recurso cross-origin sin CORP.
- **RF-3 (F-004 — security.txt completo)** — `/.well-known/security.txt` cumple RFC 9116 con `Contact`
  (`andys@solidgraph.io`), `Expires`, `Preferred-Languages`, y añade **`Canonical:
  https://solidgraph.io/.well-known/security.txt`** (ubicación canónica en el dominio de prod — resuelve el
  "contact-domain mismatch": el contacto `@solidgraph.io` coincide con el dominio canónico). Opcional `Policy:` si
  hay URL de política.
- **RF-4 (F-010 — anti-CSRF barato en `/api/lead`)** — el endpoint **rechaza POSTs cross-origin**: valida el header
  `Origin` (fallback `Referer`) contra el origen propio; si no coincide → **403** (`{"error":"Cross-origin
  request rejected"}` en JSON, o redirect `?contact=error` en form). Peticiones **same-origin** (el form del sitio)
  pasan. Es defensa en profundidad junto a Turnstile; **no** se introduce token CSRF ni sesión (no hay estado que
  proteger).

## Requisitos no funcionales

- **RNF-1 (no romper)** — nada de esto rompe Turnstile, el form, ni Umami. En particular **no** se añade COEP.
  Verificación empírica: consola sin violaciones, form envía end-to-end.
- **RNF-2 (perf/fidelidad)** — middleware sigue header-only, **sin trabajo por-request O(tamaño de respuesta)**
  (lección del prompt 61). Lighthouse y QA-001 intactos.
- **RNF-3 (sin secretos)** — nada nuevo en el repo; `andys@solidgraph.io` es público por diseño.

## Invariantes

- **INV-1** — `nosniff` en **todas** las respuestas no exentas (no solo HTML).
- **INV-2** — **sin COEP** mientras Turnstile (u otro embed cross-origin) siga en el sitio.
- **INV-3** — el middleware **nunca** lee/consume el body (solo headers).

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: nosniff en respuesta no-HTML
  Given una respuesta JSON de /api/lead
  Then incluye X-Content-Type-Options: nosniff

Scenario: COOP en documento, sin COEP
  Given una respuesta de documento
  Then incluye Cross-Origin-Opener-Policy: same-origin y NO incluye Cross-Origin-Embedder-Policy

Scenario: security.txt canónico
  Given GET /.well-known/security.txt
  Then incluye Contact, Expires y Canonical https://solidgraph.io/.well-known/security.txt

Scenario: /api/lead rechaza cross-origin
  Given POST /api/lead con Origin https://evil.example
  Then responde 403 y no procesa el lead
  And con Origin del propio sitio responde normal
```

## Fuera de alcance — aceptados con justificación (no se corrigen)

- **F-008 (BREACH — compresión sobre contenido reflejado):** BREACH requiere un **secreto reflejado** (token de
  sesión/CSRF) en la respuesta comprimida. El sitio no tiene sesión ni secretos en respuestas. Riesgo real ~nulo →
  **aceptado**.
- **F-002-COEP (Cross-Origin-Embedder-Policy):** `require-corp` solo habilita SharedArrayBuffer/timers de alta
  resolución (no usados) y **rompe** el iframe de Turnstile y cualquier recurso cross-origin sin CORP → **no se
  añade** (INV-2).
- **F-003 (CORP — Cross-Origin-Resource-Policy):** en un sitio público de marketing se **quiere** que los assets se
  puedan embeber; valor marginal → **aceptado**.
- **F-005 (`Server: cloudflare`):** lo añade el edge; en plan free no suele ser removible y solo revela el CDN (ya
  obvio por las IPs) → **aceptado**.

## Infra (runbook — humano)

- **F-006** Minimum TLS Version = **1.2** en Cloudflare (desactiva TLS 1.0/1.1).
- **F-001** HSTS `max-age=31536000; includeSubDomains; preload` (preload al lanzar prod).
- **F-009** Registro **CAA** en DNS autorizando las CAs de Cloudflare.

Detalle en el runbook [security-remediation](/deploy/security-remediation.md).

## Trazabilidad

- **Tests:** `[SPEC-SEC-017/RF-1..4]`, `[.../RNF-1..2]`, `[.../INV-1..3]` — nosniff en respuestas no-HTML; COOP sí /
  COEP no; security.txt con Canonical; `/api/lead` 403 cross-origin y OK same-origin.
- **ADR:** [ADR-0018](/adr/0018-http-security-headers-and-csp.md) (set de headers).
