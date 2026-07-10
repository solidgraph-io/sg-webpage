---
type: Prompt
title: "Prompt 28 — Fix gate de formato (prettier) + prevención durable"
description: "El gate npx prettier --check ."
tags: [prompt]
timestamp: 2026-07-08T18:44:37-04:00
---

# Prompt 28 — Fix gate de formato (prettier) + prevención durable

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Corrige el CI (prettier `--check` en rojo)
> y cierra las causas para que no recurra.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 (ciclo de vida de rama). Cambio de tooling/format.

## Contexto
El gate `npx prettier --check .` falla: 10 archivos sin formatear (prompts `.md`, `Hero.module.scss`,
algunos test files, `SKILL.md`, `docs/05`). Se commitearon sin pasar por prettier. Además `lint-staged`
**no cubre `.scss`**, así que los `*.module.scss` se cuelan aunque corra el hook.

## Tareas
1. **Formatear todo:** `pnpm exec prettier --write .` y commitear los cambios resultantes.
2. **lint-staged (root `package.json`):** añade `scss` al glob de prettier. Debe quedar algo como:
   `"**/*.{ts,tsx,astro,js,mjs,cjs,json,css,scss,md,yaml,yml}": ["prettier --write --ignore-unknown"]`.
3. **`.prettierignore`:** añade `docs/prompts/` (son artefactos de handoff internos; evita ruido
   recurrente en el gate). **No** ignores `docs/specs/`, `docs/adr/`, `docs/05-*` — esos se mantienen
   formateados.
4. **Verifica** que husky corre el pre-commit (si el entorno de Claude Code hace commits con
   `--no-verify` o sin husky instalado, deja constancia; el gate de CI es el backstop de todos modos).

## Verificación
```
pnpm exec prettier --check .   # 0 issues
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check
```

## Git (ciclo de vida — AGENTS.md §4)
Rama `fix/prettier-format` **desde `develop`**; Conventional Commits (`style:`/`chore:`), scope `infra`,
incluye `docs/`. Al terminar y verde: **merge a `develop` y borra la rama** (local y remota).

## Entregable
`prettier --check .` verde en CI; `lint-staged` cubre `.scss`; `docs/prompts/` ignorado por prettier;
rama borrada tras integrar. Confirma el estado de `develop`.
