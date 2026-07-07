---
name: spec-driven-development
description: >
  Metodología SDD + TDD + Atomic Design para sg-webpage (enfoque Guani). Úsala SIEMPRE que vayas
  a añadir o cambiar un átomo, molécula, organismo/bloque, página, schema de contenido o feature.
  Dispara con "nuevo bloque/átomo/molécula", "implementar hero/pricing/faq…", "spec de…",
  "vamos a construir X". La metodología canónica vive en AGENTS.md + docs/04 + .claude/commands/.
---

# Spec-Driven Development + TDD — enrutador

Fuente de verdad: **`AGENTS.md`** (importado por `CLAUDE.md`). Detalle: `docs/04-engineering-methodology.md`.
No dupliques reglas aquí.

En este repo:

1. **Lee `AGENTS.md`** (reglas duras, incluye Atomic Design + SRP) y `docs/01-architecture-and-stack.md`.
2. **¿Convertir diseño → componentes?** → usa la skill **`design-to-components`** (descomposición atómica bottom-up desde `design/`).
3. **¿Falta la spec?** → **`/new-spec <dominio> <título>`**: crea `docs/specs/SPEC-<DOMINIO>-<NNN>.md`, regístrala en `docs/05`, pide aprobación. Sin spec aprobada no hay código.
4. **Implementar** → **`/tdd <SPEC-ID>`**: schema Zod (si organismo) → tests en rojo `[SPEC-XXX/RF-y]` → verde mínimo con componentes pequeños (SRP) → refactor → DoD → commit citando la spec.
5. **Antes de PR** → **`/review-quality`** (Atomic/SRP, a11y AA, perf, SEO, contrato, diseño) y **`/trace`**.

Regla de oro: **spec → test (rojo) → código (verde) → refactor**; cada `RF-x` con ≥1 test que
cita la spec; componentes pequeños (una responsabilidad, ≤ ~150 líneas). Resto en `AGENTS.md`.
