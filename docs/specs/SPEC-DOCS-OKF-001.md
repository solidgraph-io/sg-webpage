---
type: Spec
title: "SPEC-DOCS-OKF-001 — `docs/` como Knowledge Bundle OKF conformante"
description: "Que docs/ sea un bundle OKF conformante y verificado en CI, sin romper nada, honrando el modelo de consumo permisivo de OKF (duro solo en lo mínimo; el resto, advertencia)."
tags: [docs, okf]
timestamp: 2026-07-10T21:23:58.667Z
---

# SPEC-DOCS-OKF-001 — `docs/` como Knowledge Bundle OKF conformante

- **ID:** SPEC-DOCS-OKF-001
- **Estado:** Implemented <!-- Draft → Review → Approved → Implemented → Verified -->
- **Épica / Story:** EPIC-DOCS / STORY-OKF
- **Capa atómica:** — (documentación / tooling, no UI)
- **Depende de:** ADR-0015 (adopción de OKF)

## Contexto / problema

ADR-0015 decide adoptar **Open Knowledge Format (OKF) v0.1** (Google Cloud) para el corpus de conocimiento
del repo. Hoy `docs/` es Markdown ad-hoc: sin frontmatter tipado, sin índices de *progressive disclosure*, con
trazabilidad en una matriz aparte y referencias en prosa. Esta spec fija **las reglas de conformidad de
nuestro bundle** y define el chequeo automatizable que las hace cumplir. No cambia código de la app.

Referencia normativa: [OKF SPEC v0.1](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
(§4 frontmatter, §5 links, §6 index, §7 log, §9 conformidad permisiva).

## Objetivo

Que `docs/` sea un **bundle OKF conformante y verificado en CI**, sin romper nada, honrando el modelo de
consumo permisivo de OKF (duro solo en lo mínimo; el resto, advertencia).

## Requisitos funcionales (testeables)

- **RF-1** — La raíz del bundle es `docs/`. Existe `docs/index.md` con frontmatter que declara
  `okf_version: "0.1"` (único `index.md` con frontmatter permitido, per §11).
- **RF-2** — Todo `.md` **no reservado** bajo `docs/` (es decir, distinto de `index.md`/`log.md`) contiene un
  bloque de frontmatter YAML **parseable** delimitado por `---`.
- **RF-3** — Cada frontmatter de concepto tiene un campo **`type`** presente y **no vacío** (§4.1, único
  requerido).
- **RF-4** — `type` pertenece a la **taxonomía del proyecto**: `Spec | ADR | Prompt | Architecture |
  Methodology | Plan | Runbook | Index | Reference`. Un valor fuera de la lista es **warning**, no error
  (consumo permisivo, §9).
- **RF-5** — Los enlaces **bundle-relativos** (que empiezan por `/` y terminan en `.md`) que apuntan dentro
  de `docs/` deben resolver a un archivo existente; un enlace roto es **warning**, no error (§5.3).
- **RF-6** — `pnpm okf:check` recorre `docs/`, reporta warnings y **falla (exit ≠ 0) solo** ante violaciones
  **duras**: RF-1 (falta `okf_version` en index raíz), RF-2 (frontmatter no parseable) o RF-3 (`type`
  ausente/vacío).
- **RF-7** — `pnpm okf:check` corre en CI junto a `pnpm trace` (no bloquea el build de la app; es su propio
  step). **Es el mecanismo que hace que OKF se aplique siempre**: ningún doc no conformante llega a `develop`.
- **RF-8** — Cada **subdirectorio no vacío** bajo `docs/` (`specs/`, `adr/`, `prompts/`, `deploy/`) **debería**
  tener su `index.md` de *progressive disclosure* (§6). Su ausencia es **warning**, no error (recomendado, no
  requerido por §9). El índice raíz enlaza a los índices de subdirectorio.

## Requisitos no funcionales

- **RNF-1 (no intrusivo)** — La migración es **aditiva**: no cambia el body de los docs salvo para añadir
  frontmatter y (fases posteriores) convertir referencias en enlaces. Los `.md` siguen siendo válidos si se
  abandona OKF.
- **RNF-2 (perf/deps)** — El checker es Node/TS con dependencias mínimas (parser YAML ya presente en el repo,
  p. ej. `yaml`); corre en < 2 s sobre `docs/`.
- **RNF-3 (permisividad OKF)** — El consumidor **no** rechaza el bundle por campos opcionales ausentes,
  `type` desconocido, claves extra, enlaces rotos o `index.md` faltantes (§9). Solo lo mínimo es duro.

## Invariantes

- **INV-1 (conformidad dura mínima)** — Frontmatter parseable + `type` no vacío en cada concepto + `okf_version`
  en el index raíz. Violarlo rompe `okf:check`.
- **INV-2 (reservados)** — `index.md` y `log.md` nunca son documentos de concepto; `index.md` no lleva
  frontmatter salvo el raíz (solo `okf_version`); `log.md` usa fechas ISO `YYYY-MM-DD` (§6, §7).
- **INV-3 (IDs estables)** — El *Concept ID* es la ruta sin `.md`; renombrar/mover un doc cambia su ID y
  **debe** actualizar los enlaces entrantes (lo detecta RF-5 como warning).

## Modelo de datos (frontmatter — contrato mínimo)

```yaml
---
type: <Spec|ADR|Prompt|Architecture|Methodology|Plan|Runbook|Index|Reference>  # REQUERIDO
title: <nombre legible>            # recomendado
description: <resumen en una línea> # recomendado (alimenta index.md)
tags: [<tag>, …]                   # opcional
timestamp: <ISO 8601>              # opcional (último cambio significativo)
# claves extra permitidas (p. ej. spec_status, epic) — se preservan
---
```

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: bundle conformante
  Given docs/index.md declara okf_version "0.1"
    And todo .md no reservado tiene frontmatter con type no vacío
  When se ejecuta `pnpm okf:check`
  Then termina con exit 0

Scenario: falta type (violación dura)
  Given un docs/specs/SPEC-X.md sin campo type
  When se ejecuta `pnpm okf:check`
  Then reporta el archivo y termina con exit ≠ 0

Scenario: enlace roto (permisivo)
  Given un concepto enlaza /specs/NO-EXISTE.md
  When se ejecuta `pnpm okf:check`
  Then lo reporta como warning y termina con exit 0
```

## Fuera de alcance

- La generación de `index.md`/`log.md` (Fases 2 y 4 del ADR-0015) y la conversión masiva de referencias a
  enlaces (Fase 3) — esta spec solo fija las **reglas** y el **checker**; cada fase trae su propio prompt.
- Replicar el bundle a Guani / agency-structure (Fase 5).
- El visualizador OKF (opcional, Fase 4).

## Trazabilidad

- **Tests:** cada RF con su `it('[SPEC-DOCS-OKF-001/RF-x] …')` en el suite del checker
  (frontmatter parseable, `type` presente/en taxonomía, index raíz con `okf_version`, enlaces resueltos, exit codes).
- **PRs:** <#…> · **ADR:** docs/adr/0015-adopt-open-knowledge-format-okf.md
