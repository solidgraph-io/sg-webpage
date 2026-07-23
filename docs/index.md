---
okf_version: "0.1"
---

# SolidGraph Website — Knowledge Bundle (OKF)

Raíz del bundle OKF del proyecto **sg-webpage** (ADR-0015 / SPEC-DOCS-OKF-001). Cada `.md`
es un *concepto* con frontmatter tipado; este índice es el catálogo top-level para
*progressive disclosure* (los índices por carpeta llegan en la Fase 2).

## Documentos raíz

- [01 — Arquitectura y Stack](/01-architecture-and-stack.md) — producto, stack Astro/SSR,
  contrato de bloques y pipeline de entrega del sitio de SolidGraph.
- [04 — Metodología de ingeniería](/04-engineering-methodology.md) — SDD + TDD + Atomic
  Design + trazabilidad (enfoque Guani) aplicados a este repo.
- [05 — Plan de implementación](/05-implementation-plan.md) — épicas, stories y specs con
  su estado; registro vivo del plan.
- [Traceability Matrix](/traceability.md) — matriz spec ↔ test generada por `pnpm trace`.
- [Log del bundle](/log.md) — historial cronológico curado de decisiones (OKF §7, reservado).

## Secciones

Cada subdirectorio tiene su `index.md` de *progressive disclosure* (OKF §6), generado por
`pnpm okf:index` (no editar a mano; el bloque siguiente lo mantiene el generador).

<!-- okf:index:start -->
- **[adr/](/adr/index.md)** — 7 conceptos · type: ADR
- **[deploy/](/deploy/index.md)** — 4 conceptos · type: Runbook
- **[prompts/](/prompts/index.md)** — 62 conceptos · type: Prompt
- **[specs/](/specs/index.md)** — 32 conceptos · type: Reference, Spec
<!-- okf:index:end -->

## Conformidad

`pnpm okf:check` valida el bundle: frontmatter parseable + `type` no vacío en cada
concepto y `okf_version` en este índice (duro); taxonomía, enlaces rotos e índices de
subdirectorio ausentes (warning). `pnpm okf:index -- --check` falla si un índice quedó
desactualizado; ambos corren en CI junto a `pnpm trace`.
