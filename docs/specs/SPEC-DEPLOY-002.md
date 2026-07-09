# SPEC-DEPLOY-002 — Optimización del pipeline: build-once, gates en paralelo, promote-image

- **ID:** SPEC-DEPLOY-002
- **Estado:** Implemented
- **Épica / Story:** EPIC-40 / STORY-402 (optimización CI/CD)
- **Capa atómica:** infra / CI-CD
- **Depende de:** SPEC-INFRA-001, SPEC-DEPLOY-001 (a la que refina), SPEC-QA-001, SPEC-A11Y-001, SPEC-PERF-001
- **Supersede:** el flujo de `build`/`visual-test`/`a11y-test`/`perf-test`/`build-push-*` de SPEC-DEPLOY-001 (RNF-1, INV-1/2)

## Contexto / problema

El pipeline actual (`.drone.yml`) es **serial y redundante**:
`install → validate → test → visual-test → a11y-test → build → perf-test → build-push → trigger`.
La app se **construye 3–4 veces** (`visual-test`, `a11y-test`, `perf-test` cada uno hace su propio
`pnpm install` + `pnpm build`, más el step `build`); los pasos pesados corren **en serie** (`a11y`
depende de `visual`); y el **deploy espera a `perf`** (`build-push-* depends_on [build, perf-test]`).

**Decisión (consensuada, ver ADR-0013):** aplicar prácticas de CD moderno (trunk-based / DORA) sin
introducir un **ladder de environments por rama** (`dev/qa/homo/prod` = anti-patrón legacy). Se mantiene
`develop`(dev) + `main`(prod). El cambio de valor es: **construir una vez, correr los gates una vez en
paralelo, y promover el mismo artefacto** (build-once → promote-image), no reconstruir por entorno.

## Requisitos funcionales (testeables)

- **RF-1 (build una sola vez)** — el pipeline hace **un** `pnpm install` y **un** `pnpm build` por corrida.
  `visual-test`, `a11y-test` y `perf-test` **consumen el mismo `dist/`** (workspace compartido de Drone /
  artifact), **sin** reinstalar ni reconstruir. Cero `pnpm install`/`pnpm build` redundantes.
- **RF-2 (gates en paralelo)** — `visual-test`, `a11y-test` y `perf-test` dependen del **build único** y
  corren **en paralelo** (no `a11y depends_on visual`). El tiempo del bloque de gates ≈ el más lento, no la suma.
- **RF-3 (perf fuera del camino crítico, pero bloqueante)** — `perf-test` (Lighthouse) ya **no serializa**
  antes del deploy: corre en paralelo contra el build único. **Sigue siendo bloqueante** en `develop`
  (honra SPEC-PERF-001/README). *(Sub-opción documentada y reversible: mover perf a una corrida
  **nightly** programada si se prioriza velocidad de deploy sobre gating por commit — es un flag, no el default.)*
- **RF-4 (build-once → promote-image)** — se construye **una** imagen (en `develop`, tags `dev` +
  `sha-${DRONE_COMMIT_SHA}`). **Prod NO reconstruye:** promueve **la misma imagen ya certificada** por
  **retag** (`sha-<SHA>` → `latest`) sin re-correr gates (via `crane`/`skopeo` in-registry, o Drone
  promotion event). Los gates son **una sola certificación** en `develop`.
- **RF-5 (caching)** — pnpm store + Turbo remote cache reutilizados; el build único cachea entre corridas.
  Documentar cómo el store se comparte entre el step de build y los steps con imagen Playwright.
- **RF-6 (paridad de bits)** — el artefacto que se sirve en prod es **byte-idéntico** al validado en dev
  (misma imagen), no un rebuild. Elimina "funciona en dev, rompe en prod" a nivel de artefacto.

## Requisitos no funcionales

- **RNF-1 (sin bajar la barra)** — **ningún** gate de fidelidad (QA-001) ni a11y se elimina ni se relaja;
  solo se quita la **redundancia** (3-4 builds → 1) y el **doble-run** (prod ya no re-corre gates).
- **RNF-2 (velocidad)** — objetivo: reducir el wall-clock del pipeline sustancialmente (build 1× +
  gates en paralelo); prod pasa a deploy de segundos (promote, no build).
- **RNF-3 (no romper prod)** — el cambio a promote-image en `main` se hace de forma que un push a `main`
  no reconstruya; si el mecanismo de retag no está listo, `main` conserva su comportamiento actual hasta
  activarse (prod aún no está en vivo).

## Invariantes

- **INV-1 (build-once)** — exactamente **un** build de la app por corrida; los gates consumen ese `dist/`.
- **INV-2 (promote, no rebuild)** — prod sirve **la misma imagen** certificada en dev; los gates corren
  **una vez**. (Refina el INV-2 de SPEC-DEPLOY-001: la paridad dev↔prod es ahora **de artefacto**, más fuerte.)
- **INV-3 (gates intactos)** — fidelidad + a11y siguen bloqueando la certificación del artefacto.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: build una sola vez, gates en paralelo
  Given un push a develop
  When corre el pipeline
  Then hay exactamente un pnpm build; visual-test, a11y-test y perf-test consumen ese dist en paralelo

Scenario: prod promueve, no reconstruye
  Given una imagen sha-<SHA> ya certificada en develop
  When se promueve a prod
  Then se re-taggea a latest y se despliega SIN reconstruir ni re-correr gates

Scenario: un gate infiel bloquea igual
  Given un cambio que rompe la fidelidad (QA-001)
  When corre el pipeline en develop
  Then falla y no se publica ni promueve la imagen
```

## Fuera de alcance / rechazado

- **Ladder de environments por rama** (`dev/qa/homo/prod`) → **rechazado** (anti-patrón legacy; ver ADR-0013).
  Se mantiene `develop`(dev) + `main`(prod).
- Feature flags / trunk-based puro con merges a main varias veces al día → innecesario a esta escala.

## Trazabilidad

- **Verificación:** inspección del `.drone.yml` (un solo build; `depends_on` paralelos; retag en prod);
  medición del wall-clock antes/después; gates siguen verdes.
- **Rama:** `feature/SPEC-DEPLOY-002-pipeline-opt` → `develop`.  ·  **ADR:** ADR-0013.
- **Implementación:** `.drone.yml` reescrito (build-once + install-glibc + gates paralelos + promote-image stub);
  `playwright.config.ts` webServer sin rebuild en CI; AGENTS.md §4 actualizado.
  Promote-image (RF-4) stub; `main` conserva rebuild hasta que prod esté activo (RNF-3).
