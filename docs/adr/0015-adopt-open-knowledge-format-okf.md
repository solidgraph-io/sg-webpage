---
type: ADR
title: "ADR-0015 — Adoptar Open Knowledge Format (OKF) para representar el conocimiento de arquitectura/metodología"
description: "Adoptar OKF v0.1 como el formato estándar del corpus de conocimiento del proyecto: convertir docs/ en un Knowledge Bundle OKF conformante, empezando por sg-webpage como piloto y l…"
tags: [adr, okf]
timestamp: 2026-07-10T21:23:58.467Z
---

# ADR-0015 — Adoptar Open Knowledge Format (OKF) para representar el conocimiento de arquitectura/metodología

- **Estado:** Accepted (2026-07)
- **Contexto:** Metodología / documentación / conocimiento para agentes
- **Relacionado:** `AGENTS.md`, `docs/04-engineering-methodology.md`, `docs/05-implementation-plan.md`,
  `docs/traceability.md`, todos los `SPEC-*`, `ADR-0012..0014`, `../agency-structure/Agency Structure/ARQUITECTURA.md`

## Contexto

### Qué es OKF

**Open Knowledge Format (OKF)** es una especificación abierta y neutral de proveedor publicada por
**Google Cloud** (v0.1 draft, 12-jun-2026). Formaliza el patrón "LLM-wiki": representar *conocimiento*
(metadatos, contexto, insight curado) como **un directorio de archivos Markdown con frontmatter YAML**,
pensado para ser **escrito por humanos, generado por agentes y consumido por ambos**.

Reglas mínimas (de la spec oficial):

- **Bundle** = árbol de directorios de `.md`. Unidad de distribución (recomendado: un repo git).
- **Concept** = un `.md` = una unidad de conocimiento (una tabla, una API, una métrica, un runbook, una
  política, una decisión…). Su **Concept ID** es la ruta sin `.md`.
- **Frontmatter YAML**: único campo **REQUERIDO** = `type` (string libre, no hay registro central).
  Recomendados: `title`, `description`, `resource`, `tags`, `timestamp`. Se permiten claves extra.
- **Body** Markdown. Encabezados convencionales: `# Schema`, `# Examples`, `# Citations`.
- **Cross-links**: enlaces Markdown normales entre conceptos (preferente: absolutos al bundle, `/specs/x.md`).
  Un enlace = una relación (dirigida, sin tipar); el tipo lo da la prosa.
- **Archivos reservados**: `index.md` (listado del directorio → *progressive disclosure*) y `log.md`
  (historial cronológico de cambios). Versión del bundle vía `okf_version: "0.1"` en el `index.md` raíz.
- **Conformidad permisiva**: un consumidor **no** debe rechazar un bundle por campos opcionales ausentes,
  `type` desconocido, claves extra, enlaces rotos o `index.md` faltantes.

Google publicó además herramientas open-source: un *enrichment agent* (genera OKF desde BigQuery) y un
**visualizador estático** que renderiza una carpeta OKF como **grafo HTML interactivo**.

### Por qué nos importa

Nuestra metodología ya es, de facto, "conocimiento como código": `docs/specs`, `docs/adr`, `docs/prompts`,
`docs/04/05`, `docs/traceability.md`, `AGENTS.md`/`CLAUDE.md`, memoria — todo Markdown, versionado, con un
split **arquitecto (cura specs/ADRs/prompts) → implementador (Claude Code escribe código+tests)** y consumo
**multi-agente** (Claude, Claude Code, Codex, Gemini). Eso es exactamente el patrón que OKF estandariza,
pero hoy lo hacemos **ad-hoc**: sin frontmatter tipado, sin índices de disclosure, con trazabilidad en una
matriz aparte y referencias en prosa ("SPEC-QA-001") en vez de enlaces navegables.

## Decisión

Adoptar **OKF v0.1 como el formato estándar del corpus de conocimiento** del proyecto: convertir `docs/` en
un **Knowledge Bundle OKF conformante**, empezando por **sg-webpage** como piloto y luego replicando a Guani
y a `agency-structure` (metodología compartida). La adopción es **aditiva y no rompe nada** (OKF es Markdown
permisivo); no cambia código de la app.

## Justificación (utilidad para nuestra metodología)

1. **Un solo grafo de contexto para todos los agentes.** En vez de que cada agente (Claude/Code/Codex/Gemini)
   re-derive la arquitectura, navegan **un mismo grafo curado y tipado**. El handoff arquitecto→implementador
   se vuelve: *el arquitecto cura el bundle; Claude Code consume conceptos tipados + enlaces*. Neutral de
   proveedor y sin SDK = calza con `AGENTS.md` (estándar abierto compartido).
2. **Trazabilidad nativa.** La relación spec↔test↔prompt↔ADR deja de vivir en `traceability.md` como matriz
   paralela y pasa a **cross-links** entre conceptos (`/specs/SPEC-QA-001.md` ↔ `/adr/0014-...md`). El grafo
   *es* la trazabilidad; se puede generar la vista, no mantenerla a mano.
