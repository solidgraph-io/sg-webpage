---
type: Runbook
title: "Cloudflare Cache Rules — assets con hash de /_astro/"
description: "Regla de Cloudflare que cachea /_astro/* (assets con hash de contenido) 1 año en navegador y edge. Resuelve el insight de Lighthouse 'efficient cache policy'. Config de dashboard (ops), documentada aquí por trazabilidad."
tags: [deploy, cache, cloudflare, perf]
timestamp: 2026-07-11T05:10:00Z
---

# Runbook — Cloudflare Cache Rule para `/_astro/*`

## Contexto

Lighthouse reporta (unscored) que los assets estáticos de `/_astro/` se sirven **sin política de caché
eficiente** (~40 KiB re-descargados en visitas repetidas). Esos archivos llevan **hash de contenido** en el
nombre (`index.DCzkxKSt.css`, `logo_linear_primary_288h.CUJi89pv.webp`, …) → son **seguros de cachear 1 año
immutable**: si el contenido cambia, el nombre cambia, así que nunca se sirve una versión vieja.

**Decisión (humano, 2026-07-11):** poner la cabecera en **Cloudflare** (Cache Rule), no en el origen. Todo el
tráfico de prod pasa por Cloudflare, así que resuelve el insight sin tocar la app ni el Dockerfile. Alternativas
descartadas: custom server en el origen (modo middleware del adapter node — más cambio y redeploy) y middleware
de Traefik/Dokploy. El adapter `@astrojs/node` **standalone** sirve los estáticos antes del middleware de Astro,
así que un `src/middleware.ts` **no** puede fijar estas cabeceras.

## Regla (dashboard de Cloudflare)

Zona **`solidgraph.dev`** → **Caching → Cache Rules → Create rule**:

1. **Nombre:** `Immutable hashed assets (/_astro/)`.
2. **When incoming requests match** — expresión:
   - Field **URI Path**, Operator **starts with**, Value **`/_astro/`**
   - (equivale a `starts_with(http.request.uri.path, "/_astro/")`)
3. **Then — Cache settings:**
   - **Cache eligibility:** *Eligible for cache*.
   - **Edge TTL:** *Ignore cache-control header and use this TTL* → **1 año** (cachea en edge aunque el origen
     no mande `Cache-Control`).
   - **Browser TTL:** *Override origin and use this TTL* → **1 año** (esto es lo que fija el
     `Cache-Control: max-age=31536000` que recibe el navegador → cierra el audit de Lighthouse).
4. **Deploy.**

> Alcance **estricto** a `/_astro/`: el HTML/SSR **no** se toca (debe seguir fresco). No añadir extensiones ni
> ampliar el match a la raíz.

## Verificación

```bash
curl -sI https://sg-webpage.solidgraph.dev/_astro/<archivo-con-hash>.css
```

- Esperar `cache-control: public, max-age=31536000` (Browser TTL) y, tras un segundo hit,
  `cf-cache-status: HIT`.
- Re-correr Lighthouse: el diagnóstico *"Uses efficient cache policy on static assets"* desaparece de los
  insights (es **unscored** — mejora las visitas repetidas, no mueve el número del score).

## Notas

- Cloudflare no añade la directiva `immutable` vía Browser TTL (solo `max-age`); es suficiente para el audit.
  Si algún día se quisiera `immutable` explícito, requeriría cabecera de origen (custom server) o una Transform
  Rule de response header — innecesario hoy.
- Es config de dashboard (no versionada); este runbook es la fuente de verdad de por qué existe y cómo
  reconstruirla.
