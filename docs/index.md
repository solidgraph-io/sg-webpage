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

## Secciones

- **[specs/](/specs/SPEC-TEMPLATE.md)** — `type: Spec` (+ la plantilla como `Reference`).
  Reglas de cada incremento: RF/RNF/INV testeables, criterios Gherkin, trazabilidad.
- **[adr/](/adr/0015-adopt-open-knowledge-format-okf.md)** — `type: ADR`. Decisiones de
  arquitectura (component-as-folder, build-once, design-gate, OKF).
- **[prompts/](/prompts/41-okf-phase1-frontmatter.md)** — `type: Prompt`. Registro SDD de
  los prompts de implementación que dirigieron cada incremento.
- **[deploy/](/deploy/dev-stage.md)** — `type: Runbook`. Operación del stage dev
  (DroneCI → Registry → Dokploy → VPS).

## Conformidad

`pnpm okf:check` valida el bundle: frontmatter parseable + `type` no vacío en cada
concepto y `okf_version` en este índice (duro); taxonomía y enlaces rotos (warning).
