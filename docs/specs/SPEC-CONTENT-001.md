---
type: Spec
title: "SPEC-CONTENT-001 — Capa de contenido CMS-ready (Content Collections + Zod)"
description: "Tras el rebuild v3, todo el contenido de la home vive inline como constantes const en index.astro (navLinks, hero, marquee, painItems…)."
tags: [content]
timestamp: 2026-07-07T12:44:46-04:00
---

# SPEC-CONTENT-001 — Capa de contenido CMS-ready (Content Collections + Zod)

- **ID:** SPEC-CONTENT-001
- **Estado:** Implemented
- **Épica / Story:** EPIC-22 / STORY-221 (contenido CMS-ready)
- **Capa atómica:** content / data
- **Depende de:** [SPEC-SEC-015](/specs/SPEC-SEC-015.md) (home ensamblada), [SPEC-QA-001](/specs/SPEC-QA-001.md) (gate de fidelidad)

## Contexto / problema

Tras el rebuild v3, **todo el contenido de la home vive inline como constantes `const` en
`index.astro`** (navLinks, hero, marquee, painItems…). Eso **no es editable por un CMS**: Sveltia
(git-based, EPIC-05) edita **archivos de datos** (JSON/YAML/MD con schema), no constantes TS en un
`.astro`. Para que los metadatos **y** el contenido sean CMS-editables **sin migración futura**, se
mueve el contenido a **Astro Content Collections** respaldadas por archivos de datos con **Zod**.
_(No se construye Sveltia aquí — solo se deja el contenido en archivos que Sveltia podrá mapear;
la config del admin es EPIC-05.)_

## Requisitos funcionales (testeables)

- **RF-1 (colecciones)** — `src/content/config.ts` define colecciones `type: 'data'`: **`settings`** (singleton `site`) y **`pages`** (singleton `home`), cada una con schema Zod. Formato de archivo JSON o YAML (Sveltia-mapeable).
- **RF-2 (schema `site` = SiteConfig)** — `content/settings/site.*`: `name`, `legalName?`, `url`, `logo`, `locations[]`{`city`,`region`}, `contact?`{`email?`,`phone?`}, `sameAs?[]`, `defaultSeo`{`title`,`description`,`ogImage?`}. Fuente única de datos de negocio + SEO por defecto.
- **RF-3 (schema `home`)** — `content/pages/home.*`: **todos** los datos de sección (nav, hero, marquee, painPoints, value, howItWorks, plans, testimonials, portfolio, about, faq, cta, contact, footer) como sub-objetos tipados + `seo?` de página (override del `defaultSeo`).
- **RF-4 (migración verbatim)** — mover **todo** el contenido inline de `index.astro` a los archivos de datos **sin cambiar el copy** (verbatim). No queda contenido en constantes del `.astro`.
- **RF-5 (index lee de la colección)** — `index.astro` obtiene el contenido con `getEntry('settings','site')` + `getEntry('pages','home')` y pasa props a las secciones. `index.astro` **solo compone** (orden + datos); sin copy.
- **RF-6 (fail-fast)** — contenido inválido contra el schema **rompe el build** (Zod).
- **RF-7 (CMS-ready)** — documentar en la spec/README cómo cada colección mapeará a Sveltia (colecciones tipo "file"/singleton), para que EPIC-05 solo añada la config del admin, sin tocar los datos.

## Requisitos no funcionales

- **RNF-1 (fidelidad)** — es solo mover datos: el render **no cambia** → el **gate de fidelidad (QA-001) sigue verde** en todas las secciones y en la página completa (prueba de que la migración no rompe nada).
- **RNF-2 (type-safety)** — las props de sección se derivan de los schemas (`z.infer`); contenido mal tipado = error de `type-check`.

## Invariantes

- **INV-1** — **cero contenido hardcodeado** en componentes ni en `index.astro`; fuente única en `content/`.
- **INV-2 (SRP)** — `index.astro` solo compone; los schemas solo describen datos.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: contenido en archivos de datos, no en el .astro
  Given index.astro
  When se inspecciona
  Then no contiene constantes de contenido; lee de las colecciones settings/site y pages/home

Scenario: la migración no cambia el render
  Given el contenido migrado a content/
  When corre el gate de fidelidad (QA-001) en todas las secciones + página
  Then sigue verde (diff bajo umbral)

Scenario: fail-fast
  Given content/pages/home.* con un campo requerido ausente
  When se construye
  Then el build falla con error de validación Zod
```

## Fuera de alcance

- Config del **admin Sveltia** (mapeo colección→panel) → **EPIC-05**.
- SEO/JSON-LD/sitemap (consume `settings/site`) → **[SPEC-SEO-001](/specs/SPEC-SEO-001.md)**.
- Reintroducir el contrato de bloques/BlockRenderer para la fábrica → EPIC-30.

## Trazabilidad

- **Tests:** `[SPEC-CONTENT-001/RF-1..7]`, `[.../RNF-1..2]`, `[.../INV-1..2]` — parse de schemas, migración verbatim (contenido idéntico), index lee de colección, fail-fast, gate de fidelidad intacto.
- **PRs:** — · **ADR:** — (posible ADR futuro: "contenido en Content Collections CMS-ready; Sveltia mapea sin migración").
