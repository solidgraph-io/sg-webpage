---
description: Ejecuta la matriz de trazabilidad spec↔test y resume la cobertura. Uso: /trace
---

# /trace

1. `pnpm trace` (`scripts/trace.ts`): recorre `docs/specs/*`, extrae `RF/RNF/INV`, cruza con tests que citan `[SPEC-XXX/...]`, regenera `docs/traceability.md`.
2. `pnpm trace -- --check` (CI): **falla** si una spec `Approved` tiene un requisito sin test que lo cite.
3. Resume huecos y specs al 100%. No cierres una spec como Approved hasta cubrir todos sus requisitos con tests que la citen.
