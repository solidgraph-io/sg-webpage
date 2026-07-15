---
type: Prompt
title: "Prompt 50 — Badges flotantes de About se solapan en móvil: ocultarlos bajo 760px (paridad con Hero)"
description: "En móvil el .about-visual se encoge pero las FloatingCard tienen tamaño fijo en px, así que sus offsets en % las agrupan y solapan. Ocultarlas bajo 760px igual que hace el Hero con .hero-float; la información no se pierde (los mismos tres puntos están en la lista de About)."
tags: [prompt, ui, responsive]
timestamp: 2026-07-11T04:40:00Z
---

# Prompt 50 — Badges flotantes de About: ocultar en móvil

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Fix responsive acotado.
> TDD + trazabilidad. Todo va contra `develop`.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y las skills (tokens, component-as-folder, SRP).
Contexto: **[SPEC-SEC-010](/specs/SPEC-SEC-010.md)** (sección About) y **[ADR-0012](/adr/0012-component-as-folder.md)**.

## Bug

En móvil (verificado a 430×932), los tres badges flotantes de About —`.b1` "You own it", `.b2` "Built to grow",
`.b3` "From scratch"— quedan **agrupados y solapándose** unos con otros y con el texto.

**Causa:** bajo 980px `.about-grid` pasa a una columna y `.about-visual` (con `aspect-ratio: 1/1`,
`max-width: 460px`) **se encoge**, pero las `FloatingCard` tienen **padding y tipografía fijos en px** → ocupan
proporcionalmente mucho más, y sus offsets en **%** (`.b1` `top:2%/left:-6%`, `.b2` `bottom:22%/right:-10%`,
`.b3` `bottom:0%/left:10%`) las juntan hasta solaparse.

El **Hero ya resuelve exactamente esto**: en `Hero.module.scss` oculta `:global(.hero-float)` con
`display: none !important` bajo `760px`. About no tiene el equivalente.

## Fix (decisión del humano: ocultarlos en móvil)

En `apps/web/src/components/About/About.module.scss`, dentro de `.about-visual`, añade un bloque
`@media (max-width: 760px)` que **oculte** `:global(.b1)`, `:global(.b2)`, `:global(.b3)` — **paridad con el
Hero** (mismo breakpoint, mismo patrón).

- No se pierde información: esos tres puntos ya están en el cuerpo de About como tarjetas
  ("Real Custom Development", "You Own Everything", "Built to Grow With You").
- El **orbit + center-logo se mantienen** visibles en móvil (solo se ocultan los badges).
- Usa el mismo mecanismo que el Hero. Si el Hero necesita `!important` por el `<style>` scoped de
  `FloatingCard` (ver el comentario en `Hero.module.scss`), aquí pasará lo mismo — replícalo **y reutiliza el
  comentario explicativo** para que se entienda por qué.
- **Bonus opcional (solo si es trivial):** el comentario del Hero apunta a la causa real —`FloatingCard` usa
  `<style>` scoped de Astro con `display:flex`, que gana en cascada. Si migrar `FloatingCard` a CSS Modules es
  barato y deja **eliminar los dos `!important`**, hazlo; si no, **déjalo anotado** y no infles el diff.

## Tests (coherencia SDD/TDD)

- E2E (Playwright) `[SPEC-SEC-010/RF-x]` — usa el RF que cubra el visual de About; si no hay ninguno, cita el más
  cercano y déjalo constatado: en viewport móvil (p. ej. 430×932) los badges `.b1/.b2/.b3` **no son visibles**;
  en desktop **sí** lo son (y siguen animando — no rompas el E2E de `animations.spec.ts` del prompt 49: ojo, ese
  test corre en desktop, verifícalo).
- Rojo antes del fix (hoy son visibles y se solapan en móvil), verde después.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- Gates verdes, incluido `animations.spec.ts` (las animaciones siguen vivas en desktop).
- Visual a 430×932: la sección About se ve limpia, sin badges solapados; el orbit sigue girando.
- **QA-001:** si el gate compara en viewport desktop, no debería cambiar nada.

## Git (ciclo de vida — AGENTS.md §4)

Rama `fix/about-floats-mobile` **desde `develop`**; Conventional Commit (`fix`, scope `ui`), incluye `docs/`.
`pnpm exec prettier --write .` (solo código). Al terminar y verde: **merge a `develop` y borra la rama**.

## Entregable

Badges de About ocultos bajo 760px (paridad con Hero), orbit y center-logo intactos; E2E de visibilidad
móvil/desktop; nota sobre el `!important` / migración de `FloatingCard` si aplica. Reporta archivos tocados.
