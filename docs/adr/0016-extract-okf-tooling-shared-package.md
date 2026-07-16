---
type: ADR
title: "ADR-0016 — Extraer el tooling OKF a un paquete reutilizable (@solidgraph-io/okf-tools)"
description: "El tooling OKF (okf-check/index/link + md-zones), probado en sg-webpage, se extrae a un paquete versionado y publicado que todos los repos consumen — en vez de copiarlo. Habilita la Fase 5 (Guani) sin duplicar código."
tags: [adr, okf, tooling]
timestamp: 2026-07-11T06:40:00Z
---

# ADR-0016 — Extraer el tooling OKF a un paquete reutilizable

- **Estado:** Accepted (2026-07-15) <!-- home resuelto: repo dedicado sg-okf-tools; publicar al registry sigue requiriendo credenciales del humano -->
- **Contexto:** Metodología / tooling / OKF cross-proyecto
- **Relacionado:** [ADR-0015](/adr/0015-adopt-open-knowledge-format-okf.md) (adopción OKF),
  [SPEC-DOCS-OKF-001](/specs/SPEC-DOCS-OKF-001.md), `AGENTS.md`, `sg-guani`, `agency-structure`

## Contexto

El tooling OKF —`okf-check` (conformidad), `okf-index` (índices por carpeta), `okf-link` (codemod de
cross-links) y el helper `md-zones` (enmascarado de code fences/inline code)— está **probado y en verde en
sg-webpage** (Fases 0–4a de [ADR-0015](/adr/0015-adopt-open-knowledge-format-okf.md)). Hoy vive como scripts
sueltos en `sg-webpage/scripts/`.

La Fase 5 pide replicar OKF a **Guani** (y más adelante a otros repos). Decisión del humano: el tooling se hace
**reutilizable de verdad** (un paquete versionado, fuente única de verdad), **no** copiado a cada repo (que
generaría drift: un fix habría que aplicarlo N veces). Los tres repos (`sg-webpage`, `sg-guani`,
`agency-structure`) son **repos git hermanos, no un monorepo**, así que compartir código exige un artefacto
publicable, no un import relativo.

## Decisión

Extraer el tooling OKF a un **paquete npm versionado y publicado como OSS público** en el **npm registry
oficial** (npmjs.com) bajo el scope de la empresa **`@solidgraph-io`**, licencia **MIT**. `@solidgraph-io/okf-tools`
expone:

> **Nota de scope:** se usa `@solidgraph-io` (no `@solidgraph`) porque el scope `@solidgraph` quedó en una
> cuenta npm antigua sin acceso.

- un **CLI** (`okf check|index|link`) para cablear en cada repo como `pnpm okf:check|okf:index|okf:link`, y
- opcionalmente una **librería** (helpers como `md-zones`, `parseFrontmatter`) reutilizable por otro tooling
  (p. ej. el `trace` de cada repo).

Cada repo lo añade como **devDependency** y lo consume; deja de tener copia propia de los scripts. La
configuración específica del bundle (raíz `docs/`, taxonomía de `type`, mapa de IDs→rutas) se pasa por
**config/flags**, no se hornea en el paquete (así sirve a bundles con layouts distintos).

### Decisión (home) — resuelta: repo dedicado `sg-okf-tools`

El **código fuente** del paquete vive en un **repo dedicado `sg-okf-tools`** (decidido por el humano,
2026-07-15). Es el hogar conceptualmente correcto: el tooling no es ni del sitio ni de Guani, es **metodología
compartida**. Repo pequeño con su propio CI de publicación al registry. El **consumo** es una devDependency
`@solidgraph-io/okf-tools` desde el registry, idéntica en todos los repos.

> **Infra pendiente del humano:** crear el repo `sg-okf-tools` en el host git (`github.com/solidgraph-io`) y
> **crear/poseer la org `@solidgraph-io` en npm público**. **Auth de publish:** manual vía 2FA interactiva
> (Flow A) o, para CI, **Trusted Publishing (OIDC)** — **no** tokens de larga duración (ver deprecación abajo).
> Los prompts de esta fase **scaffoldean y dejan listo** el paquete (código, CLI, tests, LICENSE MIT, metadata
> OSS, `publishConfig.access: public`) pero **no** ejecutan `npm publish` ni montan el pipeline sin tu OK (regla
> de `CLAUDE.md`: confirmar antes de tocar registry/CI/deploy).

