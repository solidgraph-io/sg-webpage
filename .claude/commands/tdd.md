---
description: Guía el ciclo TDD rojo→verde→refactor para una spec aprobada. Uso: /tdd <SPEC-ID>
---

# /tdd <SPEC-ID>

Precondición: spec **Approved**. Ciclo (`AGENTS.md` §2–§3):

1. **Contrato Zod** (si es organismo/bloque): variante en `packages/blocks-contract`. Fuente de verdad.
2. **Rojo.** Tests que fallan, uno por `RF-x`/`RNF-x`/`INV-x`, citando la spec:
   - `it('[<SPEC-ID>/RF-1] ...')` render (`astro/container`); contrato (props inválidas fallan); a11y (axe AA); e2e/visual (Playwright) si aplica.
3. **Verde.** Implementa el **mínimo**. **Atomic Design + SRP:** reutiliza átomos/moléculas; crea solo lo nuevo; ningún componente > ~150 líneas ni con >1 responsabilidad. Sin copy/colores hardcodeados.
4. **Refactor.** Extrae piezas repetidas a átomos/moléculas; aplica tokens. Tests siguen verdes.
5. **Cierre.** DoD → actualiza Estado + Trazabilidad de la spec → commit `feat(block): … [<SPEC-ID>]`.

Verificación final: `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check`.
