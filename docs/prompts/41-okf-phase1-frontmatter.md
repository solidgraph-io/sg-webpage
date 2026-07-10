---
type: Prompt
title: "Prompt 41 — OKF Fase 1: frontmatter + tipos + index raíz (con `okf:check` en TDD)"
description: "Convertir docs/ en un bundle OKF conformante mínimo: frontmatter tipado en cada concepto + index.md raíz con okfversion, verificado por un pnpm okf:check que construyes en este mi…"
tags: [prompt, okf]
timestamp: 2026-07-10T21:23:58.637Z
---

# Prompt 41 — OKF Fase 1: frontmatter + tipos + index raíz (con `okf:check` en TDD)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa SPEC-DOCS-OKF-001 (Fase 1 de ADR-0015).
> Cambio **docs + un script/tests de tooling**; no toca código de la app.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4, **ADR-0015** (`docs/adr/0015-adopt-open-knowledge-format-okf.md`)
y **SPEC-DOCS-OKF-001** (`docs/specs/SPEC-DOCS-OKF-001.md`). TDD + trazabilidad. Todo va contra `develop`.

## Objetivo (Fase 1 + núcleo del checker)

Convertir `docs/` en un **bundle OKF conformante mínimo**: frontmatter tipado en cada concepto + `index.md`
raíz con `okf_version`, verificado por un **`pnpm okf:check`** que construyes en este mismo prompt (es el arnés
de test rojo→verde). El cableado del check al CI queda para la Fase 4.

## Ciclo TDD

### 1. Rojo — `okf:check` + tests

Crea el checker (Node/TS, deps mínimas — usa el parser `yaml` ya presente en el repo) como script del repo,
expuesto como **`pnpm okf:check`** (cablealo igual que está cableado `pnpm trace`). Debe implementar
SPEC-DOCS-OKF-001:

- **RF-2/RF-3 (duro):** todo `.md` no reservado bajo `docs/` tiene frontmatter YAML parseable con `type` no vacío.
- **RF-1 (duro):** `docs/index.md` tiene frontmatter con `okf_version: "0.1"`.
- **RF-4 (warning):** `type` fuera de la taxonomía `Spec|ADR|Prompt|Architecture|Methodology|Plan|Runbook|Index|Reference`.
- **RF-5 (warning):** enlaces bundle-relativos (`/….md`) que no resuelven dentro de `docs/`.
- **RF-6 (exit codes):** falla (exit ≠ 0) **solo** por RF-1/RF-2/RF-3; warnings no rompen (exit 0).

Tests etiquetados `[SPEC-DOCS-OKF-001/RF-x]` con fixtures: concepto válido → ok; sin `type` → exit ≠ 0;
frontmatter no parseable → exit ≠ 0; index raíz sin `okf_version` → exit ≠ 0; `type` raro → warning + exit 0;
enlace roto → warning + exit 0. En rojo porque los docs aún no tienen frontmatter.

### 2. Verde — añadir frontmatter (aditivo, no destructivo)

Añade a **todos** los `docs/**/*.md` (incluida `SPEC-TEMPLATE.md`) un bloque frontmatter YAML **encima** del
contenido actual, **sin borrar** el body existente (los ADRs/specs conservan su cabecera `- **ID/Estado…**`).
Mapa de `type` (de SPEC-DOCS-OKF-001 / ADR-0015):

| Ruta | `type` |
| --- | --- |
| `docs/specs/SPEC-*.md` | `Spec` |
| `docs/adr/00XX-*.md` | `ADR` |
| `docs/prompts/NN-*.md` | `Prompt` |
| `docs/01-architecture-and-stack.md` | `Architecture` |
| `docs/04-engineering-methodology.md` | `Methodology` |
| `docs/05-implementation-plan.md` | `Plan` |
| `docs/deploy/*.md` | `Runbook` |
| `docs/traceability.md` | `Index` |
| `docs/specs/SPEC-TEMPLATE.md` | `Reference` |

Frontmatter por archivo:

```yaml
---
type: <según tabla>          # REQUERIDO
title: <deriva del H1>
description: <una línea; para specs/ADRs, su objetivo/decisión en una frase>
tags: [<dominio>]            # opcional (p. ej. [a11y], [deploy], [okf])
timestamp: <ISO 8601 del último commit del archivo, o hoy si no aplica>
---
```

Crea **`docs/index.md`** (archivo reservado, sin `type`) con frontmatter que declara solo
`okf_version: "0.1"`, y un body breve que liste las secciones top-level (specs/, adr/, prompts/, deploy/ y los
docs numerados) con su `description` — catálogo mínimo de *progressive disclosure* (la generación completa por
carpeta es Fase 2, aquí basta el raíz).

No conviertas todavía las referencias en prosa a enlaces (eso es Fase 3); RF-5 solo **reporta** los que ya
existan como enlaces.

## Reglas

- **Aditivo:** solo agregas frontmatter + `docs/index.md`. No reescribas bodies (RNF-1).
- Archivos reservados (`index.md`, `log.md`) no llevan `type`; el único `index.md` con frontmatter es el raíz.
- Verifica que **`pnpm trace`** sigue verde (el frontmatter va **encima**; los tags `[SPEC-…/RF-y]` siguen en el body).
- Si algún test existente lee un doc y asevera su primera línea, ajústalo citando la spec.

## Verificación antes de "listo"

```
pnpm okf:check          # exit 0, sin violaciones duras
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check
pnpm exec prettier --write .   # solo código/tooling; ojo de no romper el frontmatter
```

- `okf:check` verde; su suite de tests verde; `trace` verde.
- Reporta cuántos docs recibieron frontmatter y cualquier warning de RF-4/RF-5.

## Git (ciclo de vida — AGENTS.md §4)

Rama `feat/okf-phase1-frontmatter` **desde `develop`**; Conventional Commit (`docs`/`chore`, scope `okf`),
incluye `docs/` y el script/tests. Al terminar y verde: **merge a `develop` y borra la rama**.

## Entregable

`docs/` como bundle OKF mínimo conformante: frontmatter tipado en todos los conceptos, `docs/index.md` con
`okf_version: "0.1"`, y `pnpm okf:check` (con tests) en verde. CI-wiring y generación de índices por carpeta
quedan para fases siguientes. Reporta archivos tocados.
