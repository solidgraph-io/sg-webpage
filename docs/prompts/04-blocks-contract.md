# Prompt 04 — Contrato de bloques + BlockRenderer (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md`, `../agency-structure/Agency Structure/ARQUITECTURA.md` §3, y
las skills `.claude/skills/`. Metodología (SDD + TDD + Atomic Design + SRP) vinculante.

## Autorización

Esta tarea **modifica el contrato de bloques** (`packages/blocks-contract`). Queda **autorizada
y especificada** por `docs/specs/SPEC-BLOCK-000.md` (Approved). Impleméntala tal cual; si el
diseño exige un campo no previsto en el Apéndice A, **párate y propón el cambio de spec** antes.

## Objetivo

Implementar `docs/specs/SPEC-BLOCK-000.md`: el **contrato de bloques** (13 schemas Zod + shared +
`Page`), el wiring a **Content Collections** y el **`BlockRenderer`**. **Sin organismos todavía**
(esos van en specs posteriores) — el renderer muestra placeholder para types aún no implementados.

## Reglas (no negociables)

- **TDD:** por cada `RF-x`/`RNF-x`/`INV-x`, test en **rojo** citando la spec: `it('[SPEC-BLOCK-000/RF-4] invalid content fails the build')`. Luego verde, luego refactor.
- **El schema Zod es la fuente de verdad.** Los 13 schemas son los del Apéndice A de la spec, congelados. `type` como literal; rechaza campos extra.
- **Fail-fast (INV-1):** contenido inválido rompe el build con error claro (bloque + campo).
- **Consistencia (INV-2):** test que verifica que todo `type` del contrato está en el registro del renderer (implementado o `pending`) y que no hay entradas huérfanas.
- **SRP:** el `BlockRenderer` solo enruta (sin estilos ni lógica de organismo); ubícalo en `apps/web/src/components/templates/`.
- **Type-safety:** cada futura entrada del registro recibirá props por `z.infer` del schema.
- **Git:** rama `feature/SPEC-BLOCK-000-blocks-contract`; Conventional Commits con footer `[SPEC-BLOCK-000]`, scope `block` (o `content` para el wiring de colecciones).

## Pasos

1. `packages/blocks-contract`: shared schemas (`Cta`, `MediaRef`, `LinkItem`, `SeoMeta`) + los 13 schemas de bloque (Apéndice A) + `Block` (discriminated union) + `Page`. Exporta tipos.
2. Tests de parseo por bloque (válido/ inválido) + `Page`.
3. `apps/web/src/content/config.ts`: colección `pages` con `Page`; añade `content/pages/home.json` **mínimo y válido** (solo para probar el pipeline; el contenido real llega con los organismos). Test de que un JSON inválido rompe el build.
4. `lib/blocks.ts` (registro type→componente, inicialmente todo `pending`) + `templates/BlockRenderer.astro` (enruta; placeholder visible para `pending`; nunca descarta en silencio). Test de enrutado + consistencia.
5. `index.astro`/`[...slug].astro`: cargan la `Page` y renderizan `<BlockRenderer>` en `BaseLayout` con `page.seo`.
6. `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` en verde. Actualiza Trazabilidad + Estado (`Implemented`) de la spec y `docs/05`.

## Detente y confirma con el humano si

- El diseño requiere un campo/bloque no contemplado en el Apéndice A → propón cambio de spec.
- Vas a introducir dependencias nuevas en el contrato más allá de Zod.

## Entregable

`packages/blocks-contract` completo y testeado, colección `pages` validada en build, `BlockRenderer`
enrutando con placeholders para los 13 types, home mínima booteable. Al terminar, resume y confirma
que sigue el **primer grupo de organismos** (propuesta: estructural Nav+Footer, o Hero+CtaBand).
