# Prompt 13 — Secciones 04–06: PainPoints + Value + HowItWorks (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills. Metodología (SDD + TDD + Atomic Design + SRP)
vinculante. Enfoque: **secciones directas** (organismo `.astro` por sección, portado 1:1 desde
`design/template/sections/`, compuesto en `index.astro`; contenido en datos tipados). Ya existen el
design system (SPEC-DS-001) y el **gate de fidelidad** (SPEC-QA-001, contra el diseño).

## Objetivo

Implementar, en orden, estas specs Approved:

1. `docs/specs/SPEC-SEC-004.md` — **04-pain-points** (bento, claro)
2. `docs/specs/SPEC-SEC-005.md` — **05-value** (blanco, pilares hover-fill)
3. `docs/specs/SPEC-SEC-006.md` — **06-how-it-works** (oscuro, sticky + duraciones)

Fuente por sección: `design/template/sections/0{4,5,6}-*.html` + sus `components/*.css`.

## Reglas (no negociables)

- **Port 1:1:** estructura y CSS de cada sección **tal cual** (scoped), usando primitivas (`IconBox`, `Eyebrow`, `SectionHead`, `Aurora`, `Button`). No re-traducir a Tailwind ni "interpretar".
- **Gate de fidelidad (QA-001):** cada sección se compara **contra su HTML de diseño** (pixelmatch, umbral 8% desktop / 10% mobile). **Debe pasar** en desktop y mobile antes de `Verified`.
- **TDD:** tests en rojo citando la spec (`it('[SPEC-SEC-004/RF-1] bento renders light with dark feature card')`), luego verde, refactor.
- **Tema correcto (ojo con la inversión):** PainPoints y Value **claros** (`--lilac-2` / `#fff`); HowItWorks **oscuro** (`--night`). Es el error más común — verifícalo con el gate.
- **Contenido tipado** (props por sección); nada hardcodeado. Cablea `data-reveal`/`--d` (movimiento vía `interactions.js`). Compón las 3 en `index.astro` tras Marquee.
- **SRP:** una sección = un archivo ≤ ~150 líneas; extrae `BentoCard`/`Pillar`/`Step` a componente propio si crece.
- **Git:** una rama por spec (`feature/SPEC-SEC-004-pain-points`, …); Conventional Commits con footer `[SPEC-SEC-00x]`, scope `section`.

## Pasos por sección

1. Abre `design/template/sections/NN-*.html` + su CSS; entiende tema, estructura, hooks.
2. Tests en rojo (estructura/tema fieles + a11y axe + props + **gate QA-001 contra el diseño** + casos clave: bento con feature oscura, pilares hover-fill, HowItWorks sticky + duraciones).
3. Porta el organismo (CSS scoped) con las primitivas; compón en `index.astro`.
4. Refactor SRP. Corre el gate; ajusta hasta pasar el umbral (desktop+mobile).
5. `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check` verde. Estado de cada spec a **Verified**; actualiza `docs/05`.

## Detente y confirma con el humano si

- El gate no baja del umbral por diferencias legítimas diseño↔app (repórtalo con capturas).
- La sección necesita una primitiva que no existe en DS-001 → proponla antes.

## Entregable

PainPoints + Value + HowItWorks **fieles** (gate verde contra el diseño, desktop+mobile), compuestas
en la home, specs `Verified`, `docs/traceability.md` al día. Al terminar, resume con los % de diff y
confirma que sigue el batch 07-plans / 08-testimonials / 09-portfolio.
