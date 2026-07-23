---
type: ADR
title: "ADR-0018 — Cabeceras de seguridad HTTP + CSP (origen/middleware + HSTS en Cloudflare)"
description: "Tras la auditoría PT-2026-002 (F-02), se adoptan cabeceras de seguridad: CSP, X-Frame-Options/frame-ancestors, X-Content-Type-Options, Referrer-Policy, Permissions-Policy vía middleware Astro (versionado, testeable); HSTS en Cloudflare. CSP afinada a Turnstile + Umami same-origin + estilos inline."
tags: [adr, security, headers, csp]
timestamp: 2026-07-11T13:00:00Z
---

# ADR-0018 — Cabeceras de seguridad HTTP + CSP

- **Estado:** Accepted (2026-07)
- **Contexto:** Seguridad / auditoría PT-2026-002 (hallazgo **F-02**, Media)
- **Relacionado:** [SPEC-SEC-016](/specs/SPEC-SEC-016.md), runbook [security-remediation](/deploy/security-remediation.md), [ADR-0017](/adr/0017-cms-client-agnostic-auth-cloudflare-access-bridge.md) (Access /admin)

## Contexto

La auditoría (F-02) encontró **ausencia total de cabeceras de seguridad** en las respuestas. Decisión del
humano: fijarlas **al origen (middleware Astro)** —versionado en el repo y cubierto por tests— con **HSTS en
Cloudflare**. El origen cubre los **documentos SSR**, que es donde importan CSP y `frame-ancestors`.

## Decisión

- **Middleware Astro** (`src/middleware.ts`) fija en toda respuesta de documento: `Content-Security-Policy`,
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **HSTS** se activa en **Cloudflare** (Edge Certificates → HSTS), no en el middleware, para controlar el
  `preload` desde el borde.
- **CSP (afinada a la app):**
  ```
  default-src 'self';
  script-src 'self' https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self' https://challenges.cloudflare.com;
  frame-src https://challenges.cloudflare.com;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
  ```
  - `script-src` **sin** `'unsafe-inline'` (es la directiva que mitiga XSS). Umami es **same-origin** (`/stats/…`,
    ADR/SPEC-ANALYTICS-001) → cubierto por `'self'`; Turnstile carga `challenges.cloudflare.com` y su iframe.
  - `style-src 'unsafe-inline'` es **necesario**: `inlineStylesheets:'always'` (prompt 47) inlinea CSS y hay
    atributos `style=` en componentes. Es un trade-off aceptado (el vector crítico es script, no style).
- **Scripts inline de Astro:** si el build emite algún `<script>` inline (bootstrap de islands), `script-src`
  estricta lo rompería. **Preferido:** usar el **CSP experimental de Astro** (`experimental.csp`, auto-hashea sus
  inline scripts/styles) para la directiva CSP, y el middleware para el resto de cabeceras. Alternativa: CSP en
  middleware **verificada empíricamente** (report-only primero, revisar consola por violaciones) antes de
  enforcar.
- **`/admin` (Sveltia):** carga desde un CDN y usa patrones incompatibles con la CSP estricta. `/admin` va
  **detrás de Cloudflare Access** (staging y prod — ADR-0017) y es estático; el middleware le aplica una CSP
  **relajada** (o la omite) para no romperlo. No se mezcla la CSP del sitio con la del CMS.

## Justificación

- **Versionado + testeable:** la CSP evoluciona con la app (nuevos orígenes de script) → vivir en el repo con
  tests de regresión evita drift y silencios. Cloudflare-only desacoplaría la política de la app.
- **`frame-ancestors 'none'`** cierra el clickjacking (relevante: el form capta datos personales).
- **Umami first-party** (same-origin) hace que la CSP **no** necesite abrir un origen de analítica de terceros.

## Consecuencias

- Nuevo `src/middleware.ts` + (opcional) `experimental.csp` en `astro.config`.
- **Verificación obligatoria:** cargar el sitio con la CSP y confirmar en consola **cero violaciones** (Turnstile
  carga, Umami envía a `/stats`, el form postea). Si algo rompe, ajustar la directiva concreta y documentar.
- HSTS con `preload` implica compromiso (difícil de revertir) → se activa consciente, en Cloudflare.
- `/admin` mantiene su propia política (relajada/omitida) mientras esté Access-gated.

## Citations

Remediación de [SPEC-SEC-016](/specs/SPEC-SEC-016.md) (F-02); OWASP Secure Headers Project.
