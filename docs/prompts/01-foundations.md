# Prompt 01 — Fundaciones + sistema de diseño (para Claude Code)

> Pégale esto a Claude Code ejecutando **en la raíz del repo `sg-webpage`**.

---

Eres un implementador en el repo `sg-webpage`. Antes de escribir nada, **lee y respeta**:
`AGENTS.md`, `CLAUDE.md`, `docs/01-architecture-and-stack.md`, `docs/04-engineering-methodology.md`,
`docs/05-implementation-plan.md`, y las skills `.claude/skills/`. La metodología (SDD + TDD +
Atomic Design + SRP) es **vinculante**.

## Objetivo de este incremento
Implementar, en este orden, las specs **ya Approved**:
1. `docs/specs/SPEC-INFRA-001.md` — fundaciones (monorepo Turborepo + Astro + tooling + tests + `scripts/trace.ts` + Docker/`.drone.yml` web-only).
2. `docs/specs/SPEC-LAYOUT-001.md` — sistema de diseño base (tokens + Tailwind + Poppins self-hosted + `BaseLayout` + SEO base).

## Reglas de trabajo (no negociables)
- **TDD estricto:** por cada `RF-x`/`RNF-x`/`INV-x`, escribe primero un test en **rojo** cuyo nombre **cite la spec**: `it('[SPEC-INFRA-001/RF-2] ...')`. Luego implementa el mínimo (verde) y refactoriza.
- **Atomic Design + SRP:** componentes pequeños (una responsabilidad, ≤ ~150 líneas). En este incremento aún no hay átomos de UI, pero `BaseLayout` solo compone `<head>` + tema + slot.
- **Contenido/estilo como dato:** nada de colores/tamaños hardcodeados fuera de `tokens.css`/config de Tailwind.
- **Sin Next.js.** Astro + `@astrojs/node` standalone. **Sin secretos** en el repo (`.env.example` con placeholders).
- **Git:** rama `feature/SPEC-INFRA-001-foundations` (y luego `feature/SPEC-LAYOUT-001-design-system`). Conventional Commits con footer que cita la spec (p. ej. `feat(infra): scaffold turborepo [SPEC-INFRA-001]`).

## Pasos
1. **Copia el diseño al repo** (RF-9 de INFRA-001): 
   ```
   cp "../agency-structure/Agency Structure/assets/SolidGraph Website (standalone).html" design/solidgraph-website.html
   mkdir -p design/assets && cp -r "../agency-structure/Agency Structure/assets/Logos_SolidGraph/." design/assets/
   ```
   (Es la **fuente de verdad visual**; ver `design/README.md`.)
2. **Scaffold** según SPEC-INFRA-001: Turborepo (pnpm 9.15.9, Node 22), `apps/web` (Astro + `@astrojs/node` + Tailwind + TS strict), `packages/{blocks-contract,typescript-config,eslint-config}`, ESLint/Prettier/commitlint, Vitest + `astro/container` + vitest-axe + Playwright, `scripts/trace.ts`, `Dockerfile`/`Dockerfile.dev`/`docker-compose.yml` **web-only** y `.drone.yml` **web-only**. Adapta los ejemplos de `../agency-structure/Agency Structure/assets/` (quita todo lo de Strapi/`apps/cms`).
3. **Implementa SPEC-LAYOUT-001**: `src/styles/tokens.css` (tokens de `docs/01` §5), config de Tailwind consumiendo tokens, **Poppins self-hosted** (400/500/600/700, `font-display: swap`, `preload`, sin CDN), `src/layouts/BaseLayout.astro`, `src/lib/seo.ts`, estilos globales + `:focus-visible`. Tests: render (`astro/container`), a11y (axe AA), contraste `--text`/`--bg` ≥ 4.5:1, y "no hay `fonts.googleapis.com`".
4. **Verifica** antes de cerrar: `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check`. `docs/traceability.md` debe mostrar SPEC-INFRA-001 y SPEC-LAYOUT-001 con todos sus RF/RNF/INV cubiertos.
5. **Actualiza** el bloque de Trazabilidad de cada spec (tests + PR) y su Estado a `Implemented`; refleja el avance en `docs/05-implementation-plan.md`.

## Detente y confirma con el humano si
- Necesitas cambiar el **contrato de bloques** o el layout global de forma no prevista.
- Vas a **activar deploy de producción** (registry/Dokploy reales) — deja el pipeline listo pero no lo dispares.
- Vas a añadir una dependencia pesada no contemplada en la spec.

## Entregable
Dos ramas/PRs (INFRA-001 y LAYOUT-001) con specs `Implemented`, tests en verde citando las specs,
`docs/traceability.md` generado, y la web booteable (`pnpm dev`) con el tema oscuro y Poppins.
Cuando termines, resume qué quedó y qué específica sigue (siguiente: átomos `Logo`/`Button`/`Heading`).
