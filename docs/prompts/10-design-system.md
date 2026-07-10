---
type: Prompt
title: "Prompt 10 — Sistema de diseño (foundation) (para Claude Code)"
description: "Implementar docs/specs/SPEC-DS-001.md: portar la foundation del diseño y las primitivas compartidas."
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 10 — Sistema de diseño (foundation) (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage` (tras el reset).

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills. Metodología (SDD + TDD + Atomic Design + SRP)
vinculante. Reconstruimos desde cero con **secciones directas** contra `design/template/`.

## Objetivo

Implementar `docs/specs/SPEC-DS-001.md`: portar la **foundation** del diseño y las **primitivas
compartidas**. Fuente: `design/template/design-system/{tokens,base,animations}.css`,
`design/template/components/*.css`, `design/template/scripts/*.js`, `design/template/styleguide.html`.

## Decisiones (respétalas)

- **Portar el CSS tal cual** (global design-system + CSS por componente en `<style>` scoped de cada `.astro`). **NO** re-traducir a Tailwind. **Quita la integración Tailwind** de `apps/web` (no se usa para el CSS del sitio).
- **JS + CSS con progressive enhancement:** `scripts/interactions.js` (IntersectionObserver reveal, magnetic, nav) cargado una vez, defer, ≤ ~5 KB; snippet inline en `<head>` añade `.js` al `<html>`; el estado oculto de `[data-reveal]` solo aplica con `.js` (sin JS → todo visible). Respeta `prefers-reduced-motion`.

## Reglas (no negociables)

- **TDD:** por cada `RF/RNF/INV`, test en **rojo** citando la spec (`it('[SPEC-DS-001/RF-1] tokens ported verbatim')`), luego verde, luego refactor.
- **Fidelidad:** tokens **verbatim** desde `tokens.css`; las primitivas coinciden con `styleguide.html` (regresión visual de Playwright contra el styleguide).
- **SRP:** foundation/animaciones/JS en sus archivos; `BaseLayout` solo head/tema/slot; una primitiva = un archivo.
- **Sin secretos.** Rama `feature/SPEC-DS-001-design-system`; Conventional Commits con footer `[SPEC-DS-001]`, scope `layout`/`atom`.

## Pasos

1. Porta `tokens.css` (verbatim), `base.css`, `animations.css` a `apps/web/src/styles/` como CSS global; Poppins self-hosted 400–900 (preload, sin CDN).
2. `scripts/interactions.js` (reveal/magnetic/nav, PE, reduced-motion). `BaseLayout.astro` (head + seo prop + preload + snippet `.js` + slot + carga interactions).
3. Primitivas compartidas como `.astro` portando su `components/*.css`: **Button** (primary/white/ghost-light/outline, magnetic), **Eyebrow**, **Pill** (ping), **Badge**, **Logo**, **IconBox**, **SectionHead**, + utilidades **Aurora**, **FloatingCard**.
4. Tests: tokens verbatim, no-CDN de fuentes, reveal PE (visible sin `.js`), reduced-motion, variantes de Button, regresión visual del **styleguide**.
5. `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` en verde. Actualiza Trazabilidad + Estado (`Implemented`) de la spec y `docs/05`.

## Detente y confirma con el humano si

- Algo del design-system no encaja sin decisiones de producto → coméntalo.
- Quitar Tailwind rompe algo del scaffold que convenga conservar → proponlo antes.

## Entregable

Foundation + primitivas fieles al `styleguide.html`, PE + reduced-motion, todo verde, `interactions.js`
en su sitio. La home sigue siendo placeholder (las secciones llegan después). Al terminar, resume y
confirma que sigue **SPEC-SEC-001 (01-nav)** y el resto de secciones 1:1 con `design/template/sections/`.
