---
type: Spec
title: "SPEC-DEPLOY-001 — Stage dev: deploy continuo desde `develop` (registry + Dokploy)"
description: "El pipeline (.drone.yml) ya corre todos los gates en develop y main, pero solo main publica imagen al registry y dispara Dokploy."
tags: [deploy]
timestamp: 2026-07-09T15:30:58-04:00
---

# SPEC-DEPLOY-001 — Stage dev: deploy continuo desde `develop` (registry + Dokploy)

- **ID:** SPEC-DEPLOY-001
- **Estado:** Approved
- **Épica / Story:** EPIC-40 / STORY-401 (deploy dev)
- **Capa atómica:** infra / CI-CD
- **Depende de:** [SPEC-INFRA-001](/specs/SPEC-INFRA-001.md) (pipeline base + Dockerfile), y el sitio completo (SEC/CONTENT/SEO/PERF/A11Y/CMS/FORM)

## Contexto / problema

El pipeline (`.drone.yml`) ya corre todos los gates en `develop` y `main`, pero **solo `main`**
publica imagen al registry y dispara Dokploy. No existe un **entorno dev** para probar y refinar el
despliegue antes de producción. Se añade un **stage dev** que despliega en cada push a `develop`,
sirviendo en **`dev.solidgraph.dev`**, con los leads **cableados de verdad** (Resend + Turnstile) para
probar el flujo end-to-end.

> **Decisión (consensuada):** stage dev = `dev.solidgraph.dev`; leads **completos** (Resend + Turnstile
> reales) desde el arranque. Prod (`main` → `solidgraph.io`) queda **intacto**.

## Requisitos funcionales (testeables)

- **RF-1 (rama develop)** — existe la rama `develop` integrando todo lo `Implemented` (content, CMS, SEO,
  perf, a11y, leads/turnstile, fix de docs). `main` no se toca en este incremento.
- **RF-2 (build-push dev)** — nuevo step `build-push-web-dev` en `.drone.yml`: en **push a `develop`**,
  construye `apps/web/Dockerfile` y publica a `registry.solidgraph.dev/sg-webpage` con tags
  **`dev`** + `${DRONE_COMMIT_SHA}` (NO `latest`, que es de prod). Reusa `REGISTRY_USERNAME/PASSWORD`.
- **RF-3 (trigger dev)** — nuevo step `trigger-dokploy-dev`: en push a `develop`, tras el push de imagen,
  hace `POST` al **`DOKPLOY_WEBHOOK_WEB_DEV`** (secret nuevo de Drone). El de prod
  (`trigger-dokploy` → `DOKPLOY_WEBHOOK_WEB`, branch `main`) queda sin cambios.
- **RF-4 (gates igual de estrictos)** — dev pasa por los **mismos gates** que prod (validate, test+trace,
  visual-test QA-001, a11y, build, perf) antes de publicar. Sin relajar umbrales.
- **RF-5 (env por entorno)** — el contenedor dev recibe por env (Dokploy, **no** repo):
  `PUBLIC_SITE_URL=https://dev.solidgraph.dev`, `LEAD_PROVIDER=resend`, `LEAD_TO_EMAIL`,
  `LEAD_FROM_EMAIL` (dominio verificado en Resend), `RESEND_API_KEY`, `TURNSTILE_SITE_KEY`,
  `TURNSTILE_SECRET_KEY`. Documentado en `.env.example` / doc de deploy.
- **RF-6 (doc de runbook)** — `docs/` documenta el runbook dev: qué secretos van en Drone vs Dokploy,
  DNS/Traefik para `dev.solidgraph.dev`, allowlist de dominio en Turnstile, verificación post-deploy
  (home 200, `/admin` carga, `POST /api/lead` con token válido entrega email).

## Requisitos no funcionales

- **RNF-1 (paridad prod/dev)** — dev usa **el mismo Dockerfile y los mismos gates** que prod; la única
  diferencia es tag de imagen, webhook y valores de env. Evita "funciona en dev, rompe en prod".
- **RNF-2 (seguridad)** — cero secretos en el repo: registry/Dokploy/Turnstile/Resend en secrets de
  Drone o env de Dokploy. `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY` server-only.
- **RNF-3 (no romper prod)** — los steps de `main` (build-push-web, trigger-dokploy) quedan **idénticos**;
  el trigger global del pipeline sigue siendo push + pull_request.

## Invariantes

- **INV-1** — `main` → prod (`solidgraph.io`, tag `latest`); `develop` → dev (`dev.solidgraph.dev`, tag
  `dev`). Nunca se cruzan tags ni webhooks.
- **INV-2** — dev no baja la barra de calidad: mismos gates bloqueantes que prod.
- **INV-3** — sin secretos en el repo.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: push a develop despliega dev
  Given un push a la rama develop que pasa todos los gates
  When corre el pipeline
  Then publica la imagen tag dev+SHA al registry y hace POST al webhook dev de Dokploy
  And main y su webhook de prod no se ven afectados

Scenario: dev sirve el sitio con leads reales
  Given el contenedor dev desplegado en dev.solidgraph.dev
  When se abre la home y se envía el form con un token de Turnstile válido
  Then la home responde 200, /admin carga, y el lead llega a LEAD_TO_EMAIL vía Resend

Scenario: gate infiel bloquea el deploy dev
  Given un cambio que rompe la fidelidad (QA-001)
  When corre el pipeline en develop
  Then falla antes de build-push-web-dev y no despliega
```

## Detente y confirma con el humano (setup fuera del repo)

Claude Code **no** puede tocar Dokploy/Cloudflare/Drone-secrets. El humano configura:

- **DNS:** `dev.solidgraph.dev` → VPS (Cloudflare), con Traefik enrutando al servicio dev (puerto 4321).
- **Dokploy:** servicio `web-dev` que hace pull de `registry.solidgraph.dev/sg-webpage:dev`, dominio
  `dev.solidgraph.dev`, y las env de RF-5 como env/secrets. Copia su **deploy webhook** →
  secret de Drone `DOKPLOY_WEBHOOK_WEB_DEV`.
- **Drone secrets:** añadir `DOKPLOY_WEBHOOK_WEB_DEV` (y confirmar que `REGISTRY_USERNAME/PASSWORD` ya
  existen).
- **Turnstile:** añadir `dev.solidgraph.dev` al allowlist del site; obtener `TURNSTILE_SITE_KEY` +
  `TURNSTILE_SECRET_KEY`.
- **Resend:** verificar el dominio de `LEAD_FROM_EMAIL`; obtener `RESEND_API_KEY`; fijar `LEAD_TO_EMAIL`.

## Fuera de alcance

- Deploy a **producción** (`main` → `solidgraph.io`) → decisión humana aparte (los steps ya existen).
- Servicios avanzados (Strapi/Vendure) → tier avanzado de la fábrica, no aplica al sitio propio.
- Rollback automatizado / blue-green → futuro.

## Trazabilidad

- **Tests/verificación:** el pipeline dev es la prueba viva (gates + deploy). Post-deploy: smoke manual
  (home 200, `/admin`, `POST /api/lead`). Sin unit test nuevo; se valida por observación del stage.
- **PRs:** rama `feature/SPEC-DEPLOY-001-dev-stage` → `develop`. · **ADR:** ADR-0011 posible
  ("stage dev en develop; paridad de imagen/gates con prod, difieren tag+webhook+env").
