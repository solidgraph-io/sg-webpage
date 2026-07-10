---
type: Spec
title: "SPEC-DS-001 — Sistema de diseño (foundation, portado de design/template)"
description: "El nuevo diseño (design/template/) trae el sistema de diseño ya modular: design-system/ {tokens,base,animations}.css + components/.css + scripts/interactions.js."
tags: [ds]
timestamp: 2026-07-07T12:44:46-04:00
---

# SPEC-DS-001 — Sistema de diseño (foundation, portado de design/template)

- **ID:** SPEC-DS-001
- **Estado:** Implemented
- **Épica / Story:** EPIC-20 / STORY-201
- **Capa atómica:** foundation
- **Depende de:** SPEC-INFRA-001

## Contexto / problema

El nuevo diseño (`design/template/`) trae el sistema de diseño **ya modular**: `design-system/
{tokens,base,animations}.css` + `components/*.css` + `scripts/interactions.js`. Reconstruimos el
sitio con **secciones directas** (sin contrato Zod/BlockRenderer por ahora). Esta spec porta la
**foundation** y las **primitivas compartidas** que usan todas las secciones.

> **Decisión de estilos:** se **porta el CSS tal cual** (global design-system + CSS por componente
> en `<style>` scoped de cada `.astro`). **No** se re-traduce a Tailwind (evita el drift que causó
> la incoherencia). Los tokens son la única fuente de color/medida.

## Requisitos funcionales (testeables)

- **RF-1 (tokens)** — portar `design/template/design-system/tokens.css` a `apps/web` **verbatim** (mismos nombres/valores). Todas las custom properties disponibles en `:root`.
- **RF-2 (base)** — portar `base.css` (reset, tipografía base, `.container`, `.grad-text`, `.section-head`, etc.) como CSS global.
- **RF-3 (tipografía)** — **Poppins self-hosted** con los pesos del diseño (400–900), `font-display: swap`, `preload`; sin CDN de Google.
- **RF-4 (animaciones)** — portar `animations.css` (`[data-reveal]` + keyframes `ping/float1-3/bob/spin/scroll-x`) global.
- **RF-5 (JS de interacción)** — portar/crear `scripts/interactions.js` (o `src/scripts/interactions.ts`): **IntersectionObserver** añade `.in` a `[data-reveal]`; **magnetic** (mousemove) en `.magnetic`; **nav** `scrolled`/`hide` por scroll. Cargado una vez (defer). Respeta `prefers-reduced-motion`.
- **RF-6 (progressive enhancement)** — un snippet inline en `<head>` añade `documentElement.classList.add('js')`; el estado inicial oculto de `[data-reveal]` **solo** aplica con `.js` (sin JS → contenido visible). _(Ajuste sobre el template para no ocultar contenido sin JS.)_
- **RF-7 (BaseLayout)** — `src/layouts/BaseLayout.astro`: `<html lang>`, `<head>` (charset, viewport, `title`/`description` vía prop `seo`, favicon, preload de fuentes, snippet `.js`), importa la foundation CSS, `<slot/>`, y carga `interactions.js`. **SRP:** solo head/tema/slot (sin secciones ni copy).
- **RF-8 (primitivas compartidas)** — componentes átomo/utilidad que usan varias secciones, portando su `components/*.css`: **Button** (variantes `primary`/`white`/`ghost-light`/`outline`, `.magnetic`), **Eyebrow**, **Pill** (con `.ping`), **Badge**, **Logo**, **IconBox**, **SectionHead**, y utilidades **Aurora** y **FloatingCard**. Cada uno consume tokens; nada hardcodeado.

## Requisitos no funcionales

- **RNF-1 (a11y)** — contraste AA en claro y oscuro; `:focus-visible`; `prefers-reduced-motion` respetado; iconos/decorativos `aria-hidden`.
- **RNF-2 (perf)** — `interactions.js` mínimo (≤ ~5 KB gz, defer); fuentes preload; CSS global sin duplicar.
- **RNF-3 (fidelidad)** — la salida de las primitivas coincide con `design/template/styleguide.html` (regresión visual del styleguide).

## Invariantes

- **INV-1** — color/medida solo por tokens; sin hex sueltos en componentes.
- **INV-2 (PE)** — sin JS el sitio se ve completo (nada oculto); test que lo verifica.
- **INV-3 (SRP)** — foundation, animaciones y JS en sus archivos; `BaseLayout` no contiene secciones; cada primitiva un archivo/una responsabilidad.
- **INV-4 (sin Tailwind en el CSS del sitio)** — no se re-traduce el diseño a utilidades Tailwind; se porta el CSS.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: tokens portados verbatim
  Given tokens.css portado
  When se compara con design/template/design-system/tokens.css
  Then los nombres y valores de las custom properties coinciden

Scenario: reveal como enhancement
  Given [data-reveal] sin la clase .js
  Then es visible (opacity 1); con .js + IntersectionObserver, se anima al entrar en viewport

Scenario: styleguide fiel
  Given las primitivas (Button/Eyebrow/Pill/Badge/Logo/IconBox/SectionHead)
  When se renderizan
  Then coinciden visualmente con design/template/styleguide.html
```

## Fuera de alcance

- Las 14 secciones/organismos → SPEC-SEC-001..014.
- Moléculas específicas de sección (bento-card, plan-card, testimonial-card, etc.) → van con su sección.
- Contrato de bloques, CMS, leads, SEO/analítica avanzados.

## Trazabilidad

- **Tests:** `[SPEC-DS-001/RF-1..8]`, `[.../RNF-1..3]`, `[.../INV-1..4]` — tokens verbatim, no-CDN de fuentes, reveal PE, reduced-motion, variantes de Button, regresión visual del styleguide.
- **PRs:** — · **ADR:** ADR-0006 posible ("port de CSS del diseño tal cual; sin Tailwind para el CSS del sitio").
