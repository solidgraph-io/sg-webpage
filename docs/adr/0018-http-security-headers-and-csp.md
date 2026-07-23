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
  script-src 'self' https://challenges.cloudflare.com <sha256-… por respuesta>;
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
- **Scripts inline de Astro → hash dinámico por respuesta (decisión de implementación, prompt 60):** durante la
  verificación empírica se vio que Astro **a veces inlinea el bundle de una página** como `<script type="module">`
  sin `src` (observado en Contact: form + Turnstile). Un **hash hardcodeado se rompería en cada build** (el output
  minificado cambia) y `experimental.csp` no encajó. Solución adoptada: el middleware **lee el body de cada
  respuesta de documento y calcula el SHA-256 de los scripts inline realmente presentes**, añadiéndolos a
  `script-src` por-request (`scriptHashesFrom`/`buildCsp` en `lib/security-headers.ts`, lógica pura y testeable). Se
  excluyen los `<script type="application/ld+json">` (datos, no ejecutables). El único script verdaderamente
  estático (toggle JS de `BaseLayout`) se **externalizó a `public/enable-js.js`** (mismo timing, cubierto por
  `'self'`). Así **nunca** hay `'unsafe-inline'` en `script-src` (INV-1), sin acoplarse al hash de un build.
- **`/admin` (Sveltia):** carga desde un CDN y usa patrones incompatibles con la CSP estricta. `/admin` va
  **detrás de Cloudflare Access** (staging y prod — ADR-0017) y es estático; el middleware le aplica una CSP
  **relajada** (o la omite) para no romperlo. No se mezcla la CSP del sitio con la del CMS.

## Justificación

- **Versionado + testeable:** la CSP evoluciona con la app (nuevos orígenes de script) → vivir en el repo con
  tests de regresión evita drift y silencios. Cloudflare-only desacoplaría la política de la app.
- **`frame-ancestors 'none'`** cierra el clickjacking (relevante: el form capta datos personales).
- **Umami first-party** (same-origin) hace que la CSP **no** necesite abrir un origen de analítica de terceros.

## Consecuencias

- Nuevo `src/middleware.ts` (glue) + `lib/security-headers.ts` (lógica pura: `scriptHashesFrom`, `buildCsp`,
  `headersFor`, `isExemptPath`). No se usó `experimental.csp`.
- **Coste por-request:** el middleware lee y hashea el body de cada respuesta de documento. Verificado sin impacto
  en Lighthouse (99/100/100/100, el 99 de perf es baseline de la máquina). Aceptable; si algún día pesa, se puede
  cachear el hash por ruta/build.
- **Verificado empíricamente (prompt 60):** Chromium real vía Playwright, **cero violaciones de CSP** en consola
  incluso rellenando el formulario (Turnstile carga, form postea, Umami a `/stats`). 28 tests nuevos
  `[SPEC-SEC-016/RF-1..5, RNF-1..3, INV-1..3]`.
- **Nota de tooling:** los tests de a11y inyectaban axe-core con `page.addScriptTag` (un `<script>` de DOM,
  bloqueado por la CSP) → se migraron a `page.evaluate(source)` (vía CDP, no sujeto a `script-src`). Solo test, no
  toca producción.
- HSTS con `preload` implica compromiso (difícil de revertir) → se activa consciente, en Cloudflare (runbook).
- `/admin` mantiene su propia política (relajada/omitida) mientras esté Access-gated.

## Citations

Remediación de [SPEC-SEC-016](/specs/SPEC-SEC-016.md) (F-02); OWASP Secure Headers Project.
