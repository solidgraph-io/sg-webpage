---
type: Spec
title: "SPEC-SEC-015 — Ensamblado: index + `<head>`/SEO base + fidelidad de página completa"
description: "Las 14 secciones están construidas y verificadas por separado."
tags: [sec]
timestamp: 2026-07-09T00:32:49-04:00
---

# SPEC-SEC-015 — Ensamblado: index + `<head>`/SEO base + fidelidad de página completa

- **ID:** SPEC-SEC-015
- **Estado:** Approved
- **Épica / Story:** EPIC-21 / STORY-211 (ensamblado)
- **Capa atómica:** page / template
- **Depende de:** [SPEC-SEC-001](/specs/SPEC-SEC-001.md)..014, [SPEC-QA-001](/specs/SPEC-QA-001.md)
- **Fuente:** `design/template/index.html` (orden y ensamblado de las 14 secciones)

## Contexto / problema

Las 14 secciones están construidas y verificadas por separado. Falta **ensamblar la home completa**
en el orden del diseño, con el `<head>`/SEO base, y verificar la **página completa** contra el diseño.

## Requisitos funcionales (testeables)

- **RF-1 (orden)** — `index.astro` compone las 14 secciones en el **orden de `design/template/index.html`**: Nav, Hero, Marquee, PainPoints, Value, HowItWorks, Plans, Testimonials, Portfolio, About, Faq, CtaStrip, Contact, Footer.
- **RF-2 (datos)** — todo el contenido vive en **datos tipados** (p. ej. `src/content/home.ts` o similar), no hardcodeado en los componentes. Un único origen de datos de la home.
- **RF-3 (`<head>`/SEO base)** — `BaseLayout` recibe `seo` real (title, description, canonical desde `PUBLIC_SITE_URL`, Open Graph básico, favicon, `lang`). _(JSON-LD/sitemap/robots avanzados → EPIC-07, diferido.)_
- **RF-4 (fidelidad de página)** — `design/template/index.html` existe como fuente de referencia. La fidelidad de página completa se alcanza via los gates por sección (SPEC-SEC-001..014 compareWithDesign). Self-baselines de página (`toHaveScreenshot` en page.spec.ts) retirados per [ADR-0014](/adr/0014-design-gate-sole-visual-regression.md) (drift de entorno, 1 px → falsos fallos).
- **RF-5 (integración)** — `interactions.js` opera sobre toda la página (reveal/nav/magnetic) con progressive enhancement; sin errores de consola.

## Requisitos no funcionales

- **RNF-1 (a11y de página)** — un solo `<h1>` (Hero); landmarks `header`/`main`/`footer`; skip-link (o diferir a EPIC-08); axe de página sin violaciones AA nuevas.
- **RNF-2 (perf)** — sin JS accidental; imágenes optimizadas; dentro del presupuesto (Lighthouse fino → EPIC-07).
- **RNF-3 (responsive)** — la página completa responde correctamente en desktop y mobile.

## Invariantes

- **INV-1** — el orden coincide con `index.html`; ninguna sección falta ni sobra.
- **INV-2 (SRP)** — `index.astro` solo compone (orden + datos); sin estilos ni lógica de sección.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: home completa fiel
  Given las 14 secciones y sus datos
  When se renderiza index.astro contra design/template/index.html
  Then el orden coincide y el diff de página está bajo umbral (desktop+mobile), un solo h1
```

## Fuera de alcance

- SEO avanzado (JSON-LD/sitemap/robots) → EPIC-07. Leads → EPIC-06. Analítica → EPIC-10. CMS → diferido.

## Trazabilidad

- **Tests:** `[SPEC-SEC-015/RF-1..5]`, `[.../RNF-1..3]`, `[.../INV-1..2]` — orden, datos únicos, `<head>`/SEO, gate de página, a11y de página.
- **PRs:** — · **ADR:** —
