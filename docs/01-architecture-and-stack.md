# 01 — Arquitectura y Stack (SolidGraph Website / sg-webpage)

> Contexto y decisiones técnicas. Reglas: `../AGENTS.md`. Metodología: `04-engineering-methodology.md`.
> Arquitectura de la fábrica: `../../agency-structure/Agency Structure/ARQUITECTURA.md`.

## 1. Qué es

Sitio corporativo de **SolidGraph Solutions LLC** — agencia de webs a medida para negocios
locales (Charlotte, NC · Springfield, MO). Implementación de referencia del **tier básico** de
la fábrica (dogfooding). **El diseño ya está definido** (Claude Design). Copy en inglés (US),
tono honesto/anti-plantilla.

## 2. Stack (cerrado)

| Capa           | Decisión                                                       | Nota                                                                      |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Framework      | **Astro** + adaptador **Node standalone** (hybrid)             | Estático + endpoints (form de leads). Puerto 4321. Sin Next.js.           |
| Lenguaje       | **TypeScript** strict                                          | `astro check` en CI.                                                      |
| Componentes    | **Atomic Design + SRP**                                        | atoms→molecules→organisms→templates→pages; componentes pequeños (ver §3). |
| Contenido      | **Astro Content Collections** (Zod)                            | El schema Zod es el contrato de bloques.                                  |
| CMS edición    | **Sveltia CMS** en `/admin` (git-based)                        | Estático; sin servidor propio.                                            |
| Estilos        | **Tailwind** + design tokens (§5)                              | daisyUI opcional (probablemente omitir: diseño bespoke).                  |
| Interactividad | **Astro islands** (nav móvil, FAQ)                             | Mínimo JS.                                                                |
| Monorepo       | **Turborepo** + **pnpm 9.15.9** · **Node 22**                  | Remote cache self-hosted. Se mantiene para futuro `apps/crm`.             |
| Tests          | Vitest + `astro/container` · Playwright · axe · Lighthouse CI  | Ver `04` §3.                                                              |
| CI/CD          | DroneCI → Custom Registry → Dokploy → VPS/Docker               | §6.                                                                       |
| Media          | MinIO (S3)                                                     | Assets/media.                                                             |
| Deploy         | Imagen Docker multi-stage (Node adapter), Traefik + Cloudflare | Web = Node server ligero.                                                 |

## 3. Estructura del monorepo + capas atómicas

```
sg-webpage/ (monorepo Turborepo)
├── AGENTS.md · CLAUDE.md
├── design/                       # export de Claude Design (fuente del diseño)
├── apps/
│   └── web/  # @solidgraph/web
│       └── src/
│           ├── components/
│           │   ├── atoms/        # Logo, Button, Icon, Heading, Prose, Badge, Input…
│           │   ├── molecules/    # NavItem, PlanFeature, StepItem, TestimonialCard, FaqItem…
│           │   ├── organisms/    # Nav, Hero, Pricing, Testimonials, Faq, Footer… (= bloques)
│           │   └── templates/    # PageTemplate (BlockRenderer)
│           ├── content/{config.ts, pages/}   # schema Zod + contenido
│           ├── layouts/BaseLayout.astro
│           ├── lib/{blocks.ts, seo.ts}
│           ├── pages/{index.astro, [...slug].astro, api/lead.ts}
│           └── styles/           # Tailwind + tokens.css
│       └── public/admin/         # Sveltia CMS
├── packages/
│   ├── blocks-contract/          # @solidgraph/blocks-contract — schema Zod (fuente de verdad)
│   ├── typescript-config/ · eslint-config/
├── docs/ (01,04,05, specs/, adr/, traceability.md)
├── scripts/trace.ts
├── .claude/{commands/, skills/{design-to-components, spec-driven-development}}
├── .drone.yml · docker-compose.yml · turbo.json · pnpm-workspace.yaml · .env.example
```

**Atomic Design (regla, ver `../AGENTS.md` §2):** los **organismos son los bloques** del
contrato; átomos/moléculas son piezas internas reutilizables. **SRP:** un componente = una
responsabilidad, ≤ ~150 líneas; descompón antes que agrandar. Construcción **bottom-up**.
El `BlockRenderer` mapea `block.type` → organismo. Conversión desde el diseño: skill
`design-to-components`.

## 4. Inventario (del diseño) — mapa atómico

- **Atoms:** Logo, Button (primary/secondary/link), Icon, Eyebrow, Heading, Prose, Badge, PriceTag, Avatar, Divider, Input, Textarea.
- **Molecules:** NavItem, CtaGroup, PlanFeature, StepItem, StatItem, TestimonialCard, FaqItem, FeatureItem, PlanCard, FooterColumn, FormField.
- **Organisms (bloques):** Nav, Hero, PainPoints, ValueProp, Process, Pricing, MaintenancePlans, Stats, Testimonials, CtaBand, About, Faq, Footer.

## 5. Marca (design tokens)

`src/styles/tokens.css`; tipografía **Poppins** self-hosted.

```css
:root {
  --bg: #131634;
  --bg-deep: #0c0e23;
  --panel: #1f2c66;
  --panel-alt: #2d3d8a;
  --brand: #3a4db0;
  --brand-500: #5c70d6;
  --brand-300: #7d8ef0;
  --brand-700: #2433a0;
  --accent: #34d39a;
  --accent-deep: #1a8c63;
  --warn: #ffd166;
  --text: #f4f6fc;
  --text-soft: #d8defa;
  --text-muted: #9aa0c4;
}
```

Logos/favicon de la empresa: en **`design/assets/`** → copiar los necesarios a `apps/web/public/`.

## 6. Infra y CI/CD

`git push` → **DroneCI** → **Custom Registry** (`registry.solidgraph.dev`) → **Dokploy** (webhook
por servicio) → **VPS/Docker**. **MinIO** (S3) para media. **Traefik** (vía Dokploy) TLS/routing;
Cloudflare por encima. Pipeline web-only: `install → validate → build (turbo) → build-push-web →
trigger-dokploy`. Imagen multi-stage (Node adapter, `node dist/server/entry.mjs`, puerto 4321).
Configs de referencia (proyecto Strapi) en `../../agency-structure/Agency Structure/assets/`.
⚠️ el `.env` de ese ejemplo trae **secretos reales**: rotar, no commitear.
