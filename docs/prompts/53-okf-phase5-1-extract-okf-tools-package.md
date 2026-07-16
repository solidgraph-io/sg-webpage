---
type: Prompt
title: "Prompt 53 — OKF Fase 5.1: extraer el tooling a un paquete reutilizable @solidgraph-io/okf-tools (repo sg-okf-tools)"
description: "Scaffoldea el repo dedicado sg-okf-tools y extrae okf-check/index/link/md-zones a @solidgraph-io/okf-tools: paquete OSS público (npm, MIT) con CLI (okf check|index|link) + lib, config-driven (raíz/taxonomía/mapa por config, no hardcode). Deja listo el publish público SIN publicar. Implementa ADR-0016 (Fase 5.1)."
tags: [prompt, okf, tooling]
timestamp: 2026-07-11T07:00:00Z
---

# Prompt 53 — OKF Fase 5.1: extraer `@solidgraph-io/okf-tools`

> Pégale esto a Claude Code **en la raíz del workspace `SOLIDGRAPH`** (el padre de `core/sg-webpage`,
> `sg-guani`, `core/agency-structure`). Implementa **[ADR-0016](/adr/0016-extract-okf-tooling-shared-package.md)**,
> Fase 5.1. Crea un **repo nuevo**; TDD. No publica nada.

Eres un implementador. Lee, en `core/sg-webpage`, **ADR-0016** y **[ADR-0015](/adr/0015-adopt-open-knowledge-format-okf.md)** y
**[SPEC-DOCS-OKF-001](/specs/SPEC-DOCS-OKF-001.md)**. El tooling OKF probado vive en
`core/sg-webpage/scripts/` (`okf-check.ts`, `okf-index.ts`, `okf-link.ts`, `md-zones.ts`) con sus tests en
`core/sg-webpage/apps/web/src/__tests__/`.

## Objetivo

Extraer ese tooling a un **paquete reutilizable y versionado** `@solidgraph-io/okf-tools`, en un **repo dedicado
`sg-okf-tools`**, con **CLI** + **lib**, **config-driven** (sin asumir el layout de sg-webpage). Dejarlo **listo
para publicar** al registry, **sin** ejecutar el publish ni montar el pipeline (infra del humano — ADR-0016).

## 1. Scaffold del repo

Crea `sg-okf-tools/` como **repo git nuevo** hermano de los demás (mismo nivel que `core/`, `sg-guani`). `git
init`, rama `develop` (mismo modelo de ramas que el resto — AGENTS.md). Estructura:

```
sg-okf-tools/
  package.json        # name @solidgraph-io/okf-tools, version 0.1.0, type module, bin "okf", exports (lib), files,
                      #   license "MIT", repository, keywords, publishConfig { access: "public", registry: "https://registry.npmjs.org" }
  tsconfig.json
  LICENSE             # MIT (año 2026, SolidGraph Solutions LLC)
  CHANGELOG.md        # 0.1.0 — extracción inicial
  src/
    md-zones.ts       # helper (maskCodeZones, maskInlineCode, FRONTMATTER_RE, FENCE_RE) — lib export
    frontmatter.ts    # parseFrontmatter (si estaba embebido, extráelo) — lib export
    check.ts index.ts link.ts   # lógica de cada comando (portada)
    config.ts         # tipos + carga de config del bundle
    cli.ts            # entrypoint del bin: okf check|index|link [--config] [--check]
  test/               # tests portados + nuevos (config-driven)
  README.md           # calidad OSS: qué es OKF, instalación, uso del CLI, config, ejemplos
  AGENTS.md           # reglas mínimas (mismo estándar abierto)
  .gitignore
```

## 2. Extraer y hacer **config-driven** (lo importante)

Porta la lógica **verbatim en comportamiento**, pero saca a **config** todo lo que hoy asume sg-webpage:

