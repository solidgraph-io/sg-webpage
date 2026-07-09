# ADR-0014 — El gate de fidelidad contra el diseño es el único gate de regresión visual

- **Estado:** Accepted (2026-07)
- **Contexto:** QA / testing visual
- **Relacionado:** SPEC-QA-001 (gate de fidelidad), SPEC-SEC-001..014 (RNF de anti-regresión), ADR-0012

## Contexto

El repo mantenía **dos** chequeos visuales por sección:

1. **Gate de fidelidad** (`compareWithDesign`, pixelmatch vs el HTML del **diseño**, tolerancia ~8/10%) —
   el juez real de SPEC-QA-001.
2. **Anti-regresión self-baseline** (`toHaveScreenshot('x.png')`, casi pixel-exacto vs un PNG commiteado
   de la propia implementación) — `RNF-3/RNF-4` de cada `SPEC-SEC-*`.

Los self-baselines son **dependientes del entorno**: se regeneraron en local (WSL) pero el CI corre en
`mcr.microsoft.com/playwright:v1.61.1-noble`, y el redondeo sub-pixel del layout difiere **1px** entre
entornos (unas secciones 1px más altas, otras 1px más bajas → ~8-9% de píxeles distintos → fallan). Han
roto el CI ~3 veces (stale tras el refactor component-as-folder; luego drift de entorno). Solo serían
fiables si se **regeneran dentro del mismo contenedor** que los corre — para siempre, en cada bump de
Playwright/OS.

## Decisión

**Se eliminan los self-baselines `toHaveScreenshot` (RNF-3/RNF-4) del CI.** El **gate de fidelidad contra
el diseño** (`compareWithDesign`) queda como **único gate de regresión visual**. Se conservan los tests
**de comportamiento** (conteo de items, estado por defecto, no dev-toolbar, logo no roto…), **a11y** y **perf**.

## Justificación

- Es exactamente la lección fundacional de SPEC-QA-001: **el diseño es el juez, no un self-baseline**
  (un self-baseline "pasa en verde estando mal"; aquí además "falla en rojo estando bien").
- Los self-baselines **duplican** lo que el gate del diseño ya cubre, pero con mucha más fragilidad: ni
  siquiera sobreviven varianza sub-pixel de entorno.
- Menos tests Playwright → CI más rápido y estable; elimina una clase recurrente de fallos.

## Consecuencias

- **Trade-off aceptado:** se pierde la detección de drift *commit-a-commit dentro* de la tolerancia del
  diseño. Se considera de bajo valor frente a la fragilidad; el gate del diseño (8/10%) sigue atrapando
  cualquier desviación real del target.
- **Reversible:** si algún día se quiere el segundo gate, se regeneran las baselines **dentro del
  contenedor de CI** + tolerancia (`maxDiffPixelRatio`) — pero no es el default.
- Se actualizan SPEC-QA-001 (gate único) y los `RNF` de anti-regresión de cada `SPEC-SEC-*`.
