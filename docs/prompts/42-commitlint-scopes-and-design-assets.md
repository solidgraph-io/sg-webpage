---
type: Prompt
title: "Prompt 42 — Scopes de commitlint + commitear los webp de diseño pendientes"
description: "Añadir los scopes que usamos al scope-enum de commitlint y commitear los 2 webp de marca pendientes en design/assets/."
tags: [prompt, ci, chore]
timestamp: 2026-07-10T22:00:00Z
---

# Prompt 42 — Scopes de commitlint + commitear los webp de diseño pendientes

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Dos tareas de higiene; contra `develop`.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4. Todo va contra `develop`.
Rama `chore/commitlint-and-design-assets` **desde `develop`**; al terminar y verde: **merge y borra la rama**.

## Tarea 1 — Ampliar el `scope-enum` de commitlint

En la corrida de OKF, commitlint rechazó scopes como `okf`, `docs`, `ui`, `brand` porque no están en su
`scope-enum` (por eso el commit fue sin scope). Añádelos.

- Localiza la config de commitlint (`commitlint.config.*` / `.commitlintrc.*` / clave en `package.json`).
- Amplía la regla `scope-enum` para permitir, además de los actuales, al menos:
  `okf, docs, ui, brand, design, hero, a11y, seo, perf, ci, deps`.
  (Si la config **no** define `scope-enum` y por tanto ya permite cualquier scope, entonces el rechazo venía
  de otra regla — diagnostícalo y ajústalo para permitir esos scopes; no lo fuerces si ya son válidos.)
- Verifica: `echo "feat(okf): test" | pnpm exec commitlint` pasa (y un scope inválido sigue fallando).
- **Commit** (sin scope, porque el enum aún no está en el commit anterior no importa aquí):
  `chore: allow okf/docs/ui/brand/design scopes in commitlint`.

## Tarea 2 — Commitear los webp de marca pendientes

Quedaron 2 `.webp` modificados/sin trackear en `design/assets/` (residuo del prompt 39, exports de marca).

- `git status --porcelain design/assets/` para ver exactamente cuáles son.
- Commitea **solo** esos assets de diseño (nada más del working tree). Ya con los scopes ampliados:
  `chore(design): commit updated brand webp exports`.
- Si alguno es un `*Zone.Identifier` de Windows, **no** lo commitees (añádelo a `.gitignore` si no está).

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check && pnpm okf:check
```

Todo verde (estas tareas no tocan código de la app ni docs del bundle, pero corre los gates igual).

## Entregable

`scope-enum` de commitlint acepta nuestros scopes; los 2 webp de `design/assets/` commiteados; nada suelto en
`git status` salvo lo intencional. Reporta los archivos y los dos hashes de commit.