- **`bundleRoot`** (hoy `docs/`), **taxonomía de `type`** válida, **archivos reservados** (`index.md`,
  `log.md`), **mapa ID→ruta** (regex de SPEC-ID `SPEC-[A-Z]+(?:-[A-Z]+)*-\d+`, slug de ADR `ADR-\d{4}`, y cómo
  resolver cada ID a su archivo), y el **`okf_version`** esperado.
- Config por archivo **`okf.config.json`** (o `.ts`) en la raíz del bundle consumidor + override por flags.
  Provee **defaults** que reproduzcan el comportamiento actual de sg-webpage (para que su migración —Fase 5.2—
  sea sin cambios de conducta).
- **Sin** rutas hardcodeadas ni supuestos de monorepo. El paquete no conoce sg-webpage.

CLI `okf`:
- `okf check [--config PATH]` → conformidad (RF-1..6 de SPEC-DOCS-OKF-001), exit codes iguales.
- `okf index [--config PATH] [--check]` → genera/verifica índices por carpeta.
- `okf link [--config PATH] [--check]` → codemod de cross-links (idempotente; `--check` warning-only).

Lib exports: `md-zones`, `parseFrontmatter`, y las funciones core (para que el `trace` de cada repo pueda
reutilizar helpers si quiere).

## 3. Tests (TDD)

Porta los tests existentes (los fixtures eran sintéticos → portables) y **añade** cobertura config-driven:
mismo input con **dos configs distintas** (p. ej. `bundleRoot` y taxonomía diferentes) produce el resultado
esperado en cada una. Etiqueta `[SPEC-DOCS-OKF-001/RF-x]` donde aplique. Todo verde en el repo nuevo.

## 4. Publish público (npm) — preparar, NO ejecutar

- Paquete **OSS público**: `license: "MIT"` + archivo `LICENSE`; `publishConfig: { access: "public", registry:
  "https://registry.npmjs.org" }`; metadata pública (`repository`, `keywords`, `description`, `author`).
  `prepublishOnly` = build + test. **Nunca** un token en el repo (el `NPM_TOKEN` va por env/CI secret).
- Deja un **`PUBLISHING.md`** (y opcional `.github/workflows` o `.drone.yml` de release **comentado/desactivado**)
  describiendo el flujo: `npm publish --access public` con `NPM_TOKEN`, tag semver, provenance opcional. **No** lo
  actives ni publiques.
- **Detente antes de** `npm publish` / crear el pipeline real. **Infra del humano:** poseer la org
  **`@solidgraph-io`** en npm (el scope `@solidgraph` quedó en una cuenta antigua sin acceso) y proveer el
  `NPM_TOKEN`. Reporta qué falta de su lado.

## Verificación antes de "listo"

En `sg-okf-tools/`:

```
pnpm install && pnpm build && pnpm test
node dist/cli.js check --config ./test/fixtures/okf.config.json   # smoke del CLI en un bundle de prueba
```

- Build + tests verdes; el CLI corre `check|index|link` contra un bundle fixture con config.
- **No** se publicó nada; el repo `sg-okf-tools` queda listo para que tú des de alta registry + pipeline.
- sg-webpage **no se toca** en este prompt (su migración a consumir el paquete es la **Fase 5.2**).

## Git

Repo `sg-okf-tools`, rama `develop`; Conventional Commits (`feat`, scope `okf`/`cli`). Commit inicial del
scaffold + extracción + tests. **No** hagas push (no hay remote aún; lo creas tú). Reporta el árbol creado.

## Entregable

Repo `sg-okf-tools` con `@solidgraph-io/okf-tools` 0.1.0: CLI `okf check|index|link` + lib, **config-driven**, OSS
público (LICENSE MIT, metadata + `publishConfig.access: public`, README de calidad), tests verdes (incluida
cobertura de configs distintas), publish **preparado pero no ejecutado**. Reporta la interfaz del CLI/config y
qué falta de infra (org `@solidgraph-io` en npm + `NPM_TOKEN` + pipeline). Fase 5.2 (sg-webpage consume el paquete)
y 5.3 (Guani adopta OKF) quedan para prompts siguientes.
