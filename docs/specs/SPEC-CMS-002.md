---
type: Spec
title: "SPEC-CMS-002 — Puente de auth del CMS (Cloudflare Access → token de servicio) sin OAuth de GitHub"
description: "Worker minúsculo que, tras validar Cloudflare Access, entrega a Sveltia el token de una cuenta de servicio por el handshake postMessage de Netlify/Decap, sin el roundtrip de OAuth de GitHub. Hace el CMS agnóstico al cliente (ADR-0017). Spike validado."
tags: [cms, auth, cloudflare]
timestamp: 2026-07-11T10:20:00Z
---

# SPEC-CMS-002 — Puente de auth del CMS (Cloudflare Access → token de servicio)

- **ID:** SPEC-CMS-002
- **Estado:** Approved <!-- Draft → Review → Approved → Implemented → Verified -->
- **Épica / Story:** EPIC-05 / STORY-052 (CMS auth agnóstica)
- **Capa atómica:** infra (Cloudflare Worker) + config del CMS
- **Depende de:** [SPEC-CMS-001](/specs/SPEC-CMS-001.md) (CMS Sveltia), [ADR-0017](/adr/0017-cms-client-agnostic-auth-cloudflare-access-bridge.md)

## Contexto / problema

El CMS ([SPEC-CMS-001](/specs/SPEC-CMS-001.md)) es git-based y su RF-6 necesita auth **agnóstica al cliente** (el
cliente no técnico no tiene GitHub). Decisión: [ADR-0017](/adr/0017-cms-client-agnostic-auth-cloudflare-access-bridge.md)
— **Cloudflare Access** (login amigable) + un **Worker puente** que entrega a Sveltia el token de una cuenta de
servicio. **Spike validado:** un PAT fine-grained de servicio da lectura+escritura en Sveltia; y el contrato del
relay (`sveltia-cms-auth`) es solo un handshake `postMessage`, así que el puente **no** necesita el OAuth de
GitHub.

## Requisitos funcionales (testeables)

- **RF-1 (endpoint `/auth`)** — GET `/auth` devuelve el **HTML de handshake** de Netlify/Decap: al recibir
  `authorizing:github` del `window.opener`, responde
  `postMessage('authorization:github:success:' + JSON.stringify({ provider:'github', token }), origin)`. **No**
  redirige a GitHub ni usa `/callback`. Otras rutas → 404.
- **RF-2 (gate por Cloudflare Access)** — el Worker **solo** entrega el token si la petición trae una identidad
  de Access válida: verifica el JWT `Cf-Access-Jwt-Assertion` contra los certs del team
  (`https://<team>.cloudflareaccess.com/cdn-cgi/access/certs`) y el `aud` de la Access App. Sin JWT válido →
  HTML de error (contrato Decap: `authorization:github:error:…`), **nunca** el token.
- **RF-3 (token como secreto)** — el token de servicio es un **secret del Worker** (`GITHUB_SERVICE_TOKEN`),
  **nunca** en el repo. Es un **PAT fine-grained** con `Contents: read/write` sobre `solidgraph-io/sg-webpage`.
- **RF-4 (allowlist de dominio)** — valida el `site_id`/origen contra `ALLOWED_DOMAINS`
  (`sg-webpage.solidgraph.dev`), como el relay original.
- **RF-5 (config del CMS)** — `apps/web/public/admin/config.yml`: `backend.base_url` → la URL del Worker;
  `name: github`, `repo: solidgraph-io/sg-webpage`, `branch: main`. (Lo aplica el prompt de config; ver runbook.)
- **RF-6 (atribución — opcional/stretch)** — incrustar el **email del editor** (del JWT de Access) en la
  identidad/mensaje del commit si Sveltia lo permite; si no, los commits van a la cuenta de servicio y el email
  del editor se registra aparte. No bloquea.

## Requisitos no funcionales

- **RNF-1 (seguridad)** — el token llega al **navegador** del editor (inevitable con el modelo git-based del
  cliente). Mitigación: PAT **fine-grained** (`Contents`, un solo repo), rotación, y **Access como gate** (define
  quién puede pedirlo). El secret del token vive solo en el Worker.
- **RNF-2 (aislamiento)** — el Worker es **independiente** del sitio: no añade peso ni JS a las páginas del sitio
  → **QA-001 (fidelidad) intacto**. Deploy separado del app Astro.
- **RNF-3 (agnóstico)** — el cliente entra solo con Access (email/Google); **cero GitHub** de su lado.

## Invariantes

- **INV-1** — el token **nunca** se devuelve sin un JWT de Access válido (RF-2).
- **INV-2** — cero secretos en el repo; el token es secret del Worker (RF-3).
- **INV-3** — el contenido editado sigue validando contra los schemas Zod (fail-fast en build, de SPEC-CMS-001/INV-1).

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: editor autenticado obtiene el token
  Given una petición GET /auth con un JWT de Cloudflare Access válido para la App
  When el Worker responde
  Then devuelve el HTML de handshake que postMessea authorization:github:success con el token de servicio

Scenario: sin Access no hay token
  Given una petición a /auth sin JWT de Access (o inválido/aud incorrecto)
  When el Worker la procesa
  Then responde un error (authorization:github:error) y NO expone el token

Scenario: dominio no permitido
  Given un site_id fuera de ALLOWED_DOMAINS
  When llega a /auth
  Then responde error de dominio, sin token

Scenario: login del cliente sin GitHub
  Given el cliente abre /admin y pasa Cloudflare Access (email/Google)
  When Sveltia llama al /auth del puente
  Then queda logueado como la cuenta de servicio y puede editar/commitear a main
```

## Fuera de alcance

- Vista de login a medida con marca (capa posterior sobre Access).
- Roles/permisos por sección (señal de pasar al tier con BD).
- El roundtrip de OAuth de GitHub (no se usa).

## Deploy / host

- **Worker** co-locado en el repo (p. ej. `workers/cms-auth/` con su `wrangler.toml`), **deploy separado** del
  app Astro. **Cloudflare Access** App cubre `/admin/*` (del sitio) **y** la ruta del Worker.
- **Infra del humano:** cuenta de servicio + PAT fine-grained (secret del Worker), Access App + política, deploy
  del Worker. Ver runbook [cms-oauth-relay](/deploy/cms-oauth-relay.md).

## Trazabilidad

- **Tests:** `[SPEC-CMS-002/RF-1..4]`, `[.../RNF-1..3]`, `[.../INV-1..3]` — `/auth` devuelve el HTML/handshake con
  token cuando el JWT es válido; sin/JWT inválido → error sin token; allowlist de dominio; 404 otras rutas; el
  token sale de env/secret (mock en test).
- **PRs:** — · **ADR:** [ADR-0017](/adr/0017-cms-client-agnostic-auth-cloudflare-access-bridge.md).
