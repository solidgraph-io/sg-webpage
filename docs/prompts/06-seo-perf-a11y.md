# Prompt 06 — SEO + Performance + Accesibilidad (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills `.claude/skills/`. Metodología (SDD + TDD +
Atomic Design + SRP) vinculante.

## Objetivo

Pulido de lanzamiento (M1), en estas specs Approved y en este orden:

1. `docs/specs/SPEC-SEO-001.md` — metadatos, OG, JSON-LD (LocalBusiness), canonical, sitemap, robots, `SiteConfig`.
2. `docs/specs/SPEC-A11Y-001.md` — auditoría WCAG AA de página, skip-link, teclado, gate CI.
3. `docs/specs/SPEC-PERF-001.md` — presupuestos Lighthouse (gate CI), imágenes `astro:assets`, 0 JS.

## Autorización

SEO-001 y A11Y-001 **modifican `BaseLayout`** (head/JSON-LD/meta y skip-link/`<main>`). Queda
**autorizado** por sus specs; mantén `BaseLayout` en SRP (solo head/tema/landmarks/slot). SEO-001
añade una **colección `settings`** nueva (no toca el contrato de bloques).

## Reglas (no negociables)

- **TDD:** por cada `RF/RNF/INV`, test en **rojo** citando la spec: `it('[SPEC-SEO-001/RF-2] JSON-LD LocalBusiness is valid')`. Luego verde, luego refactor.
- **Datos como dato:** los datos de negocio (name, locations Charlotte NC + Springfield MO, url, logo) viven en `content/settings/site.json` con su schema Zod; **nada hardcodeado** en componentes.
- **Sin JS de cliente** en M0: PERF-001 incluye un test de **0 KB de JS** en la home. Skip-link y foco son CSS.
- **Gates bloqueantes:** Lighthouse CI (perf) y axe de página (a11y) **fallan el pipeline** si se incumplen, igual que el trace check. Refléjalo en `.drone.yml`/workflow.
- **SRP:** lógica SEO en `lib/seo.ts` + un partial de head; config de perf en `lighthouserc`; skip-link/foco en layout/estilos globales.
- **Git:** una rama por spec (`feature/SPEC-SEO-001-seo`, `feature/SPEC-A11Y-001-a11y`, `feature/SPEC-PERF-001-perf`); Conventional Commits con footer `[SPEC-XXX]`, scope `seo`/`a11y`/`perf`.

## Pasos por spec

1. Lee la spec. Escribe tests en rojo (JSON-LD válido, canonical/sitemap/robots, outline; axe de página, skip-link, teclado; presupuestos Lighthouse, 0 JS, imágenes con width/height).
2. Implementa el mínimo; usa `astro:assets` para imágenes y verifica el preload de Poppins.
3. Añade los gates a CI (Lighthouse + axe de página) además del trace/coverage ya existentes.
4. Refactor; `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` en verde + los nuevos gates.
5. Actualiza Trazabilidad + Estado (`Implemented`) de cada spec y `docs/05`.

## Detente y confirma con el humano si

- Un presupuesto de Lighthouse realista no se alcanza sin decisiones de producto (p. ej. tamaño de imágenes del diseño) → propón umbrales y coméntalo.
- Hace falta un island (JS) para cumplir a11y de algo → proponlo antes (preferimos CSS/`<details>`).
- Faltan datos de negocio reales para `SiteConfig` (email de contacto, perfiles `sameAs`) → pídelos.

## Entregable

SEO completo (JSON-LD/OG/canonical/sitemap/robots), a11y AA a nivel de página con skip-link y
gate, y presupuestos de performance como gate en CI. Specs `Implemented`, `docs/traceability.md`
al día. Al terminar, resume y confirma que lo siguiente es **EPIC-06 (form de leads)**,
**EPIC-10 (Umami)** o **EPIC-05 (Sveltia CMS)**.
