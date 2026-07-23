---
type: Prompt
title: "Prompt 62 — perf-test fiable: serializarlo tras visual/a11y + mediana de 3 runs (fin del ruido de runner)"
description: "perf-test (Lighthouse CI) corría en paralelo con visual-test y a11y-test — tres Chromium peleando por el agente de Drone → métricas absurdas (TBT 69s) sobre un dist que en local da TBT 0ms. Serializar perf-test para que corra aislado (depende de visual+a11y) y usar numberOfRuns:3 con mediana. Sin tocar budgets ni el sitio."
tags: [prompt, ci, performance, drone]
timestamp: 2026-07-11T15:30:00Z
---

# Prompt 62 — perf-test fiable (serializar + mediana)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. **Toca CI/CD** (`.drone.yml` +
> `.lighthouserc.js`) — cambio ya confirmado por el humano. No toca el sitio ni los budgets. Va contra `develop`.

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y el header de `.drone.yml` (grafo de dependencias,
build-once [SPEC-DEPLOY-002](/specs/SPEC-DEPLOY-002.md)).

## Problema (medición, no sitio)

`perf-test` depende de `install-glibc` **igual que** `visual-test` y `a11y-test`, así que los tres corren **en
paralelo**: tres Chromium/Playwright saturan el mismo agente de Drone y Lighthouse mide un runner hambriento →
**TBT 69 328 ms, TTI 78 551 ms, CLS 0.57, LCP 3897** sobre un `dist/` que **en local da TBT 0 ms / 99·100·100·100**
(verificado incluso con `taskset -c 0`). Métrica sin señal: el sitio está bien, el gate mide contención. El propio
config admite que "TBT es muy dependiente del runner" y que un run **aislado** dio **653 ms**.

## Cambio 1 — serializar perf-test (`.drone.yml`)

`perf-test`: cambiar `depends_on: [install-glibc]` → **`depends_on: [visual-test, a11y-test]`**. Así corre
**solo**, cuando los otros dos gates de navegador ya terminaron, sin pelear por CPU. **No** reconstruye:
sigue consumiendo el `dist/` de build-once (SPEC-DEPLOY-002/RF-1 intacto). `visual-test` y `a11y-test` **siguen en
paralelo entre sí** (ambos `depends_on: [install-glibc]`) — solo perf sale del trío.

- Actualiza el **comentario** del step (y el grafo del header) que hoy presume "perf ya NO serializa: corre en
  paralelo con visual y a11y": ahora es al revés y hay que explicar **por qué** (Lighthouse necesita el agente
  para sí; la contención de 3 Chromium invalida la medición). Coste asumido: ~1–2 min más de pipeline por push,
  a cambio de un gate con señal real.
- `build-push-web-dev` / `build-push-web` ya dependen de `[visual-test, a11y-test, perf-test]` — no cambian.

## Cambio 2 — mediana de 3 runs (`.lighthouserc.js`)

`collect.numberOfRuns: 1` → **`3`**. Asegura que las aserciones evalúan la **mediana** (es el modo por defecto de
LHCI para métricas numéricas; si hace falta, fíjalo explícito con `assert.aggregationMethod: 'median'`). Absorbe el
jitter residual del runner sin ocultar una regresión real (que serían cientos de ms, no ruido). **No toques los
budgets** (LCP ≤ 3500, TBT ≤ 900, CLS ≤ 0.1, etc.) — el punto es que con la medición aislada vuelvan a cumplirse
solos.

## Reglas

- Solo configuración de CI/medición. **Cero cambios en el sitio, en los componentes o en los budgets.**
- No rompas build-once: perf-test consume el `dist/` existente, no reconstruye.

## Verificación antes de "listo"

- Empuja a `develop` y confirma que `perf-test` corre **después** de visual/a11y (no en paralelo) y que las 3
  corridas + mediana dan **TBT ≤ 900, LCP ≤ 3500, CLS ≤ 0.1** — de vuelta al orden de ~650 ms, coherente con el
  local. Reporta los números del runner.
- El resto de gates (`pnpm lint && type-check && test && test:e2e && trace -- --check && okf:check`) siguen verde.
- Regenera `pnpm okf:index` (entra este prompt).

## Git (ciclo de vida — AGENTS.md §4)

Rama `ci/perf-test-serialize` **desde `develop`**; Conventional Commit (`ci`, scope `test`/`ci`), incluye `docs/`.
Al terminar y verde: **merge a `develop`**.

## Entregable

`perf-test` serializado tras visual/a11y (aislado, sin contención) + `numberOfRuns: 3` mediana; budgets y sitio
intactos; el gate vuelve a medir el sitio real (~650 ms) y no el runner saturado. Elimina la clase de fallo "3
Chromium en paralelo hunden Lighthouse".
