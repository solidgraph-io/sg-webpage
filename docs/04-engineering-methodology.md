# 04 — Metodología de Ingeniería: SDD + TDD + Atomic Design + Arneses de IA

> **Estado:** v1 · Metodología **vinculante** (la hacen cumplir CI y los arneses `../AGENTS.md` /
> `../CLAUDE.md`). Heredada de **Guani**, adaptada a un sitio de marketing con diseño ya
> definido: controles = **Atomic Design + SRP, a11y AA, performance, SEO, contrato de contenido**.

## 1. Spec-Driven Development (SDD)
Nada se implementa sin spec:
```
Diseño (design/) → SPEC (docs/specs/SPEC-<DOM>-<NNN>.md) → ADR si aplica
  → Tests (rojo) → Implementación (verde) → Refactor → PR (cita SPEC)
```
SPEC: ID estable · Estado Draft→Review→Approved→Implemented→Verified · Contexto · `RF-x` ·
`RNF-x` (a11y/perf/SEO/responsive) · `INV-x` · Gherkin · Fuera de alcance · Trazabilidad.
Plantilla: `docs/specs/SPEC-TEMPLATE.md`. Dominios: `LAYOUT|ATOM|MOLECULE|BLOCK|CONTENT|CMS|FORM|SEO|A11Y|PERF|ANALYTICS|INFRA`.

**Regla de oro:** cada `RF-x` → ≥1 test `it('[SPEC-XXX/RF-y] ...')`. `scripts/trace.ts` →
`docs/traceability.md`; CI falla si una spec `Approved` tiene un requisito sin test.

## 2. Atomic Design + SRP
Conversión del diseño → componentes con la skill **`design-to-components`**. Capas
`atoms→molecules→organisms→templates→pages`; organismos = bloques del contrato. **SRP:**
componente = una responsabilidad, ≤ ~150 líneas; descompón antes que agrandar. Bottom-up.
Detalle: `../AGENTS.md` §2 y la skill.

## 3. TDD (Red → Green → Refactor)
Pirámide: Vitest+`astro/container` (componentes) · Zod (contrato de contenido) · axe (a11y AA) ·
Playwright (e2e + **regresión visual vs. `design/`**) · Lighthouse CI (perf). Un test rojo antes
de cada comportamiento; bug → test primero; schema Zod = fuente de verdad; cobertura
render/adapter/endpoint ≥ 85% / resto ≥ 70%. Proveedores externos tras puerto con test de contrato.

## 4. Git Flow + Conventional Commits + CI (resumen — detalle `../AGENTS.md` §4)
Ramas que citan la spec; commits `[SPEC-XXX]`; PR con SPEC(+ADR) + checklist; revisión extra si
toca contrato de bloques/layout. Gates CI: `lint → type-check → unit+contract → a11y → build →
coverage → trace check → visual/e2e → security scan`. Entrega: DroneCI → registry → Dokploy.

## 5. Arneses de IA
`AGENTS.md` (reglas) · `CLAUDE.md` (importa `@AGENTS.md` + Claude specifics) · `docs/specs/` ·
comandos `.claude/commands/` (`/new-spec`, `/tdd`, `/trace`, `/review-quality`) · skills
(`design-to-components`, `spec-driven-development`).

## 6. Cómo escala
Trazabilidad diseño→spec→ADR→test→commit→PR. El contrato de bloques + Atomic Design permiten
reutilizar componentes en la fábrica. Gates de CI mantienen la calidad al sumar agentes de IA.