## Justificación

1. **Fuente única de verdad.** Un fix o una nueva regla de conformidad se hace **una vez** y se versiona; los
   repos suben de versión cuando quieren. Es exactamente "hacer reutilizable toda la metodología OKF".
2. **Coherente con el stack.** El repo vive en `github.com/solidgraph-io` y hay cultura de CI; publicar un
   paquete OSS público a npm encaja sin inventar nada (la automatización va por GitHub Actions + OIDC, no Drone).
3. **Config, no fork.** Parametrizar el bundle (raíz, taxonomía) evita que cada repo forkee el tool para sus
   diferencias.
4. **Dogfooding.** sg-webpage migra a **consumir** el paquete (borra sus scripts locales) → prueba que el
   paquete es completo antes de que Guani dependa de él.

## Consecuencias

- **Plan de migración (fasado, cada fase = un prompt):**
  1. **Extraer + empaquetar + publicar** `@solidgraph-io/okf-tools` (según opción A/B que elijas) con sus tests.
  2. **sg-webpage consume el paquete** (dogfood): reemplaza `scripts/okf-*.ts` por la devDependency; gates
     verdes idénticos.
  3. **Guani adopta OKF** consumiendo el paquete: frontmatter + `index.md` raíz + índices + `okf:link` + `log.md`
     + wiring en CI + ADR espejo en Guani; apuntar su `AGENTS.md`/`CLAUDE.md` al `index.md` raíz.
  4. **Más adelante:** agency-structure y otros repos (fuera de alcance ahora).
- **OSS público:** LICENSE **MIT**, README con uso, `CHANGELOG.md`, metadata pública (`repository`, `keywords`,
  `license`), `publishConfig.access: public`. Al ser público, la disciplina de release (semver, changelog) pasa
  a ser parte del contrato.
- **Canales de release (estándar de industria):** el paquete se valida antes de `latest`. Primero **prerelease**
  `0.1.0-beta.0` publicada con **`npm publish --tag beta`** (y GitHub release marcada *pre-release*); los
  consumidores (sg-webpage 5.2, Guani 5.3) la **pinean exacta** y la dogfoodean. Cuando ambos quedan verdes, se
  corta el **stable `0.1.0` en `latest`**. `latest` no se asigna hasta la promoción.
- **Automatización de publish (corregido tras hallazgo del changelog de npm):** los tokens **GAT bypass-2FA**
  se deprecan (ago-2026 pierden operaciones sensibles; ene-2027 pierden publish), así que un pipeline sobre
  `NPM_TOKEN` nacería muerto. El publish manual usa **2FA interactiva** (Flow A); el CI recomendado es **Trusted
  Publishing con OIDC vía GitHub Actions** (sin secretos de larga duración, con provenance) — encaja porque el
  repo ya vive en `github.com/solidgraph-io`. El esbozo de Drone quedó **retirado** (Drone no emite el OIDC que
  npm acepta). Detalle operativo en `sg-okf-tools/PUBLISHING.md` (Flow A + Flow B). La vinculación del workflow en
  npmjs.com es una operación sensible que hace el humano interactivamente.
- **Consumidores sin fricción (npm v12):** npm v12 bloquea por defecto lifecycle scripts, git deps y URLs remotas
  al instalar. `@solidgraph-io/okf-tools` está limpio en los tres (cero lifecycle scripts, única dep runtime
  `yaml`) → quien lo instale no aprueba nada. Parte del contrato del paquete (deps mínimas).
- **Versionado:** el paquete sigue semver; `okf_version` del bundle (contenido) es independiente de la versión
  del **tool**.
- **Reversible:** si se abandonara, cada repo puede re-vendorizar los scripts (siguen siendo Node/TS simples).
- Se creará una **spec de la interfaz del paquete** (CLI/flags/config) o se extiende
  [SPEC-DOCS-OKF-001](/specs/SPEC-DOCS-OKF-001.md) para que la conformidad no dependa de un repo concreto.

## Citations

Continúa el trabajo de [ADR-0015](/adr/0015-adopt-open-knowledge-format-okf.md) (Fase 5 — cross-proyecto).
