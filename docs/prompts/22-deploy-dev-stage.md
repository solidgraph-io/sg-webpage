# Prompt 22 — Stage dev: push a `develop` + deploy continuo (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md` y las skills.
Implementa `docs/specs/SPEC-DEPLOY-001.md` (stage dev). **Recuerda (AGENTS.md §4):** `docs/` se commitea.

> **CI/CD:** esto toca el pipeline. Cambios **aditivos** (steps nuevos para `develop`); **no** alteres
> los steps de `main` (prod). Confirma con el humano antes de nada destructivo.

## Decisiones cerradas (NO preguntes)

- Stage dev = **`dev.solidgraph.dev`**.
- Leads **completos** en dev (Resend + Turnstile reales) — vía env de Dokploy, no repo.
- Prod (`main` → `solidgraph.io`) queda **intacto**.

## Paso 0 — Auditoría de git (imprescindible)

1. `git status`, `git branch -a`, `git log --oneline --all -20`, `git remote -v`.
2. Determina qué hay en `main` y qué ramas `feature/*` están **implementadas y verdes** pero sin integrar
   (esperadas: content, CMS, SEO, perf, a11y, `feature/SPEC-FORM-001-turnstile`, `fix/sveltia-local-docs`).
3. **Reporta el estado y tu plan de integración ANTES de mergear.** Si algo no está claro, detente.

## Paso 1 — Rama `develop` (RF-1)

- Crea/actualiza `develop` desde `main` e **integra** todas las ramas `Implemented` verdes (merge o
  rebase según AGENTS.md). Resuelve conflictos de forma conservadora.
- Corre los gates completos y verifica verde:
  `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` (+ `test:e2e` si aplica).

## Paso 2 — Pipeline dev (`.drone.yml`) (RF-2, RF-3, RF-4)

Añade **solo pasos nuevos** para `develop` (espeja los de `main`, cambiando tag y webhook):

- `build-push-web-dev` (`plugins/docker`): `when.branch: [develop]`, `event: [push]`,
  `depends_on: [build, perf-test]`. `repo: registry.solidgraph.dev/solidgraph-web`,
  `tags: [dev, ${DRONE_COMMIT_SHA}]` (**sin `latest`**), `dockerfile: apps/web/Dockerfile`,
  `username/password` desde `REGISTRY_USERNAME`/`REGISTRY_PASSWORD`.
- `trigger-dokploy-dev` (`curlimages/curl`): `when.branch: [develop]`, `event: [push]`,
  `depends_on: [build-push-web-dev]`, `POST` a `DOKPLOY_WEBHOOK_WEB_DEV` (secret nuevo).
- **No toques** `build-push-web` ni `trigger-dokploy` (siguen en `main`). Documenta el secret nuevo en la
  cabecera de `.drone.yml`.

## Paso 3 — Env por entorno + runbook (RF-5, RF-6)

- Asegura que el sitio lee la URL pública de `PUBLIC_SITE_URL` (dev = `https://dev.solidgraph.dev`).
- Actualiza `.env.example` si falta alguna var; **cero valores reales**.
- Crea `docs/deploy/dev-stage.md` (runbook): secretos Drone vs env Dokploy, DNS/Traefik para
  `dev.solidgraph.dev`, allowlist de Turnstile, y **verificación post-deploy** (home 200, `/admin`
  carga, `POST /api/lead` con token válido entrega email a `LEAD_TO_EMAIL`).

## Paso 4 — Push

- Rama `feature/SPEC-DEPLOY-001-dev-stage` con los cambios de pipeline/docs; PR → `develop` (Conventional
  Commits, scope `infra`/`ci`, incluye `docs/`). Al integrar en `develop`, el **push dispara el pipeline
  dev** (si el humano ya configuró el webhook/secreto; si no, el pipeline construye pero el trigger fallará
  suave — indícalo).

## Detente y pide al humano (no lo puede hacer Claude Code)

- **Drone:** añadir secret `DOKPLOY_WEBHOOK_WEB_DEV`.
- **Dokploy:** servicio `web-dev` (pull `…/solidgraph-web:dev`, dominio `dev.solidgraph.dev`, env de RF-5).
- **DNS/Cloudflare:** `dev.solidgraph.dev` → VPS (Traefik → :4321).
- **Turnstile:** allowlist `dev.solidgraph.dev`; keys. **Resend:** dominio verificado + API key + `LEAD_TO_EMAIL`.

## Entregable

`develop` integrada y verde; `.drone.yml` con deploy dev **aditivo** (prod intacto); runbook dev en
`docs/deploy/`. Al terminar: resume el estado de ramas, confirma que `main`/prod no cambió, y lista los
pasos de infra pendientes del humano para que el stage `dev.solidgraph.dev` quede en vivo.