3. **Progressive disclosure = menos desperdicio de contexto.** Los `index.md` por carpeta permiten que un
   agente vea el **catálogo** (títulos + `description`) antes de abrir documentos, y drill-down solo en lo
   relevante → mejor retrieval, menos tokens.
4. **Curar conocimiento = ingeniería normal.** Al ser git-native, el conocimiento se revisa con PRs, diffs y
   blame — justo el flujo SDD+TDD que ya usamos (rama por spec, commit que cita la spec).
5. **Tipado + convención sin rigidez.** `type` enruta y filtra (Spec/ADR/Prompt/Runbook…); pero la
   conformidad permisiva significa que **nada se rompe** mientras migramos incrementalmente.
6. **Visualización "gratis".** El visualizador OKF nos da un **mapa navegable** de toda la arquitectura y la
   metodología sin construir tooling propio.

## Consecuencias

- **Costo inicial acotado y reversible.** Añadir frontmatter + `index.md`/`log.md` + convertir referencias a
  enlaces. Como OKF es aditivo, si abandonáramos, los `.md` siguen siendo válidos.
- **Hay que acordar la taxonomía de `type`** (abajo) — es la única decisión "de diseño".
- **v0.1 es draft**: fijamos `okf_version: "0.1"` y asumimos evolución menor (campos/headings nuevos, backward-compatible).
- **Nuevo gate opcional**: un chequeo de conformidad OKF en CI (junto a `pnpm trace`) para que el bundle no
  degrade. Bajo riesgo, alto valor.
- Se creará `SPEC-DOCS-OKF-001` (reglas de conformidad de *nuestro* bundle) y prompts de migración; se
  actualizarán `AGENTS.md`/`CLAUDE.md` para apuntar al `index.md` raíz como puerta de entrada.

### Taxonomía inicial de `type` (nuestro bundle)

| Documento actual | `type` OKF |
| --- | --- |
| `docs/specs/SPEC-*.md` | `Spec` |
| `docs/adr/00XX-*.md` | `ADR` |
| `docs/prompts/NN-*.md` | `Prompt` |
| `docs/01-architecture-and-stack.md` | `Architecture` |
| `docs/04-engineering-methodology.md` | `Methodology` |
| `docs/05-implementation-plan.md` | `Plan` |
| `docs/deploy/*.md` | `Runbook` |
| `docs/traceability.md` | `Index` (o se reemplaza por `index.md` generado) |

## Plan de implementación (fasado — piloto en sg-webpage)

> Cada fase = un prompt para Claude Code (docs-only salvo la Fase 4, que añade un script/CI). No toca código
> de la app. Validación transversal: conformidad OKF (todo `.md` no-reservado con frontmatter parseable +
> `type` no vacío), enlaces que resuelven (soft), y `pnpm lint`/`trace` en verde.

- **Fase 0 — Decisión + spec.** Aceptar este ADR. Escribir `SPEC-DOCS-OKF-001`: layout del bundle
  (`docs/` = raíz), taxonomía de `type`, estilo de enlaces (absolutos al bundle), reglas de conformidad y el
  futuro `pnpm okf:check`. *(no rompe nada)*

- **Fase 1 — Frontmatter + tipos (no destructivo).** Añadir frontmatter (`type`, `title`, `description`,
  `tags`, `timestamp`) a todos los `docs/**/*.md`. Crear `docs/index.md` raíz con `okf_version: "0.1"`.
  Los ADRs ya traen cabecera `Estado/Contexto/Relacionado` → se mapea a frontmatter + body.

- **Fase 2 — Índices (progressive disclosure).** Generar `index.md` en `docs/`, `docs/specs/`, `docs/adr/`,
  `docs/prompts/` a partir de las `description` del frontmatter (auto-generable; regenerable en CI).

- **Fase 3 — Cross-links + trazabilidad.** Convertir referencias en prosa (SPEC-XXX, ADR-XXX) en enlaces
  bundle-relativos. Plegar `traceability.md` en enlaces + una vista generada (el grafo pasa a ser la matriz).

- **Fase 4 — Log + tooling.** Añadir `log.md` raíz (historial de decisiones). Cablear `pnpm okf:check`
  (valida frontmatter/`type` y enlaces) en el CI junto a `pnpm trace`. Opcional: integrar el visualizador
  OKF para publicar el grafo del bundle.

- **Fase 5 — Cross-proyecto.** Probado en sg-webpage, replicar el patrón a Guani y a `agency-structure`
  (metodología compartida), y apuntar `AGENTS.md`/`CLAUDE.md` de cada repo al `index.md` raíz de su bundle.

## Citations

[1] [OKF SPEC v0.1 — GoogleCloudPlatform/knowledge-catalog](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
[2] [Google Cloud Introduces Open Knowledge Format (OKF) — MarkTechPost](https://www.marktechpost.com/2026/06/16/google-cloud-introduces-open-knowledge-format-okf-a-vendor-neutral-markdown-spec-for-giving-ai-agents-curated-context/)
[3] [OKF: Redefining Knowledge Bases for AI Agents — Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/07/open-knowledge-format-okf/)
