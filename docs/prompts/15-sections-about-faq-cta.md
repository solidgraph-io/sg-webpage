---
type: Prompt
title: "Prompt 15 — Secciones 10–12: About + FAQ + CTA (para Claude Code)"
description: "Implementar, en orden, estas specs Approved:"
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 15 — Secciones 10–12: About + FAQ + CTA (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills. Metodología (SDD + TDD + Atomic Design + SRP)
vinculante. Enfoque: **secciones directas** (organismo `.astro` por sección, portado 1:1 desde
`design/template/sections/`, compuesto en `index.astro`; contenido tipado). Ya existen el design
system (SPEC-DS-001) y el **gate de fidelidad** (SPEC-QA-001, contra el diseño).

## Objetivo

Implementar, en orden, estas specs Approved:

1. `docs/specs/SPEC-SEC-010.md` — **10-about** (órbita animada + ciudades)
2. `docs/specs/SPEC-SEC-011.md` — **11-faq** (`<details>` nativo, plus rota)
3. `docs/specs/SPEC-SEC-012.md` — **12-cta** (contenedor claro + **tarjeta oscura flotante**)

Fuente por sección: `design/template/sections/1{0,1,2}-*.html` + sus `components/*.css`.

## Reglas (no negociables)

- **Port 1:1** (estructura + CSS scoped tal cual), usando primitivas (`FloatingCard`, `IconBox`, `Eyebrow`, `SectionHead`, `Aurora`, `Button`). **No** re-traducir a Tailwind.
- **Extrae moléculas** (SRP): `DiffItem` (about), `FaqItem` (faq). CTA es un organismo simple.
- **Gate de fidelidad (QA-001):** cada sección se compara **contra su HTML de diseño** (pixelmatch, 8% desktop / 10% mobile). **Debe pasar** desktop+mobile antes de `Verified`. Para FAQ, captura un estado consistente (cerrado, o el primero abierto como en el diseño).
- **TDD:** tests en rojo citando la spec, luego verde, refactor.
- **Tema (ojo):** About **`--lilac-2`** (claro); FAQ **`#fff`**; CTA = **sección clara con tarjeta oscura flotante** (no sección oscura completa).
- **Sin JS por sección:** FAQ con `<details>`; órbita/aurora por CSS (respeta `prefers-reduced-motion`). Cablea `data-reveal`/`.magnetic`.
- **Contenido tipado** por props; nada hardcodeado. Compón las 3 en `index.astro` tras Portfolio.
- **Git:** una rama por spec (`feature/SPEC-SEC-010-about`, …); Conventional Commits con footer `[SPEC-SEC-01x]`, scope `section`.

## Pasos por sección

1. Abre `design/template/sections/NN-*.html` + su CSS.
2. Tests en rojo (estructura/tema + a11y axe + props + **gate QA-001 contra el diseño** + casos clave: about órbita+ciudades, faq plus-rota sin JS, cta tarjeta flotante).
3. Porta el organismo + sus moléculas (CSS scoped); compón en `index.astro`.
4. Refactor SRP. Corre el gate; ajusta hasta pasar el umbral (desktop+mobile).
5. `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check` verde. Estado de cada spec a **Verified**; actualiza `docs/05`.

## Detente y confirma con el humano si

- El gate no baja del umbral por diferencias legítimas (repórtalo con capturas).
- Falta una primitiva en DS-001 → proponla antes.

## Entregable

About + FAQ + CTA **fieles** (gate verde contra el diseño), compuestas en la home, specs `Verified`,
`docs/traceability.md` al día. **Quedan solo 13-contact y 14-footer** + el `index` ensamblado. Al
terminar, resume con los % de diff y confirma que sigue el batch final (contact + footer).
