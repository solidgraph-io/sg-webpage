# SPEC-SEO-001 — SEO de lanzamiento: metadatos, OG, JSON-LD, sitemap, robots

- **ID:** SPEC-SEO-001
- **Estado:** Implemented
- **Épica / Story:** EPIC-07 / STORY-071 (SEO)
- **Capa atómica:** cross-cutting (layout + build)
- **Depende de:** SPEC-DS-001 (BaseLayout/seo base), SPEC-SEC-015 (home ensamblada), **SPEC-CONTENT-001** (SiteConfig CMS-editable)

## Contexto / problema
La home ya tiene SEO base (title/description en `BaseLayout`). Falta el SEO de lanzamiento: datos
estructurados de negocio local, tarjetas sociales completas, canonical, `sitemap.xml` y `robots.txt`.
Los datos de negocio son **dato tipado**, no hardcode (no hay contrato de bloques: van en `SiteConfig`).

## Requisitos funcionales (testeables)
- **RF-1 (SiteConfig)** — **usa el `settings/site` de SPEC-CONTENT-001** (Content Collection, **CMS-editable** por Sveltia): `name`, `legalName?`, `url`, `logo`, `locations[]`, `contact?`, `sameAs?`, `defaultSeo`. **No** crear un `.ts` hardcodeado — el SEO se deriva del contenido editable.
- **RF-2 (JSON-LD)** — `BaseLayout` inyecta `<script type="application/ld+json">` con `LocalBusiness` derivado de `SiteConfig` (name, url, logo, `areaServed`/`location` = Charlotte NC + Springfield MO). Válido contra la forma schema.org (test).
- **RF-3 (Open Graph + Twitter)** — tags OG (`og:title/description/image/url/type`) y `twitter:card` completos desde `seo` + defaults de `SiteConfig`; imagen OG por defecto.
- **RF-4 (canonical)** — `<link rel="canonical">` absoluto por página desde `PUBLIC_SITE_URL` + slug.
- **RF-5 (sitemap)** — `sitemap.xml` generado (integración `@astrojs/sitemap` o endpoint) listando las páginas publicadas.
- **RF-6 (robots)** — `robots.txt` (allow + referencia al sitemap); `noindex` global cuando `ENV=staging`.
- **RF-7 (outline)** — un solo `<h1>` en la home (Hero) y jerarquía de headings válida (test de outline).

## Requisitos no funcionales
- **RNF-1 (perf)** — JSON-LD/meta no bloquean el render; sin JS de cliente añadido.
- **RNF-2 (fidelidad)** — los añadidos de `<head>` **no** alteran el render visible → el gate de fidelidad (QA-001) sigue verde.

## Invariantes
- **INV-1** — cero datos de negocio hardcodeados en componentes: todo desde `SiteConfig`.
- **INV-2** — el JSON-LD valida (campos obligatorios de `LocalBusiness` presentes); test lo verifica.
- **INV-3 (SRP)** — la lógica SEO vive en `lib/seo.ts` + un partial de head, no dispersa por secciones.

## Criterios de aceptación (Gherkin)
```gherkin
Scenario: JSON-LD LocalBusiness válido
  Given SiteConfig con name, url, logo y 2 locations
  When se renderiza BaseLayout
  Then el head incluye JSON-LD LocalBusiness con name/url/logo/areaServed y valida

Scenario: canonical y sitemap
  Given PUBLIC_SITE_URL configurado
  When se construye el sitio
  Then cada página tiene <link rel=canonical> absoluto y existe sitemap.xml que la lista

Scenario: robots noindex en staging
  Given ENV=staging
  When se construye
  Then robots.txt/meta marcan noindex
```

## Fuera de alcance
- Optimización de imágenes/perf → SPEC-PERF-001. Auditoría a11y → SPEC-A11Y-001.

## Trazabilidad
- **Tests:** `[SPEC-SEO-001/RF-1..7]`, `[.../RNF-1..2]`, `[.../INV-1..3]` — parse de `SiteConfig`, JSON-LD válido, OG/canonical, sitemap/robots, outline de headings, gate de fidelidad intacto.
- **PRs:** —
