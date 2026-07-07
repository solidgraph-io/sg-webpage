# Prompt 18 — Capa de contenido CMS-ready (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. **Va antes del SEO.**

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills. Metodología (SDD + TDD + Atomic Design + SRP)
vinculante. La home ya es **fiel al diseño** (M0) y está protegida por el **gate de fidelidad**
(SPEC-QA-001).

## Contexto

El contenido de la home está **inline como constantes en `index.astro`** → **no es editable por un
CMS**. Vamos a moverlo a **Content Collections** (archivos de datos + Zod) para que Sveltia (EPIC-05)
lo edite **sin migración**. Es solo mover datos: el render no cambia.

## Objetivo

Implementar `docs/specs/SPEC-CONTENT-001.md`: capa de contenido CMS-ready + migración verbatim.

## Reglas (no negociables)

- **TDD:** tests en rojo citando la spec (`it('[SPEC-CONTENT-001/RF-5] index reads from collections')`).
- **Migración VERBATIM:** mueve el contenido de `index.astro` a los archivos de datos **sin cambiar una coma** del copy. Nada de "mejorar" textos.
- **Fidelidad intacta (la red de seguridad):** al terminar, el **gate QA-001 debe seguir verde** en todas las secciones y en la página completa. Si un diff sube, es que cambiaste el render → revísalo.
- **CMS-ready:** `content/settings/site.*` (SiteConfig: name/url/logo/locations/contact/sameAs/defaultSeo) + `content/pages/home.*` (todos los datos de sección + `seo?`). Formato JSON o YAML (Sveltia-mapeable). Documenta cómo cada colección mapeará a Sveltia (colecciones "file"/singleton) para que EPIC-05 solo añada la config del admin.
- **`index.astro` solo compone:** lee con `getEntry('settings','site')` + `getEntry('pages','home')` y pasa props; **cero constantes de contenido** en el `.astro`. Fail-fast por Zod.
- **Sin cambios visuales:** no toques CSS ni estructura de las secciones; solo el origen de los datos.
- **Git:** rama `feature/SPEC-CONTENT-001-content-layer`; Conventional Commits `[SPEC-CONTENT-001]`, scope `content`.

## Pasos

1. `src/content/config.ts`: colecciones `settings` (singleton `site`) y `pages` (singleton `home`) `type:'data'` con schemas Zod que cubran **todos** los campos.
2. Crea `content/settings/site.*` y `content/pages/home.*` copiando **verbatim** el contenido inline de `index.astro`.
3. Refactoriza `index.astro` para leer de las colecciones y pasar props; elimina las constantes.
4. Tests: parse de schemas, index sin contenido inline, fail-fast, y **corre el gate de fidelidad** para probar que sigue verde.
5. `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check` verde. Estado de la spec a `Implemented`; actualiza `docs/05`.

## Detente y confirma con el humano si

- Descubres contenido que no encaja limpio en un schema (decide estructura antes de inventar).
- El gate de fidelidad sube tras la migración (no debería) → repórtalo con capturas.

## Entregable

Todo el contenido de la home en `content/` (CMS-ready), `index.astro` leyendo de las colecciones,
**gate de fidelidad verde** (render idéntico), specs a `Implemented`. Con esto el SEO/SiteConfig y el
contenido quedan **editables desde el CMS** cuando montemos Sveltia (EPIC-05). Al terminar, resume y
confirma que sigue **SEO + perf + a11y** (`SPEC-SEO-001` ya consume `settings/site`).
