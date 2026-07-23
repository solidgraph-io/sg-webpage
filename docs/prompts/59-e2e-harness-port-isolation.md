---
type: Prompt
title: "Prompt 59 — Blindar el harness e2e: puerto dedicado y sin reuseExistingServer silencioso"
description: "Playwright reutiliza en silencio cualquier servidor en el puerto 4321 (reuseExistingServer), así que los e2e pueden correr contra un build ajeno y dar verde/rojo falso. Aislar el harness en un puerto dedicado y fallar ruidosamente si el puerto está ocupado por algo que no es nuestro build."
tags: [prompt, testing, dx]
timestamp: 2026-07-11T12:00:00Z
---

# Prompt 59 — Harness e2e: aislamiento de puerto

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Endurecimiento del harness de tests.
> Todo va contra `develop`.

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4.

## Problema (fallo silencioso, no solo una molestia)

El `webServer` de Playwright usa el puerto **4321** con `reuseExistingServer` (típicamente
`!process.env.CI`). Si **cualquier** proceso escucha en 4321 —incluido un `astro dev` zombi de otra versión del
proyecto—, Playwright **lo reutiliza sin avisar** en vez de servir el build actual. Consecuencia: los e2e corren
contra **otro sitio** y producen **falsos rojos** (parecen regresiones) o, peor, **falsos verdes**. Ya ocurrió:
un proceso pre-reset (sirviendo `organisms/HeroSection.astro`, que no existe en este repo) secuestró la corrida.

El gate e2e solo vale si es **imposible** que mida el artefacto equivocado.

## Cambio

En la config de Playwright (`apps/web/playwright.config.*`):

1. **Puerto dedicado para e2e** (p. ej. `4331`, o `PLAYWRIGHT_PORT` con default propio), **distinto** del de
   `pnpm dev` (4321). Así un dev server suelto **nunca** colisiona con el harness. Actualiza `baseURL` y el
   `webServer.url`/`command` de forma coherente (un solo lugar que defina el puerto — sin números mágicos
   duplicados).
2. **Sin reutilización ciega:** `reuseExistingServer: false` (o, si prefieres conservarlo en local, **solo** tras
   verificar que el servidor existente es el nuestro). Preferible lo simple: **false** siempre.
3. **Fallo ruidoso:** si el puerto dedicado está ocupado, que el harness **falle con un mensaje claro**
   ("puerto X ocupado por otro proceso; libéralo") en vez de reutilizar en silencio. Si Playwright no lo hace
   solo con `reuseExistingServer:false`, añade un chequeo previo mínimo.

## Reglas

- No cambies los tests ni el sitio: es **solo** configuración del harness (+ scripts si el puerto se pasa por
  env).
- Verifica que `pnpm dev` (4321) y `pnpm test:e2e` (puerto dedicado) pueden convivir **a la vez** sin
  interferirse.

## Verificación antes de "listo"

```
pnpm test:e2e            # corre contra el puerto dedicado, con dev corriendo en 4321 en paralelo
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check && pnpm okf:check
```

- Con un `pnpm dev` activo en 4321, `pnpm test:e2e` **sigue verde** y demostrablemente sirve **su propio** build.
- Ocupa a mano el puerto dedicado y confirma que el harness **falla con mensaje claro** (no reutiliza).
- Reporta el puerto elegido y cómo se define.

## Git (ciclo de vida — AGENTS.md §4)

Rama `chore/e2e-port-isolation` **desde `develop`**; Conventional Commit (`chore`/`test`, scope `test`/`dx`),
incluye `docs/`. Al terminar y verde: **merge a `develop`**.

## Entregable

Harness e2e en puerto dedicado, sin `reuseExistingServer` silencioso y con fallo ruidoso si el puerto está
ocupado; convivencia con `pnpm dev` verificada. Elimina la clase de fallo "los e2e midieron otro build".
