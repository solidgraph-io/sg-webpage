---
type: Prompt
title: "Prompt 47 — Performance móvil: lazy-load de Turnstile + inline del CSS bloqueante"
description: "El performance móvil bajó tras activar Turnstile (prompt 45): ~24 KiB de terceros cargados de entrada aunque el widget está al final de la página, más un CSS de 10.2 KiB render-blocking. Diferir Turnstile hasta que la sección de contacto entre en viewport e inlinear el CSS crítico. Implementa SPEC-FORM-001/RNF-2."
tags: [prompt, form, perf]
timestamp: 2026-07-11T03:10:00Z
---

# Prompt 47 — Performance móvil: lazy-load de Turnstile + inline del CSS bloqueante

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Optimización de performance acotada.
> TDD + trazabilidad. Todo va contra `develop`.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y las skills (tokens, component-as-folder, SRP).
Contexto: **SPEC-FORM-001** (Turnstile, **RNF-2 perf**) y **SPEC-FORM-002** (island del form).

## Problema (medido en móvil, prod)

Tras el prompt 45 el widget de Turnstile carga bien, pero el **performance móvil bajó**. Insights de Lighthouse:

- **3rd party / critical path:** `challenges.cloudflare.com/turnstile/v0/api.js` + su `api.js` (~24 KiB, tiempo de
  main thread) se cargan **de entrada**, aunque el widget vive en la **sección de contacto al final** de la
  página. Está en el camino crítico sin necesidad.
- **Render-blocking:** `/_astro/index.*.css` (~10.2 KiB) bloquea el render inicial → retrasa LCP.
- **DOM size:** 765 elementos (unscored) — secundario.

## Cambio 1 — Lazy-load de Turnstile (recupera la regresión)

Hoy en `apps/web/src/components/Contact/Contact.astro` el script se inyecta **eager**:

```astro
{ turnstileSiteKey && (<script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />) }
```

Cámbialo por **carga diferida**: el `<div class="cf-turnstile" data-sitekey=…>` permanece en el HTML, pero el
**script `api.js` se inyecta solo cuando la sección de contacto entra (o casi entra) en el viewport**, vía
`IntersectionObserver` (con `rootMargin` generoso, p. ej. `200px`, para que esté listo antes de llegar). Al
cargar el script, Turnstile **auto-renderiza** el `.cf-turnstile` (render implícito) — no necesitas API explícita.

- Pon el loader en un módulo pequeño (p. ej. `apps/web/src/scripts/turnstile-lazy.ts`), importado desde el
  island del form o un `<script>` propio. **Inyecta el script una sola vez** (guarda contra dobles) y solo si
  existe un `.cf-turnstile` en el DOM (es decir, si hay site key).
- **PE intacto (RNF-1):** sin JS no cambia nada — el widget ya requería JS; el POST a `/api/lead` sigue igual.
  El servidor sigue verificando el token cuando llega (SPEC-FORM-001/RF-3); el camino sin JS no se toca.
- **SRP (INV-2 de FORM-002):** módulo aparte, sin dependencias nuevas.

## Cambio 2 — Inline del CSS crítico

En `apps/web/astro.config.ts` añade **`build: { inlineStylesheets: 'always' }`** para que Astro **inline** la
hoja crítica en el HTML y elimine la request render-blocking. (Hoy usa el default `'auto'`, que solo inlina
≤4 KiB; por eso los 10.2 KiB salen como `<link>`.)

- Trade-off aceptable: el CSS deja de cachearse entre navegaciones, pero el sitio es esencialmente **una sola
  página** → prima quitar el round-trip del critical path. Si al medir `'always'` empeora (CSS creciera mucho),
  cae a subir el umbral con `'auto'` documentándolo; deja constancia de la decisión.

## Notas (bajo esfuerzo / ops — constatar, no bloquear)

- **DOM size (765):** buena parte son los badges duplicados del marquee de "trust" (se duplican para el scroll
  infinito). Si es trivial, evalúa `aria-hidden` + reducir el duplicado; si implica tocar la animación, **déjalo
  anotado** como mejora futura (es unscored). No infles el diff por esto.
- **Cloudflare Insights beacon** (`static.cloudflareinsights.com/beacon.min.js`, ~11 KiB): lo inyecta Cloudflare
  (Web Analytics), **no** nuestro código. Si no se usa, se desactiva en el **dashboard de Cloudflare** (ops), no
  en el repo. Constátalo para el humano.

## Tests (coherencia SDD/TDD)

- Estático (vitest) `[SPEC-FORM-001/RNF-2]`: `Contact.astro` **no** inyecta `api.js` de forma eager (no hay
  `<script src="…turnstile…">` en el render); el `.cf-turnstile` sigue presente cuando hay site key.
- E2E (Playwright) `[SPEC-FORM-001/RNF-2, RF-3]`: al hacer scroll a `#contact`, el script de Turnstile se
  inyecta y el widget aparece; arriba del todo (sin scroll) el script **no** está aún. Mockea/permite el dominio
  de Cloudflare según el harness; si el widget real no carga en CI, asevera la **inyección del `<script>`** (no
  el render del iframe de terceros).
- **QA-001 (fidelidad):** el estado por defecto del form no cambia (el widget ya estaba); si el gate lo compara,
  mantenlo verde.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- Gates verdes. Re-corre **Lighthouse móvil** contra el preview de prod: el CSS ya **no** es render-blocking, el
  `api.js` de Turnstile **sale del critical path** (se carga al acercarse a contacto) y el **Performance móvil
  se recupera**. Desktop sigue 100.

## Git (ciclo de vida — AGENTS.md §4)

Rama `perf/mobile-turnstile-css` **desde `develop`**; Conventional Commit (`perf`, scope `form`/`web`), incluye
`docs/`. `pnpm exec prettier --write .` (solo código). Al terminar y verde: **merge a `develop` y borra la rama**.

## Entregable

Turnstile diferido a viewport de la sección contacto (fuera del critical path, PE intacto); CSS crítico inlineado
(sin `<link>` bloqueante); tests + fidelidad coherentes; notas de DOM/beacon constatadas; Performance móvil
recuperado en Lighthouse. Reporta archivos tocados y regenera índices OKF si aplica.
