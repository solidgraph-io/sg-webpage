# SPEC-<DOMINIO>-<NNN> — <título>

- **ID:** SPEC-<DOMINIO>-<NNN> <!-- estable, nunca se reutiliza ni renumera -->
- **Estado:** Draft <!-- Draft → Review → Approved → Implemented → Verified -->
- **Épica / Story:** EPIC-XX / STORY-XXX
- **Capa atómica:** atom | molecule | organism(block) | template | page
- **`type` (si es organismo/bloque):** <hero | pricing | ...>
- **Depende de:** <SPEC-… o —>

## Contexto / problema

Por qué existe. Zona del diseño de referencia (`design/`) y enlace a `docs/01`.

## Objetivo

Qué debe lograr, en una frase.

## Requisitos funcionales (testeables)

- **RF-1** — …
- **RF-2** — …

## Requisitos no funcionales

- **RNF-1 (a11y)** — WCAG 2.1 AA: contraste, foco, roles, alt, tabulación.
- **RNF-2 (perf)** — sin JS salvo island <X>; imágenes vía `astro:assets`; dentro del presupuesto.
- **RNF-3 (SEO)** — jerarquía de headings; metadatos vía `lib/seo.ts`.
- **RNF-4 (responsive)** — móvil-first; breakpoints <…>.

## Invariantes

- **INV-1** — contenido que no cumple el schema Zod rompe el build (fail-fast).
- **INV-2** — sin copy/colores hardcodeados (props + tokens).
- **INV-3 (SRP)** — el componente tiene una sola responsabilidad y ≤ ~150 líneas; piezas repetidas se extraen a átomos/moléculas.

## Modelo de datos (contrato Zod — solo organismos/bloques)

```ts
// packages/blocks-contract
z.object({ type: z.literal('<type>') /* campos */ });
```

## Descomposición atómica (para moléculas/organismos)

- Átomos usados: <…>
- Moléculas usadas: <…>
- Nuevos a crear: <…>

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: <nombre>
  Given <contenido válido>
  When se renderiza
  Then <resultado observable>
```

## Fuera de alcance

- <lo que NO cubre esta spec>

## Trazabilidad

- **Tests:** <cada RF/RNF/INV con su `it('[SPEC-…/RF-x] …')`>
- **PRs:** <#…> · **ADR:** <docs/adr/… si aplica>
