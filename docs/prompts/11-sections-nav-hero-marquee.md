# Prompt 11 — Secciones 01–03: Nav + Hero + Marquee (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills. Metodología (SDD + TDD + Atomic Design + SRP)
vinculante. Enfoque: **secciones directas** (organismo `.astro` por sección, portado 1:1 desde
`design/template/sections/`, compuesto en `index.astro`; contenido en datos tipados). El
design-system y las primitivas ya existen (SPEC-DS-001, Implemented).

## Objetivo

Implementar, en orden, estas specs Approved (una por sección):

1. `docs/specs/SPEC-SEC-001.md` — **01-nav**
2. `docs/specs/SPEC-SEC-002.md` — **02-hero**
3. `docs/specs/SPEC-SEC-003.md` — **03-marquee**

Fuente de verdad por sección: `design/template/sections/0{1,2,3}-*.html` + sus `components/*.css`.

## Reglas (no negociables)

- **Port 1:1:** copia estructura y CSS de cada sección **tal cual** (CSS scoped en el `.astro`), usando las primitivas compartidas (`Button`, `Eyebrow`, `Pill`, `Logo`, `IconBox`, `Aurora`, `FloatingCard`). No re-traduzcas a Tailwind ni "interpretes" el diseño.
- **TDD:** por cada `RF/RNF/INV`, test en **rojo** citando la spec (`it('[SPEC-SEC-002/RF-2] hero renders 3D preview panel')`), luego verde, luego refactor.
- **Regresión visual (gate de fidelidad):** Playwright compara cada sección renderizada contra su `NN-*.html`. Debe coincidir.
- **Contenido tipado:** props por sección (según la spec); nada de copy/colores hardcodeados.
- **Animación:** cablea `data-reveal`/`--d`/`.magnetic` como la fuente; el movimiento lo da `interactions.js` (global). Sin JS por sección.
- **Composición en `index.astro`:** añade Nav → Hero → Marquee en orden dentro de `BaseLayout` (el resto de secciones llegan luego).
- **SRP:** una sección = un archivo ≤ ~150 líneas; extrae sub-piezas (preview panel, floating card del hero) a componentes propios si crece.
- **Git:** una rama por spec (`feature/SPEC-SEC-001-nav`, …); Conventional Commits con footer `[SPEC-SEC-00x]`, scope `section`.

## Pasos por sección

1. Abre `design/template/sections/NN-*.html` y su CSS; entiende estructura, tema, hooks de animación.
2. Tests en rojo (estructura/tema fieles + a11y axe + contenido por props + **regresión visual** contra el HTML + casos clave: Nav píldora clara + menú `<details>`, Hero un solo `<h1>` + preview 3D, Marquee loop + pausa/reduced-motion).
3. Porta el organismo (CSS scoped) usando las primitivas; compón en `index.astro`.
4. Refactor SRP.
5. `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` verde. Actualiza Trazabilidad + Estado (`Implemented`) de cada spec y `docs/05`.

## Detente y confirma con el humano si

- La sección necesita una primitiva/utilidad que no existe en DS-001 → proponla antes (no la improvises inconsistente).
- El diseño pide una interacción no cubierta por `interactions.js` → proponla antes de añadir JS nuevo.

## Entregable

Nav + Hero + Marquee **fieles** a su HTML (regresión visual verde), compuestas en la home, specs
`Implemented`, `docs/traceability.md` al día. Al terminar, resume con capturas/di— si puedes — y
confirma que sigue el siguiente batch (04-pain-points, 05-value, 06-how-it-works).
