---
description: Crea una spec desde la plantilla y la registra en el plan (docs/05). Uso: /new-spec <dominio> <título>
---

# /new-spec <dominio> <título>

Crea una nueva SPEC (SDD, `AGENTS.md` §1) y regístrala.

1. **ID.** Dominio en MAYÚSCULAS (`LAYOUT|ATOM|MOLECULE|BLOCK|CONTENT|CMS|FORM|SEO|A11Y|PERF|ANALYTICS|INFRA`). Busca el mayor `NNN` de ese dominio en `docs/specs/` y suma 1. ID **estable**.
2. **Crea `docs/specs/SPEC-<DOMINIO>-<NNN>.md`** desde `docs/specs/SPEC-TEMPLATE.md`. Rellena Contexto, `RF-x`, `RNF-x`, `INV-x` (incluye INV de SRP), contrato Zod (si es organismo), descomposición atómica (moléculas/organismos) y Gherkin. Estado: **Draft**.
3. **Registra en `docs/05-implementation-plan.md`** bajo su épica/story.
4. **Detente y pide aprobación** (Draft→Review→Approved) antes de tests o código.

Para maquetar desde el diseño, apóyate en la skill `design-to-components`. Luego `/tdd <SPEC-ID>`.
