---
type: Prompt
title: "Prompt 17 — SEO + Performance + Accesibilidad (para Claude Code)"
description: "Implementar, en orden, estas specs Approved:"
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 17 — SEO + Performance + Accesibilidad (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills. Metodología (SDD + TDD + Atomic Design + SRP)
vinculante. La home ya es **fiel al diseño** (M0) y está protegida por el **gate de fidelidad**
([SPEC-QA-001](/specs/SPEC-QA-001.md)). Este incremento es pulido de lanzamiento; **no debe alterar el render visible**
(el gate de fidelidad debe seguir verde).

## Objetivo

Implementar, en orden, estas specs Approved:

1. `docs/specs/SPEC-SEO-001.md` — metadatos, OG, JSON-LD (LocalBusiness), canonical, sitemap, robots, `SiteConfig`.
2. `docs/specs/SPEC-A11Y-001.md` — auditoría WCAG AA de página, skip-link (oculto hasta foco), teclado, gate CI.
3. `docs/specs/SPEC-PERF-001.md` — presupuestos Lighthouse (gate CI), imágenes `astro:assets`, presupuesto de JS.

## Autorización

SEO-001 y A11Y-001 **modifican `BaseLayout`** (head/JSON-LD/meta y skip-link/`<main>`), autorizado por
sus specs. Mantén `BaseLayout` en SRP. Datos de negocio en `src/config/site.ts` (`SiteConfig`), no hardcode.

## Reglas (no negociables)

- **TDD:** tests en rojo citando la spec (`it('[SPEC-SEO-001/RF-2] JSON-LD LocalBusiness is valid')`).
- **No romper la fidelidad:** el skip-link va **oculto hasta el foco**; los añadidos de `<head>` no cambian el render → corre el **gate QA-001** y verifica que sigue verde.
- **Gates bloqueantes nuevos:** Lighthouse CI (perf) y axe de página (a11y) **fallan el pipeline**; añádelos al `.drone.yml` junto a lint/type-check/test/trace/fidelidad.
- **Sin JS accidental:** el JS de cliente sigue siendo solo `interactions.js` (≤ ~5 KB); skip-link y foco por CSS.
- **SRP:** SEO en `lib/seo.ts` + partial de head; perf en `lighthouserc`; skip-link/foco en layout/estilos.
- **Git:** una rama por spec (`feature/SPEC-SEO-001-seo`, `-A11Y-001-a11y`, `-PERF-001-perf`); commits `[SPEC-XXX]`, scope `seo`/`a11y`/`perf`.

## Pasos

1. **SEO:** `SiteConfig` + JSON-LD LocalBusiness (Charlotte NC + Springfield MO) + OG/Twitter + canonical + sitemap + robots. Tests: JSON-LD válido, OG/canonical, sitemap/robots, outline (un h1). Verifica gate de fidelidad intacto.
2. **A11Y:** skip-link + `<main id>` + axe de página (0 violaciones AA) + verificación de teclado (nav/faq/ctas/form) + matriz de contraste + reduced-motion. Gate axe en CI.
3. **PERF:** Lighthouse CI con presupuestos (LCP/CLS/TBT/JS/img) como gate; imágenes raster vía `astro:assets`; verifica preload de fuentes y presupuesto de JS.
4. `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check` + nuevos gates en verde. Estado de las 3 specs a `Implemented`; actualiza `docs/05`.

## Detente y confirma con el humano si

- Faltan datos reales para `SiteConfig` (email/teléfono de contacto, perfiles `sameAs`) → pídelos.
- Un presupuesto Lighthouse realista no se alcanza sin decisiones de producto (tamaño de imágenes) → propón umbrales.
- Algo de a11y exige un island (JS) → proponlo antes (preferimos CSS/`<details>`).

## Entregable

SEO completo (JSON-LD/OG/canonical/sitemap/robots), a11y AA de página con skip-link y gate, y
presupuestos de performance como gate — **sin tocar la fidelidad visual**. Specs `Implemented`,
`docs/traceability.md` al día. Al terminar, resume y confirma los diferidos restantes (EPIC-06 leads,
EPIC-10 Umami, EPIC-30 contrato de bloques, deploy a producción).
