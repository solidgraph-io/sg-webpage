---
type: Prompt
title: "Prompt 12 — Gate de fidelidad + corrección de Nav/Hero/Marquee (para Claude Code)"
description: "Implementar docs/specs/SPEC-QA-001.md y corregir SEC-001/002/003 hasta que el diff contra el diseño pase."
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 12 — Gate de fidelidad + corrección de Nav/Hero/Marquee (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md`, `CLAUDE.md`, y `docs/specs/SPEC-QA-001.md`.
Contexto: la regresión visual usaba **la propia implementación como baseline**, así que secciones
infieles pasaban en verde. Revisión del arquitecto (leyendo las capturas) encontró: **Hero** con
fondo claro en vez de oscuro `--night` (tema invertido), **logos rotos**, **preview panel**
descuadrado y la **dev toolbar de Astro** dentro de la captura; **Marquee** en blanco.

## Objetivo

Implementar `docs/specs/SPEC-QA-001.md` y **corregir** SEC-001/002/003 hasta que el diff contra el
diseño pase.

## Reglas (no negociables)

- **TDD:** tests en rojo citando la spec (`it('[SPEC-QA-001/RF-1] impl matches design within threshold')`).
- **Gate = diseño como referencia:** cada test visual de sección compara la sección renderizada de la app contra la del diseño `design/template/sections/NN-*.html` **en el mismo viewport** (pixelmatch, `maxDiffPixelRatio` ≈ 0.08 desktop / 0.10 mobile). **Falla** si supera el umbral. El baseline de implementación queda como anti-regresión secundario, pero el gate es el diff vs. diseño.
- **Sin artefactos:** desactiva la **dev toolbar de Astro** en las capturas (o captura contra `build`/`preview`, no `dev`). Ninguna captura con UI de dev.
- **Assets/fuentes:** corrige rutas de **logo** (copia a `public/` + `src` correcto) y espera fuentes; **cero imágenes rotas** en diseño e implementación.

## Correcciones concretas (deben pasar el gate)

1. **Hero (SEC-002):** fondo **`--night`** oscuro + texto blanco (arregla la inversión de tema); **preview panel** (browser chrome + lado izquierdo + rings/core + floating cards) posicionado como `02-hero.html`; logos renderizan.
2. **Marquee (SEC-003):** banda **oscura** con los items en scroll visibles (no en blanco); verifica que la sección se monta y captura bien.
3. **Nav (SEC-001):** el **logo** carga (sin imagen rota).

## Pasos

1. Implementa el harness de SPEC-QA-001 (comparación impl-vs-diseño, sin dev toolbar, assets/fuentes) + tests.
2. Corre el gate: verás fallar Hero/Marquee (y Nav por el logo). Corrige cada sección hasta pasar el umbral en desktop y mobile.
3. Regenera baselines de implementación **solo** tras pasar el diff vs. diseño.
4. `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check` en verde. Actualiza Estado de SEC-001/002/003 a **Verified** (fidelidad confirmada) y `docs/05`.
5. Añade el gate de fidelidad al `.drone.yml` (bloqueante).

## Detente y confirma con el humano si

- El diff no baja del umbral por diferencias legítimas diseño↔app que requieran decisión (p. ej. una fuente que no carga en el diseño standalone) — repórtalo con capturas.

## Entregable

Gate de fidelidad activo (diseño como referencia, sin dev toolbar), y **Nav/Hero/Marquee fieles**
al diseño (diff bajo umbral, desktop + mobile), specs a `Verified`. Adjunta las comparaciones al
reporte. Al terminar, resume; solo entonces seguimos con SEC-004..006 (que ya nacerán con el gate correcto).
