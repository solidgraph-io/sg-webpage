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
- **Scripts inline de Astro → CSP en build/render-time (`experimental.csp`).** Astro **a veces inlinea el bundle de
  una página** como `<script type="module">` sin `src` (observado en Contact: form + Turnstile); un hash
  hardcodeado se rompería en cada build. **Enfoque final (prompt 61):** `experimental.csp` (Astro 5.9+) hashea
  cada script/estilo inline **como parte del propio pipeline de render** (barato: por-script, sin re-parsear el
  HTML entero) y emite la CSP. Como ninguna ruta está prerenderizada (`output:'server'`, sin `prerender:true`),
  Astro internamente resuelve `cspDestination` a **`"header"`** (no `<meta>`) — confirmado leyendo
  `astro/dist/core/render-context.js`: `cspDestination: manifest.csp?.cspDestination ?? (routeData.prerender ?
  "meta" : "header")` — así que `frame-ancestors` funciona de verdad (los navegadores ignoran esa directiva en
  `<meta>`). El middleware ya no calcula CSP; solo fija las cabeceras estáticas restantes. `script-src` nunca
  lleva `'unsafe-inline'` (INV-1). El único script verdaderamente estático (toggle JS de `BaseLayout`) se
  externalizó a `public/enable-js.js` (cubierto por `'self'`).
  - **Intento intermedio descartado (prompt 60 → revertido en 61):** hashear el body **en runtime** dentro del
    middleware (`response.text()` + regex + SHA-256 por respuesta). Funcionaba y pasaba local, pero en el runner de
    CI (CPU compartida) ese trabajo síncrono de O(tamaño-del-HTML) **satura node y hunde Lighthouse** (TBT 14 s,
    TTI 21 s → `perf-test` en rojo), además de de-streamear el SSR. **Lección:** el middleware no debe hacer trabajo
    por-request proporcional al tamaño de la respuesta.
  - **Hallazgo durante la implementación (prompt 61) — interacción hash/unsafe-inline en `style-src`:** Astro
    hashea *incondicionalmente* cualquier `<style>` scoped que compile, incluidos los de los ~22 componentes
    "planos" pre-ADR-0012 (aún sin migrar a CSS Modules — migración fuera de alcance aquí). Por spec de CSP, la
    sola **presencia** de un hash en `style-src` **anula silenciosamente `'unsafe-inline'`** para todo el
    directive (incluido `style-src-attr`), rompiendo los `style="..."` dinámicos del sitio entero. El script-src
    de Astro no sufre esto (sin equivalente a atributos inline de evento en este código). Fix quirúrgico: el
    middleware reescribe **solo el valor del header** (`stripStyleHashesFromCsp`, `lib/security-headers.ts`) para
    quitar los hashes de `style-src` y dejar `'unsafe-inline'` operativo — edición de un string corto (el header),
    no una lectura de body: sigue siendo O(1) respecto al HTML (RNF-2). Se auto-obsoleta en cuanto esos
    componentes migren a CSS Modules (Astro dejaría de emitir cualquier hash de estilo).
- **`/admin` (Sveltia):** carga desde un CDN y usa patrones incompatibles con la CSP estricta. `/admin` va
  **detrás de Cloudflare Access** (staging y prod — ADR-0017) y es estático; el middleware le aplica una CSP
  **relajada** (o la omite) para no romperlo. No se mezcla la CSP del sitio con la del CMS.

## Justificación

- **Versionado + testeable:** la CSP evoluciona con la app (nuevos orígenes de script) → vivir en el repo con
  tests de regresión evita drift y silencios. Cloudflare-only desacoplaría la política de la app.
- **`frame-ancestors 'none'`** cierra el clickjacking (relevante: el form capta datos personales).
- **Umami first-party** (same-origin) hace que la CSP **no** necesite abrir un origen de analítica de terceros.

## Consecuencias

- `experimental.csp` en `astro.config.ts` (CSP en build/render) + `src/middleware.ts` (glue: cabeceras
  estáticas + `stripStyleHashesFromCsp` sobre el valor del header) + `lib/security-headers.ts` (lógica pura:
  `headersFor`, `isExemptPath`, `stripStyleHashesFromCsp` — sin `astro:*`, testeable directo).
- **Coste por-request: cero de O(tamaño-del-HTML).** El middleware no bufferiza ni hashea el body; la única
  edición extra es sobre el *valor* del header CSP (string corto), no sobre el HTML. La versión que sí
  bufferizaba+hasheaba el body (prompt 60) hundió `perf-test` en CI (TBT 14 s) y se revirtió en el prompt 61.
  Regla que queda: **nada de trabajo por-request proporcional a la respuesta** en el middleware; guarda de
  regresión en los tests (`[SPEC-SEC-016/RNF-2]`, grep de `.text()`/`scriptHashesFrom`/`createHash`).
- **Verificado empíricamente (prompt 61):** Chromium real vía Playwright, **cero violaciones de CSP** en consola
  incluso rellenando el formulario (Turnstile carga, form postea, Umami a `/stats`); Lighthouse local restaurado
  a 99/100/100/100 con TBT 0 ms, igual con 1 solo core (`taskset -c 0`, simulando CPU compartida de CI). 31 tests
  `[SPEC-SEC-016/RF-1..5, RNF-1..3, INV-1..3]` en vitest + `tests/e2e/security-headers.spec.ts` (8 tests contra
  el servidor real: header vs `<meta>`, `/admin` exento, cero violaciones interactuando con la página).
- **Nota de tooling:** los tests de a11y inyectaban axe-core con `page.addScriptTag` (un `<script>` de DOM,
  bloqueado por la CSP) → se migraron a `page.evaluate(source)` (vía CDP, no sujeto a `script-src`). Solo test, no
  toca producción.
- HSTS con `preload` implica compromiso (difícil de revertir) → se activa consciente, en Cloudflare (runbook).
- `/admin` mantiene su propia política (relajada/omitida) mientras esté Access-gated.

## Citations

Remediación de [SPEC-SEC-016](/specs/SPEC-SEC-016.md) (F-02); OWASP Secure Headers Project.
