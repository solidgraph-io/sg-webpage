# CLAUDE.md — Claude Code en sg-webpage (SolidGraph Website)

> Las reglas de desarrollo viven en **`AGENTS.md`** (estándar abierto, compartido con
> Codex/Gemini/Cursor). Este archivo no las duplica: las importa y añade lo específico de
> Claude Code. Enfoque heredado de **Guani** (SDD + TDD + épicas + trazabilidad).

@AGENTS.md

> **Producto y stack:** `docs/01-architecture-and-stack.md`. **Metodología:** `docs/04-engineering-methodology.md`.
> **Plan:** `docs/05-implementation-plan.md`. **Arquitectura de la fábrica:** `../agency-structure/Agency Structure/ARQUITECTURA.md`.
> **Diseño (ya definido):** export de Claude Design → colócalo en `design/`. Copia de referencia:
> `../agency-structure/Agency Structure/assets/SolidGraph Website (standalone).html`.
>
> **Rol de Claude:** arquitecto + implementador. Claude crea **épicas y specs** en `docs/`. v0.1.

## Específico de Claude Code

### Skills del proyecto (`.claude/skills/`)
- **`design-to-components`** — convierte el diseño (export de Claude Design) a componentes Astro con **Atomic Design + SRP** (componentes pequeños). Úsala para maquetar cualquier bloque/organismo.
- **`spec-driven-development`** — enruta al flujo SDD/TDD (AGENTS.md + comandos).

### Subagentes
- **Explore** — localizar átomos/moléculas/tokens existentes antes de crear (evita duplicar).
- **Plan** — diseñar la descomposición atómica de un organismo contra el contrato de bloques.
- **code-reviewer / general-purpose** — revisión independiente si el cambio toca el contrato de bloques o el layout global.

### Comandos (`.claude/commands/`)
- `/new-spec <dominio> <título>` — crea una spec desde la plantilla y la registra en `docs/05`.
- `/tdd <SPEC-ID>` — ciclo rojo→verde→refactor.
- `/trace` — matriz spec↔test (`pnpm trace`).
- `/review-quality` — checklist pre-PR (Atomic/SRP, a11y AA, perf, SEO, contenido, diseño).

### Flujo recomendado (convertir diseño → componente)
1. `/new-spec` para el átomo/molécula/organismo (o confirma spec Approved).
2. Skill **`design-to-components`** + subagente **Plan**: descomposición atómica bottom-up.
3. Schema Zod (si es organismo/bloque) → tests `[SPEC-XXX/RF-y]` (rojo) → implementa componentes pequeños (verde) → refactor con tokens.
4. `/review-quality` (+ regresión visual vs. `design/`) y `/trace`.
5. PR con rama y commit que citan la spec.

### Recordatorios para Claude
- Antes de tocar el **contrato de bloques**, relee `../agency-structure/Agency Structure/ARQUITECTURA.md` §3 y confirma.
- Antes de tocar **CI/CD, registry o deploy de producción**, confirma con el humano.
- **Nada de componentes gigantes** (SRP, ≤ ~150 líneas). Sin secretos en el repo.

## Verificación rápida antes de decir "listo"
```
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check
```
