---
type: Prompt
title: "Prompt 33 — Fix perf-test: `lhci` no encuentra Chrome (apuntar al Chromium de Playwright)"
description: "Fix perf-test: `lhci` no encuentra Chrome (apuntar al Chromium de Playwright)"
tags: [prompt]
timestamp: 2026-07-09T01:13:14-04:00
---

# Prompt 33 — Fix perf-test: `lhci` no encuentra Chrome (apuntar al Chromium de Playwright)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Desbloquea el gate `perf-test`.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y `SPEC-DEPLOY-002`/`SPEC-PERF-001`. Fix de CI.

## Bug (con evidencia)
El step `perf-test` (`.drone.yml`) corre en `mcr.microsoft.com/playwright:v1.61.1-noble` y ejecuta
`npx @lhci/cli@latest autorun`. Lighthouse CI usa **chrome-launcher**, que busca Chrome en rutas de
sistema o en `CHROME_PATH` — **no** en `/ms-playwright/…` donde Playwright guarda su Chromium. Resultado:
`❌ Chrome installation not found · Healthcheck failed!`. (El `⚠️ GitHub token not set` es benigno.)

Es un fallo **latente**: recién ahora el pipeline llega a perf-test (antes moría en gates previos).

## Fix — apuntar lhci al Chromium ya presente (sin descargar Chrome)
En el step `perf-test`, **antes** del `lhci autorun`, exporta `CHROME_PATH` al ejecutable de Chromium
que Playwright ya trae en la imagen. Opción robusta (resuelve la ruta vía Playwright, no hardcoded):

```yaml
commands:
  - corepack enable
  - corepack prepare pnpm@9.15.9 --activate
  - export CHROME_PATH="$(pnpm --filter @solidgraph/web exec node -e "console.log(require('playwright-core').chromium.executablePath())")"
  - echo "CHROME_PATH=$CHROME_PATH" && test -x "$CHROME_PATH"   # falla claro si la ruta no existe
  - npx @lhci/cli@latest autorun --config=.lighthouserc.js
```

- Si la resolución de `playwright-core` diera problemas, alternativa por glob:
  `export CHROME_PATH="$(ls -d /ms-playwright/chromium-*/chrome-linux/chrome | head -n1)"` (la **full**
  chromium, no `chromium_headless_shell`).
- Última alternativa (más lenta, descarga): `npx playwright install chrome` (Chrome stable en ruta estándar).
  Prefiere `CHROME_PATH` — reusa el navegador de la imagen, sin descarga.
- Verifica que `.lighthouserc.js` no fije otro `chromePath`/`chromeFlags` que entre en conflicto; si usa
  `chromeFlags`, asegúrate de `--headless=new --no-sandbox` (contenedor).

## Reglas / alcance
- **perf sigue bloqueante** en `develop`/`main` ([SPEC-DEPLOY-002](/specs/SPEC-DEPLOY-002.md)/RF-3). No lo muevas a nightly aquí
  (esa sub-opción ya está documentada en `.drone.yml` como flag reversible; NO la actives salvo que se pida).
- Solo tocas el step `perf-test` del `.drone.yml` (y `.lighthouserc.js` si hace falta ajustar flags).

## Verificación
Idealmente reproduce local en el contenedor Playwright:
`docker run --rm -v $PWD:/src -w /src mcr.microsoft.com/playwright:v1.61.1-noble bash -lc "corepack enable && pnpm install --frozen-lockfile && pnpm build && export CHROME_PATH=\$(pnpm --filter @solidgraph/web exec node -e \"console.log(require('playwright-core').chromium.executablePath())\") && npx @lhci/cli@latest autorun --config=.lighthouserc.js"`
→ lhci pasa el healthcheck y corre los budgets.

## Git (ciclo de vida — AGENTS.md §4)
Rama `fix/lhci-chrome-path` **desde `develop`**; Conventional Commit (`ci`/`fix`, scope `infra`), incluye
`docs/` si tocas algo. Al terminar y verde: **merge a `develop` y borra la rama**.

## Entregable
`perf-test` encuentra Chrome (vía `CHROME_PATH` al Chromium de Playwright) y pasa; el pipeline de
`develop` llega verde hasta `build-push-web-dev`. Reporta qué método de ruta funcionó.
