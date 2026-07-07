# Prompt 07 — Corrección de fidelidad: sistema de diseño v2 + contrato v2 (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills `.claude/skills/`. Metodología (SDD + TDD +
Atomic Design + SRP) vinculante.

## Contexto crítico

M0 se construyó desde un _bundle_ mal leído y **diverge del diseño real**. La **fuente de verdad**
es ahora **`design/SolidGraph Website.html`** (HTML real con CSS **y JS** — ábrelo y estúdialo a
fondo: tokens, tema claro con secciones oscuras, botones, animaciones, estructura y **copy** de
cada sección). Decisiones ya tomadas: **JS + CSS** (progressive enhancement, ya **no** "0 JS");
**fidelidad total** con contrato v2.

## Objetivo (incremento foundacional)

Implementar, en orden, estas specs Approved:

1. `docs/specs/SPEC-LAYOUT-002.md` — sistema de diseño v2 (tokens/tipografía/botones re-derivados del diseño) + **animaciones JS+CSS**: `lib/animations.ts` (IntersectionObserver reveal, magnetic, nav scrolled/hide), keyframes CSS (aurora/ping/bob/spin/marquee), progressive enhancement + `prefers-reduced-motion`.
2. `docs/specs/SPEC-BLOCK-100.md` — contrato v2: extender los schemas al Apéndice B, añadir **marquee/portfolio/contact** (16 tipos), y reescribir `content/pages/home.json` con **el contenido real** del diseño.

## Autorización

Esto **modifica el contrato de bloques** (antes congelado) y **re-deriva el sistema de diseño**
(revisa el styling de LAYOUT-001 y de los átomos de estilo). Queda autorizado por estas specs.
Los tipos nuevos/reshaped entran como `pending` en el registro (sus organismos se re-skinnean en
el siguiente incremento) — el test de consistencia debe seguir verde.

## Reglas (no negociables)

- **TDD:** por cada `RF/RNF/INV`, test en **rojo** citando la spec (`it('[SPEC-LAYOUT-002/RF-7] reveal is progressive enhancement')`), luego verde, luego refactor.
- **Progressive enhancement:** sin JS el sitio se ve **completo y usable** (nada oculto); el estado inicial de `[data-reveal]` solo con `.js`. Test que lo verifique.
- **Presupuesto de JS:** `lib/animations.ts` vanilla TS, **un solo módulo** cargado una vez (no islands por componente), ≤ ~5 KB gz, `defer`. React-sobre-Astro NO se introduce aquí (queda para interacción futura).
- **Fidelidad de valores:** toma tokens, tamaños, sombras, radios, easings y **copy** del HTML real; nada aproximado a ojo.
- **Datos como dato:** todo el copy de `home.json`; los schemas sin copy hardcodeado.
- **Git:** una rama por spec (`feature/SPEC-LAYOUT-002-design-system-v2`, `feature/SPEC-BLOCK-100-contract-v2`); Conventional Commits con footer `[SPEC-XXX]`.

## Pasos

1. Estudia `design/SolidGraph Website.html` (CSS + `<script>` + markup + copy).
2. **LAYOUT-002:** re-deriva `tokens.css`, tipografía (Poppins 400–900 self-hosted), globales, sistema `.btn` (re-skin del átomo Button a primary/white/ghost-light/outline), `Eyebrow`/`Badge`/`Icon`(sprite)/`PriceTag`/`Avatar`; `lib/animations.ts` + CSS de reveal/keyframes. Tests: tokens, no-CDN de fuentes, variantes de botón, reveal como enhancement, reduced-motion desactiva magnetic/nav, presupuesto JS, contraste claro/oscuro.
3. **BLOCK-100:** extiende schemas (Apéndice B) + marquee/portfolio/contact; actualiza la union y el registro (nuevos `pending`); reescribe `home.json` con el contenido real. Tests: parse v2, 16 tipos, consistencia, home real válida.
4. `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` en verde. Actualiza Trazabilidad + Estado (`Implemented`) de ambas specs y `docs/05`.

## Detente y confirma con el humano si

- El diseño exige un dato que no encaja en el Apéndice B → propón el ajuste de schema antes.
- El presupuesto de JS (~5 KB) no alcanza para las animaciones → coméntalo con el desglose.

## Entregable

Sistema de diseño v2 fiel + contrato v2 (16 tipos) + `home.json` real, todo verde. Los organismos
seguirán mostrando placeholders/estilo viejo hasta el re-skin — es esperado. Al terminar, resume y
confirma que sigue el **re-skin de organismos** (SPEC-BLOCK-101..106), grupo a grupo con regresión
visual contra el diseño real.
