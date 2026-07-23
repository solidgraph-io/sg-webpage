---
type: Prompt
title: "Prompt 61 — CSP a build-time (experimental.csp): quitar el hasheo por-request del middleware que rompió perf-test"
description: "El middleware del prompt 60 leía y hasheaba el body de cada respuesta en runtime; en el runner de CI (CPU compartida) satura node y hunde Lighthouse (TBT 14s, TTI 21s). Mover la CSP a build-time con experimental.csp de Astro y dejar el middleware sin lectura de body; script-src sigue sin 'unsafe-inline'. Restaurar el gate de perf."
tags: [prompt, security, csp, performance]
timestamp: 2026-07-11T14:30:00Z
---

# Prompt 61 — CSP a build-time; middleware sin lectura de body

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Corrige la regresión de perf introducida por el
> prompt 60. Implementa el enfoque **preferido** de [ADR-0018](/adr/0018-http-security-headers-and-csp.md).
> TDD + trazabilidad. Todo va contra `develop`.

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4, **[SPEC-SEC-016](/specs/SPEC-SEC-016.md)**,
**[ADR-0018](/adr/0018-http-security-headers-and-csp.md)** y el prompt 60 (lo que corriges).

## Qué pasó (regresión)

`src/middleware.ts` hace `await response.text()` en **cada** respuesta de documento y ejecuta
`scriptHashesFrom` (regex sobre todo el HTML) + SHA-256 para calcular los hashes inline **en runtime**. Con
`inlineStylesheets:'always'` el HTML es grande, así que ese trabajo síncrono **satura el proceso node** del
`preview` que sirve a Lighthouse en CI. En una máquina con cores de sobra pasa (99/100 local); en el runner de
Drone (CPU compartida) node **le roba ciclos a Chrome** → `perf-test` (Lighthouse CI) reporta **TBT 14146 ms, TTI
21868 ms, LCP 5769 ms** y falla las aserciones. Además, leer el body **de-streamea** el SSR.

En CI no hay Turnstile ni Umami (envs sin setear), así que el TBT no viene del cliente: es **contención de CPU en
el servidor**. La causa es el trabajo por-request del middleware.

## Cambio: CSP en build-time, middleware sin body-read

1. **Adoptar `experimental.csp` de Astro (5.9+).** Configúralo en `astro.config.ts` para que Astro **hashee sus
   scripts/estilos inline en el build** y emita la CSP. Directivas objetivo (las de ADR-0018), sin
   `'unsafe-inline'` en `script-src`:
   - `script-src`: `'self'` + `https://challenges.cloudflare.com` (Astro añade los hashes de sus inline scripts).
   - `style-src`: `'self' 'unsafe-inline'` (inline CSS + atributos `style=`; trade-off aceptado en ADR-0018).
   - `img-src 'self' data:`, `font-src 'self'`, `connect-src 'self' https://challenges.cloudflare.com`,
     `frame-src https://challenges.cloudflare.com`, `default-src 'self'`, `frame-ancestors 'none'`,
     `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`.
   - Verifica qué directivas soporta `experimental.csp` y cuáles hay que añadir por cabecera. Si alguna (p. ej.
     `frame-ancestors`) no la cubre, sétala en el middleware **como valor estático** (sin leer el body).

2. **Middleware sin lectura de body.** Reescribe `src/middleware.ts` para que **nunca** haga
   `response.text()` ni hashee nada en runtime. Solo fija cabeceras **estáticas** en respuestas de documento:
   `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, y
   `X-Robots-Tag` cuando `SITE_ENV=staging`. Mantén el exento `/admin`. `lib/security-headers.ts` deja de exponer
   `scriptHashesFrom`/hash dinámico; `buildCsp` (si sigue usándose para tests o para directivas no cubiertas por
   `experimental.csp`) pasa a ser **estático** (sin parámetro de hashes).

3. **Si `experimental.csp` no encaja bien** (cobertura de directivas insuficiente o rompe el `/admin` estático):
   plan B equivalente en perf — **CSP estática en el middleware sin leer el body**, y evitar el problema de raíz
   haciendo que Astro **no inline** el bundle de módulo de la página (emitirlo como archivo externo, cubierto por
   `'self'`). Documenta cuál de los dos caminos tomaste y por qué.

## Reglas

- **`script-src` NUNCA con `'unsafe-inline'`** (INV-1 de SPEC-SEC-016).
- **Cero trabajo por-request de O(tamaño del HTML)** en el middleware (ni `text()`, ni regex sobre el body, ni
  hash). Ese es el punto de todo el prompt.
- No toques los fixes de F-03/F-05/F-06 del prompt 60 (IP, 400, noindex) — siguen igual.

## Tests (TDD)

- Actualiza los tests de `[SPEC-SEC-016/RF-1, INV-1]`: la CSP ahora es de build-time; asserta que el documento
  servido lleva una CSP con las directivas esperadas y `script-src` **sin** `'unsafe-inline'`, y que `/admin`
  sigue exento. Elimina/reescribe los tests que ejercitaban `scriptHashesFrom` en runtime.
- **Guarda de regresión de perf:** añade una aserción/So test que garantice que el middleware **no** lee el body
  (p. ej. que una respuesta de documento se devuelve sin bufferizar / que `onRequest` no llama a `text()`), para
  que nadie reintroduzca el hasheo por-request. Etiqueta `[SPEC-SEC-016/RNF-2]`.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- **Verificación empírica de CSP** (la que ya tienes): Chromium real, **cero violaciones** en consola (form +
  Turnstile + Umami same-origin). `script-src` sin `'unsafe-inline'`.
- **Perf restaurada:** corre el gate de Lighthouse (`.lighthouserc.js`) contra el build de `preview` y confirma
  que LCP/TBT/TTI vuelven al baseline (LCP ≤ 3500, TBT ≤ 900). Si puedes, córrelo con la CPU limitada
  (`taskset`/`--cpu` o similar) para imitar el runner y evitar otro "pasa local / falla en CI".
- Reporta los números de Lighthouse antes/después y el camino elegido (experimental.csp vs. CSP estática +
  no-inline).

## Git (ciclo de vida — AGENTS.md §4)

Rama `fix/csp-build-time-perf` **desde `develop`**; Conventional Commit (`fix`, scope `security`/`perf`), incluye
`docs/`. Al terminar y verde: **merge a `develop`**. Regenera `pnpm okf:index`.

## Entregable

CSP generada en build-time (o estática) sin `'unsafe-inline'` en `script-src`; middleware que **solo** fija
cabeceras estáticas, **sin leer ni hashear el body**; `perf-test` (Lighthouse CI) verde de nuevo; el resto de
SPEC-SEC-016 (F-03/F-05/F-06, security.txt) intacto. Elimina la clase de fallo "el middleware satura la CPU del
runner".
