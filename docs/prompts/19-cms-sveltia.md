# Prompt 19 — CMS Sveltia (`/admin`) (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md`, `../agency-structure/Agency Structure/ARQUITECTURA.md` (tier
básico = Sveltia git-based) y las skills. Metodología (SDD + TDD + Atomic Design + SRP) vinculante.
El contenido ya es **CMS-ready** (SPEC-CONTENT-001: colecciones `settings/site` + `pages/home`).

## Objetivo

Implementar `docs/specs/SPEC-CMS-001.md`: **Sveltia CMS** en `/admin`, git-based, mapeando las
colecciones existentes. **No** hay servidor de CMS.

## Reglas (no negociables)

- **TDD:** tests en rojo citando la spec (`it('[SPEC-CMS-001/RF-3] config fields match Zod schema')`).
- **Admin estático:** `public/admin/index.html` carga Sveltia + `config.yml`. **No** añade JS al sitio; `/admin` es ruta aparte → el **gate de fidelidad (QA-001) debe seguir verde**.
- **Paridad config↔schema:** los campos/widgets del `config.yml` reflejan **exactamente** los schemas Zod de `SPEC-CONTENT-001` (settings/site + pages/home, todas las secciones). Editar+guardar debe producir contenido que **valide** (build fail-fast). Añade un test de paridad o, al menos, un smoke que valide el contenido de ejemplo tras un "guardado" simulado.
- **Dev sin OAuth (File System Access API):** Sveltia NO usa proxy (`local_backend` se ignora). Flujo local: `pnpm dev` → abrir `http://localhost:4321/admin/index.html` en **Chromium** (Chrome/Edge/Brave; no Firefox/Safari) → pulsar **"Work with Local Repository"** → seleccionar la raíz del repo (`.git`). Documenta este flujo; NO incluyas `local_backend` ni referencias al proxy `@sveltia/cms-proxy-server` (no existe).
- **OAuth de producción parametrizado:** deja el `backend` (host Git) y el OAuth **configurables por env**, documentados, pero **NO** metas secretos ni credenciales en el repo.
- **Sin impacto en el sitio:** no toques el render de las páginas; solo añade la ruta `/admin` y el contenido/config.
- **Git:** rama `feature/SPEC-CMS-001-sveltia`; Conventional Commits `[SPEC-CMS-001]`, scope `cms`.

## Host Git (ya confirmado)

- **GitHub, repo `solidgraph-io/sg-webpage`, rama `main`.** `backend: { name: github, repo: solidgraph-io/sg-webpage, branch: main }`.
- **Auth producción:** GitHub OAuth App + un **OAuth relay** (p. ej. Cloudflare Worker `sveltia-cms-auth`). `client_id`/`client_secret` son **secretos** (en el Worker, **no** en el repo). Documenta el relay; **pide al humano** el client id/secret + URL del relay. Hasta tenerlos, el flujo local (File System Access, Chromium) ya funciona; deja el OAuth parametrizado/documentado.

## Paso 0 — Arreglar el tracking de `docs/` (IMPORTANTE)

`docs/` (specs, `05-implementation-plan.md`, `prompts/`, `traceability.md`) **no se está commiteando**
(no está en `.gitignore`; simplemente no se ha hecho `git add docs/`). Antes de nada: **`git add docs/`
y commitea todo lo pendiente** (`docs: track SDD records [SPEC-CMS-001]`) para no perder el registro.
De aquí en adelante, **cada incremento incluye `docs/` en su commit** (regla nueva en `AGENTS.md` §4).

## Pasos

1. `config.yml` con `backend` GitHub (arriba) + `media_folder`/`public_folder`. Sin `local_backend` (Sveltia lo ignora; usa File System Access API).
2. File collections `settings/site` y `pages/home` con campos/widgets que mapean a los schemas Zod (todas las secciones).
3. `public/admin/index.html` cargando Sveltia + el config.
4. Tests: estructura del config, paridad config↔schema (o smoke de validez), y que `/admin` no añade JS al sitio ni afecta el gate de fidelidad.
5. `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check` verde. Documenta el flujo local (File System Access API, Chromium) y el setup OAuth de producción. Estado a `Implemented`; actualiza `docs/05`.

## Entregable

Sveltia en `/admin` editando `settings/site` + `pages/home` en **local** (sin OAuth), con la config
de producción **parametrizada y documentada** (pendiente de host Git + credenciales), sin impacto en
el sitio ni en el gate de fidelidad. Al terminar, resume, indica qué necesitas del humano (host Git +
OAuth) y confirma los diferidos (EPIC-06 leads, EPIC-10 Umami, deploy).
