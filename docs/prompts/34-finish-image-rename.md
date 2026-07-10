---
type: Prompt
title: "Prompt 34 — Completar rename de imagen `solidgraph-web` → `sg-webpage` (test + consistencia)"
description: "La imagen del registry se renombró registry.solidgraph.dev/solidgraph-web → registry.solidgraph.dev/sg-webpage (el nombre viejo colisiona con otro proyecto ya publicado)."
tags: [prompt]
timestamp: 2026-07-09T15:39:28-04:00
---

# Prompt 34 — Completar rename de imagen `solidgraph-web` → `sg-webpage` (test + consistencia)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Cierra un rename dejado a medias.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y `SPEC-DEPLOY-001`/`SPEC-DEPLOY-002`. TDD.

## Contexto
La imagen del registry se renombró `registry.solidgraph.dev/solidgraph-web` →
`registry.solidgraph.dev/sg-webpage` (el nombre viejo **colisiona con otro proyecto** ya publicado).
El cambio se aplicó en `.drone.yml`, `docs/deploy/dev-stage.md` y `SPEC-DEPLOY-001`, **pero el test quedó
sin actualizar** → falla:
`src/__tests__/deploy-001.test.ts:45 [SPEC-DEPLOY-001/RF-2]` sigue esperando `…/solidgraph-web`.

## Tareas
1. **Arregla el/los test** que fijan el nombre de imagen: `apps/web/src/__tests__/deploy-001.test.ts`
   (y cualquier otro test que lo referencie) → assert `registry.solidgraph.dev/sg-webpage`. Mantén el
   tag `[SPEC-DEPLOY-001/RF-2]`.
2. **Grep de consistencia:** `git grep -n "registry.solidgraph.dev/solidgraph-web"` y
   `git grep -n "solidgraph-web:"` → **cero** ocurrencias del nombre viejo en código/config/specs. Repara
   las que queden. (Los `docs/prompts/*` históricos se pueden dejar.)
3. **NO cambies** `@solidgraph/web` (paquete pnpm) ni `solidgraph-webpage` (nombre del pipeline Drone) —
   son otros identificadores, no la imagen.
4. Confirma que `.drone.yml` (steps `build-push-web-dev`, `build-push-web`, stub `promote-image`) y el
   runbook usan `registry.solidgraph.dev/sg-webpage`.

## Verificación
```
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check
```
`pnpm test` verde (el fallo de `deploy-001.test.ts` resuelto); sin referencias al nombre viejo.

## Git (ciclo de vida — AGENTS.md §4)
Rama `fix/image-repo-rename` **desde `develop`**; Conventional Commit (`ci`/`test`, scope `infra`),
incluye `docs/`. Corre `pnpm exec prettier --write .` (solo código) antes de commitear. Al terminar y
verde: **merge a `develop` y borra la rama**.

## Entregable
Rename completo y coherente (config + test + spec); `pnpm test` verde; el pipeline publica en
`registry.solidgraph.dev/sg-webpage`. Reporta qué archivos tocaste.
