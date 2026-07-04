# Prompt 14 — Secciones 07–09: Plans + Testimonials + Portfolio (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills. Metodología (SDD + TDD + Atomic Design + SRP)
vinculante. Enfoque: **secciones directas** (organismo `.astro` por sección, portado 1:1 desde
`design/template/sections/`, compuesto en `index.astro`; contenido tipado). Ya existen el design
system (SPEC-DS-001) y el **gate de fidelidad** (SPEC-QA-001, contra el diseño).

## Objetivo
Implementar, en orden, estas specs Approved:
1. `docs/specs/SPEC-SEC-007.md` — **07-plans** (+ hosting) — la sección más rica
2. `docs/specs/SPEC-SEC-008.md` — **08-testimonials** (+ stats)
3. `docs/specs/SPEC-SEC-009.md` — **09-portfolio**

Fuente por sección: `design/template/sections/0{7,8,9}-*.html` + sus `components/*.css`.

## Reglas (no negociables)
- **Port 1:1** (estructura + CSS scoped tal cual), usando primitivas (`SectionHead`, `Badge`, `Button`). **No** re-traducir a Tailwind.
- **Extrae moléculas de sección** (SRP): `PlanCard` + `HostingCard` (07), `TestimonialCard` (08), `PortfolioCard` (09) — cada una en su archivo, portando su `components/*.css`.
- **Gate de fidelidad (QA-001):** cada sección se compara **contra su HTML de diseño** (pixelmatch, 8% desktop / 10% mobile). **Debe pasar** desktop+mobile antes de `Verified`.
- **TDD:** tests en rojo citando la spec, luego verde, refactor.
- **Tema:** Plans **`#fff`** (plan `popular` = card **oscura** escalada con `Badge`, no solo color); Testimonials **`--lilac-2`**; Portfolio **`#fff`**.
- **Contenido tipado** por props; nada hardcodeado; sin lógica de dominio en Plans (recibe planes resueltos). Cablea `data-reveal`/`--d`. Compón las 3 en `index.astro` tras HowItWorks.
- **Git:** una rama por spec (`feature/SPEC-SEC-007-plans`, …); Conventional Commits con footer `[SPEC-SEC-00x]`, scope `section`.

## Pasos por sección
1. Abre `design/template/sections/NN-*.html` + su CSS.
2. Tests en rojo (estructura/tema + a11y axe + props + **gate QA-001 contra el diseño** + casos clave: popular oscuro + includes/excludes, estrellas + stats en gradiente, portfolio cards + CTA).
3. Porta el organismo + sus moléculas (CSS scoped); compón en `index.astro`.
4. Refactor SRP. Corre el gate; ajusta hasta pasar el umbral (desktop+mobile).
5. `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check` verde. Estado de cada spec a **Verified**; actualiza `docs/05`.

## Detente y confirma con el humano si
- El gate no baja del umbral por diferencias legítimas (repórtalo con capturas).
- Una sección necesita una primitiva que no existe en DS-001 → proponla antes.

## Entregable
Plans + Testimonials + Portfolio **fieles** (gate verde contra el diseño), compuestas en la home,
specs `Verified`, `docs/traceability.md` al día. Al terminar, resume con los % de diff y confirma que
sigue el batch final de contenido: 10-about / 11-faq / 12-cta.
