---
type: Prompt
title: "Prompt 54 — OKF Fase 5.2: sg-webpage consume @solidgraph-io/okf-tools y borra sus scripts locales (dogfood)"
description: "sg-webpage adopta el paquete publicado: añade @solidgraph-io/okf-tools como devDependency, repunta los scripts okf:* al CLI, borra scripts/okf-*.ts + md-zones + sus tests unitarios, y reemplaza la cobertura de SPEC-DOCS-OKF-001 por un test de integración que corre el CLI sobre docs/ (para que el trace gate siga verde). Requiere el paquete publicado. ADR-0016 (Fase 5.2)."
tags: [prompt, okf, tooling]
timestamp: 2026-07-11T07:40:00Z
---

# Prompt 54 — OKF Fase 5.2: sg-webpage consume el paquete (dogfood)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa
> **[ADR-0016](/adr/0016-extract-okf-tooling-shared-package.md)** Fase 5.2. Cambio **tooling/deps + docs**; no
> toca código de la app. TDD. Todo va contra `develop`.

## Precondición (bloqueante)

**`@solidgraph-io/okf-tools@0.1.0-beta.0` debe estar publicado** en npm bajo el dist-tag **`beta`** (Fase 5.1 +
release del humano). Verifica `npm view @solidgraph-io/okf-tools@beta version` → `0.1.0-beta.0` antes de empezar.
**Si no está publicado, detente** y repórtalo — sin el paquete resoluble desde npm, el CI (Drone) no podrá
instalarlo tras borrar los scripts locales.

> **Canal beta (dogfood):** sg-webpage consume la **prerelease pineada exacta** `0.1.0-beta.0` (los rangos SemVer
> normales no incluyen prereleases). Cuando esta fase + Guani (5.3) queden verdes, el humano promueve el stable
> `0.1.0` a `latest` y ahí se afloja el rango a `^0.1.0`.

## Objetivo

sg-webpage deja de tener copia propia del tooling OKF y **consume el paquete** (dogfood). Paridad ya probada en
Fase 5.1 (misma salida en los tres comandos), así que esto es un swap de implementación **sin cambio de conducta**.

## Cambios

### 1. Dependencia + scripts

- Añade `@solidgraph-io/okf-tools` como **devDependency** **pineada exacta** `0.1.0-beta.0` (canal beta; **no**
  uses un rango con `^`, que no resolvería la prerelease) en `apps/web` (o donde vivan los scripts `okf:*` hoy).
  `pnpm install`.
- Repunta los scripts de `package.json` del tooling local al **CLI del paquete**:
  - `okf:check` → `okf check` (bundle `docs`)
  - `okf:index` → `okf index` · `okf:index -- --check` → `okf index --check`
  - `okf:link` → `okf link` · `--check` → `okf link --check`
- **Config:** los defaults del paquete **reproducen sg-webpage** (probado en 5.1) → probablemente **no** hace
  falta `okf.config.json`. Añádelo **solo** si algún comando difiere; si lo añades, que sea el mínimo.

### 2. Borrar el tooling local

Elimina `scripts/okf-check.ts`, `scripts/okf-index.ts`, `scripts/okf-link.ts`, `scripts/md-zones.ts` (y
`frontmatter` si era local del tooling OKF). **No** toques `scripts/trace.ts` (es del gate de trazabilidad; si
`okf-link` reusaba su `SPEC_ID_RE`, la dependencia era al revés — verifica que `trace` no importaba nada del
tooling OKF; si sí, deja el símbolo en `trace.ts`).

### 3. Cobertura de SPEC-DOCS-OKF-001 (¡ojo con el trace gate!)

Los tests unitarios del tooling (`__tests__/okf-*.test.ts`, `md-zones`, config-driven) **se van con el paquete**
— bórralos de sg-webpage. Pero **[SPEC-DOCS-OKF-001](/specs/SPEC-DOCS-OKF-001.md)** vive en sg-webpage y el trace
gate (endurecido en el prompt 43) **falla si un spec queda sin tests** → borrar sus tests unitarios lo dejaría
descubierto.

Reemplázalos por un **test de integración** en sg-webpage, etiquetado `[SPEC-DOCS-OKF-001/RF-1..6]`, que **ejecuta
el CLI del paquete sobre `docs/`** y asevera la conformidad del **bundle** (no del tool):

- `okf check docs` → exit 0, 0 violaciones duras.
- `okf index docs --check` → exit 0 (índices al día).
- `okf link docs --check` → exit 0 / warnings esperados (los históricos), sin romper.

Esto es semánticamente **mejor**: sg-webpage verifica que **su bundle** conforma (responsabilidad del consumidor),
mientras el paquete testea el **tool**. Mantiene el trace gate verde con SPEC-DOCS-OKF-001 cubierto.

### 4. Commit de docs pendientes + índices

En el árbol hay docs tuyos sin commitear (ADR-0016, prompts 53–54, y lo que el reporte de 5.1 marcó como índices
stale). Inclúyelos, corre `okf index docs` para regenerar, y confirma `okf index docs --check` verde.

## Verificación antes de "listo"

```
npm view @solidgraph-io/okf-tools@beta version    # precondición → 0.1.0-beta.0
pnpm install && pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e
pnpm okf:check && pnpm okf:index -- --check && pnpm okf:link   # vía CLI del paquete, idempotente
pnpm trace -- --check                         # SPEC-DOCS-OKF-001 sigue cubierto (test de integración)
```

- Gates verdes; salida de `okf:*` **idéntica** a antes (paridad 5.1). CI (Drone) instala el paquete y corre los
  pasos OKF sin scripts locales.
- Reporta: scripts borrados, tests migrados/reemplazados, y confirma que el trace gate sigue cubriendo
  SPEC-DOCS-OKF-001.

## Git (ciclo de vida — AGENTS.md §4)

Rama `feat/okf-consume-package` **desde `develop`**; Conventional Commit (`refactor`/`chore`, scope `okf`),
incluye `docs/`, `package.json`, borrados y el test de integración. `pnpm exec prettier --write .` (solo tooling).
Al terminar y verde: **merge a `develop` y borra la rama**.

## Entregable

sg-webpage sin tooling OKF local, consumiendo `@solidgraph-io/okf-tools` vía CLI; SPEC-DOCS-OKF-001 cubierto por
un test de integración (bundle conforma); gates verdes con paridad. Reporta archivos borrados/cambiados. Fase 5.3
(Guani adopta OKF sobre el paquete) queda para el prompt siguiente.
