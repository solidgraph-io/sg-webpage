---
type: Prompt
title: "Prompt 27 — Reconciliar ramas (git-flow): consolidar en `develop` y borrar sprawl"
description: "Se acumularon muchas ramas sin cerrar (probablemente cortadas una sobre otra, por eso el working tree tiene todo)."
tags: [prompt]
timestamp: 2026-07-08T17:55:17-04:00
---

# Prompt 27 — Reconciliar ramas (git-flow): consolidar en `develop` y borrar sprawl

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. **Operación git delicada: AUDITA y
> PROPÓN antes de borrar/mergear nada. No toques la historia de `main`. No borres trabajo divergente.**

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 (ciclo de vida de rama, recién actualizado).
Objetivo: dejar el repo consistente con git-flow — `develop` integra todo lo terminado, y **las ramas
`feature/*`/`fix/*`/`refactor/*` ya contenidas se borran** (local y remota). Cero ramas colgando.

## Contexto (el problema)
Se acumularon muchas ramas sin cerrar (probablemente cortadas una sobre otra, por eso el working tree
tiene todo). AGENTS.md ahora exige: feature sale de `develop`, se mergea de vuelta y **se borra**.

## Paso 0 — AUDITORÍA (solo lectura; REPORTA antes de actuar)
Ejecuta y **pega el resultado**, luego propón el plan y **detente para confirmación**:
```
git status
git remote -v
git branch -a
git log --graph --oneline --decorate --all -40
```
Para cada rama local y remota, clasifícala:
- **`git branch --merged develop`** (si `develop` existe) → **contenida** = candidata a borrar.
- **`git branch --no-merged develop`** → **divergente** = tiene commits únicos; **NO** borrar; reportar
  qué commits únicos trae (`git log develop..<rama> --oneline`).
- Si **`develop` no existe** aún, dímelo: se creará desde la punta que contenga todo el trabajo terminado.

## Paso 1 — Determinar la punta integrada
El trabajo terminado esperado (todo verde, 700 tests): content, CMS(sveltia), SEO, perf, a11y,
leads+Turnstile, **astro:env** (`fix/env-runtime-astro-env`), **component-folder rollout**
(`refactor/component-folder-rollout`), **deploy dev** (`.drone.yml` steps), fix `.prettierignore`,
fix docs sveltia. Identifica en qué rama vive la punta con TODO esto integrado.

## Paso 2 — Consolidar en `develop` (tras mi OK)
- Si `develop` no existe o está atrasada: créala/actualízala para que **contenga toda la punta integrada**
  (fast-forward o merge, sin perder nada). `main` **no se toca** (queda como base de producción).
- Corre gates y verifica verde en `develop`:
  `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check`.
- Push de `develop` al remoto.

## Paso 3 — Borrar el sprawl (solo ramas CONTENIDAS)
- Borra **solo** las ramas cuyos commits ya están **100% en `develop`** (o en `main`): local
  (`git branch -d`, nunca `-D` salvo que confirmes) y remota (`git push origin --delete <rama>`).
- **Cualquier rama con commits únicos → NO la borres**; repórtala aparte con su diff para decidir.
- No borres `main` ni `develop`.

## Paso 4 — Verificar el estado final
```
git branch -a          # solo deben quedar main, develop (+ ramas divergentes reportadas, si las hubo)
git log --graph --oneline --decorate --all -20
```

## Reglas
- **Nada destructivo sin mi confirmación** tras el reporte del Paso 0. Si algo es ambiguo, detente y pregunta.
- No reescribas historia de `main` (ni `rebase`/`push --force` sobre ramas compartidas).
- `docs/` se commitea si tocas algo de docs.

## Entregable
Reporte de auditoría + plan; tras OK, `develop` consolidada y verde, ramas contenidas borradas (local y
remota), y la lista final de ramas (idealmente solo `main` + `develop`). Si quedó alguna rama divergente,
explícala para decidir su merge o descarte.
