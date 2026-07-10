---
type: Prompt
title: "Prompt 16 — Contact + Footer + ensamblado del index (para Claude Code)"
description: "Implementar, en orden, estas specs Approved:"
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 16 — Contact + Footer + ensamblado del index (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. **Cierra la home.**

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills. Metodología (SDD + TDD + Atomic Design + SRP)
vinculante. Enfoque: **secciones directas** + **gate de fidelidad** (SPEC-QA-001, contra el diseño).

## Objetivo

Implementar, en orden, estas specs Approved:

1. `docs/specs/SPEC-SEC-013.md` — **13-contact** (UI del formulario; **el envío es EPIC-06, aquí NO**)
2. `docs/specs/SPEC-SEC-014.md` — **14-footer** (oscuro + watermark + brandLink a solidgraph.dev)
3. `docs/specs/SPEC-SEC-015.md` — **ensamblado**: `index.astro` con las 14 secciones en el orden de `design/template/index.html` + `<head>`/SEO base + **fidelidad de página completa**.

Fuente: `design/template/sections/1{3,4}-*.html`, `design/template/index.html` + `components/*.css`.

## Reglas (no negociables)

- **Port 1:1** (CSS scoped tal cual), primitivas compartidas; **no** re-traducir a Tailwind.
- **Extrae `FormField`** (contact) como molécula accesible; el `success-msg` queda **oculto** (lógica de envío en EPIC-06, no la implementes aquí).
- **Gate de fidelidad (QA-001):** contact y footer contra su HTML; y **SEC-015 añade un gate de página completa** contra `design/template/index.html` (estabiliza zonas de animación no determinista). Debe pasar desktop+mobile.
- **TDD:** tests en rojo citando la spec.
- **Tema:** Contact **claro**; Footer **oscuro** (`--night-2`).
- **Ensamblado (SEC-015):** todo el contenido en **datos tipados** (un único origen para la home); `index.astro` **solo** compone (orden + datos); `BaseLayout` con `seo` real (title/description/canonical/OG básico). Un solo `<h1>` (Hero).
- **Git:** una rama por spec (`feature/SPEC-SEC-013-contact`, `-014-footer`, `-015-assembly`); commits `[SPEC-SEC-01x]`, scope `section`/`page`.

## Pasos

1. Contact: porta la UI (FormField accesible, contact-alt); gate contra `13-contact.html` (success oculto).
2. Footer: porta el pie oscuro + watermark + brandLink; gate contra `14-footer.html`.
3. Ensamblado: compón las 14 en orden en `index.astro` desde datos tipados; `<head>`/SEO base; gate de **página completa** contra `index.html`; axe de página sin violaciones AA nuevas.
4. `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check` verde. Estado de las 3 specs a **Verified**; actualiza `docs/05`.

## Detente y confirma con el humano si

- El gate de página no baja del umbral por diferencias legítimas (repórtalo con capturas).
- Detectas discrepancias de contenido entre secciones y `index.html`.

## Entregable

**Home completa y fiel de arriba a abajo** (14 secciones en orden, gate de página verde desktop+mobile),
Contact UI + Footer verificados, `<head>`/SEO base, specs `Verified`, `docs/traceability.md` al día.
Con esto **M0 (sitio fiel) queda alcanzado**. Al terminar, resume con los % de diff (incl. página
completa) y confirma los diferidos que siguen: EPIC-06 (envío de leads), EPIC-07/08 (SEO/perf/a11y),
EPIC-10 (Umami), y la reintroducción del contrato de bloques para la fábrica.
