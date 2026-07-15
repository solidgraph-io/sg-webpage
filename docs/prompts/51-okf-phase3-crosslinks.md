---
type: Prompt
title: "Prompt 51 — OKF Fase 3: cross-links (codemod refs→enlaces) + matriz de trazabilidad intacta"
description: "Convertir las referencias en prosa (SPEC-XXX, ADR-XXXX) en enlaces bundle-relativos con un codemod pnpm okf:link idempotente y seguro (no toca code fences ni enlaces existentes). Mantener traceability.md + pnpm trace como gate; los enlaces se añaden como navegación. Implementa Fase 3 de ADR-0015 / SPEC-DOCS-OKF-001 (RF-5)."
tags: [prompt, okf, docs]
timestamp: 2026-07-11T05:40:00Z
---

# Prompt 51 — OKF Fase 3: cross-links (codemod) + trazabilidad

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa la **Fase 3** de **[ADR-0015](/adr/0015-adopt-open-knowledge-format-okf.md)** y
> **[SPEC-DOCS-OKF-001](/specs/SPEC-DOCS-OKF-001.md)/RF-5**. Cambio **docs + un script/tests de tooling**; no toca código de la app. TDD.
> Todo va contra `develop`.

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4, **ADR-0015** (plan fasado) y **SPEC-DOCS-OKF-001**
(RF-5 = enlaces bundle-relativos que resuelven). **Decisiones del humano:** (1) cross-linking **automatizado**
por codemod; (2) **mantener** `traceability.md` + `pnpm trace` como gate mecánico — los enlaces se **añaden**
como navegación, **no** reemplazan la matriz.

## Objetivo (Fase 3)

Convertir las **referencias en prosa** a otros conceptos (`SPEC-XXX`, `ADR-XXXX`) en **enlaces bundle-relativos**
navegables, con un codemod **seguro e idempotente**, sin tocar la matriz de trazabilidad.

## Ciclo TDD

### 1. Rojo — `pnpm okf:link` + tests

Crea el codemod (Node/TS, deps mínimas — reutiliza el parser `yaml` y el patrón de `pnpm trace`), expuesto como
**`pnpm okf:link`** (cablealo igual que `okf:check`/`okf:index`). Comportamiento:

- **Mapa de IDs → rutas** (Concept ID = ruta sin `.md`): specs por su `SPEC-ID` (del nombre de archivo /
  frontmatter), ADRs por su número (`ADR-0015` → `/adr/0015-….md`). Reutiliza el patrón de SPEC-ID ya
  generalizado en `trace` (`SPEC-[A-Z]+(?:-[A-Z]+)*-\d+`) y `ADR-\d{4}`.
- **Reescritura:** por cada documento, la **primera** mención de cada target distinto (`SPEC-QA-001`,
  `ADR-0014`) que **no** esté ya enlazada → enlace **absoluto al bundle** `[SPEC-QA-001](/specs/SPEC-QA-001.md)`
  / `[ADR-0014](/adr/0014-….md)`. Solo la primera por target por doc (una relación, sin saturar).
- **Zonas intocables:** frontmatter YAML, **code fences** (```` ``` ````), **inline code** (`` `…` ``), enlaces
  Markdown ya existentes `[..](..)`, y **auto-referencias** (un doc no se enlaza a sí mismo, p. ej. el propio
  SPEC-QA-001 mencionándose).
- **Resolución (RF-5):** si un ref **no** resuelve a un archivo existente → **no** lo enlaces, **déjalo en
  prosa** y **repórtalo** como warning (no rompas el build).
- **Idempotente:** re-ejecutar no duplica enlaces ni anida `[[..](..)](..)`.
- **Modo `--check`** (opcional, **warning-only**): lista refs resolubles aún sin enlazar; **no** falla (exit 0).
  No lo conviertas en gate duro (evita fricción; el gate duro sigue siendo `trace`/`okf:check`).

Tests etiquetados `[SPEC-DOCS-OKF-001/RF-5]` con fixtures: `SPEC-X` en prosa → enlace; dentro de code fence →
intacto; ya enlazado → intacto; auto-ref → intacto; ref que no resuelve → queda en prosa + warning; segunda
ejecución → sin cambios (idempotencia). En rojo antes de correr el codemod.

### 2. Verde — correr el codemod sobre `docs/`

Ejecuta `pnpm okf:link` sobre `docs/**/*.md`. Revisa el **diff** con cuidado (es amplio): confirma que solo se
insertaron enlaces en prosa, que ningún ejemplo/código quedó tocado, y que todos los enlaces resuelven.

- **No** toques `docs/traceability.md` (lo genera `pnpm trace`; queda como matriz-gate).
- **No** reescribas headings ni el contenido; solo se envuelven refs en `[..](..)`.

## Reglas

- **Aditivo y seguro:** solo se añaden enlaces en prosa. Cero cambios de código de app. RNF de OKF: conformidad
  permisiva (un enlace roto sería warning, pero aquí no debe haber ninguno — el codemod solo enlaza lo que
  resuelve).
- **`pnpm trace` sigue verde** (la matriz no se toca) y **`pnpm okf:check`** no reporta enlaces rotos nuevos
  (RF-5).
- Regenera `pnpm okf:index` (las `description` no cambian → los índices deberían quedar iguales; confírmalo).

## Verificación antes de "listo"

```
pnpm okf:link              # codemod idempotente; 2ª corrida sin cambios
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check && pnpm okf:check && pnpm okf:index -- --check
```

- Tests del codemod verdes; `trace`/`okf:check`/`okf:index --check` verdes; sin enlaces rotos.
- Reporta: nº de refs enlazadas, nº de refs dejadas en prosa por no resolver (con cuáles), y confirma
  idempotencia.

## Git (ciclo de vida — AGENTS.md §4)

Rama `feat/okf-phase3-crosslinks` **desde `develop`**; Conventional Commit (`docs`, scope `okf`), incluye `docs/`
y el script/tests. `pnpm exec prettier --write .` (solo tooling; **cuidado** de no romper frontmatter ni los
enlaces recién puestos). Al terminar y verde: **merge a `develop` y borra la rama**.

## Entregable

`pnpm okf:link` (con tests) — codemod idempotente y seguro; `docs/` con las referencias en prosa convertidas en
enlaces bundle-relativos que resuelven; `traceability.md` + `pnpm trace` intactos como gate; índices OKF
coherentes. Reporta archivos tocados, refs enlazadas vs. dejadas en prosa, y cualquier warning. Fase 4 (`log.md`
+ visualizador) y Fase 5 (cross-proyecto) quedan para prompts siguientes.
