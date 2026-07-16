---
type: Prompt
title: "Prompt 57 — Worker puente de auth del CMS (Cloudflare Access → token de servicio)"
description: "Construye el Worker de SPEC-CMS-002: /auth valida el JWT de Cloudflare Access y devuelve a Sveltia el token de servicio por el handshake postMessage de Netlify/Decap, sin OAuth de GitHub. Token como secret. TDD. Deploy/Access/PAT = infra del humano (no ejecutar)."
tags: [prompt, cms, auth, cloudflare]
timestamp: 2026-07-11T10:30:00Z
---

# Prompt 57 — Worker puente de auth del CMS

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa **[SPEC-CMS-002](/specs/SPEC-CMS-002.md)**
> ([ADR-0017](/adr/0017-cms-client-agnostic-auth-cloudflare-access-bridge.md)). Construye un **Cloudflare Worker**
> nuevo; TDD. **No** despliega ni toca secretos.

Eres un implementador en `sg-webpage`. Lee **SPEC-CMS-002** y ADR-0017. El spike está validado: un PAT
fine-grained de servicio da lectura+escritura en Sveltia; el contrato del CMS es solo un handshake `postMessage`.

## Qué construir

Un Worker en **`workers/cms-auth/`** (proyecto propio: `wrangler.toml`, `package.json`, `src/index.ts`, tests).
Deploy **separado** del app Astro.

### 1. Endpoint `/auth` (RF-1) — handshake, sin OAuth de GitHub

GET `/auth` (y 404 en lo demás) devuelve el HTML de handshake de Netlify/Decap. Al recibir `authorizing:github`
del `window.opener`, responde:

```js
window.opener.postMessage('authorization:github:success:' + JSON.stringify({ provider: 'github', token }), origin)
```

donde `token` = el token de servicio (RF-3). **No** hay redirect a GitHub ni `/callback`. (Basa el HTML en el
`outputHTML` de `sveltia-cms-auth`: mismo formato de mensaje, estados `success`/`error`.)

### 2. Gate por Cloudflare Access (RF-2, INV-1) — lo crítico

**Antes** de emitir el token, valida la identidad de Access:

- Lee el header **`Cf-Access-Jwt-Assertion`** (JWT que Access inyecta). Verifica **firma** (RS256) contra los
  certs del team (`https://<TEAM>.cloudflareaccess.com/cdn-cgi/access/certs`, cacheables), **`aud`** = el AUD de
  la Access App, e `iss`/`exp`. Usa `jose` o Web Crypto (SubtleCrypto).
- JWT ausente/ inválido/ `aud` incorrecto → **HTML de error** (`authorization:github:error:…`), y **nunca** el
  token. `TEAM_DOMAIN` y `ACCESS_AUD` van como vars del Worker.

### 3. Allowlist de dominio (RF-4)

Valida `site_id`/origen contra `ALLOWED_DOMAINS` (`sg-webpage.solidgraph.dev`), como el relay original.

### 4. Token como secret (RF-3, INV-2)

`token = env.GITHUB_SERVICE_TOKEN` — **secret del Worker** (`wrangler secret put`), **nunca** en el repo ni en
`wrangler.toml`. En `wrangler.toml` deja solo vars no secretas (`TEAM_DOMAIN`, `ACCESS_AUD`, `ALLOWED_DOMAINS`)
con placeholders + comentarios.

## Tests (TDD)

Vitest (o el runner de Workers) etiquetados `[SPEC-CMS-002/RF-1..4, INV-1..2]`:

- JWT de Access **válido** (mockea la verificación / usa una llave de test) → respuesta 200 con el HTML de
  handshake que incluye el token. 
- JWT **ausente/ inválido/ aud incorrecto** → HTML de **error**, y el token **no** aparece en la respuesta (INV-1).
- `site_id` fuera de `ALLOWED_DOMAINS` → error, sin token.
- Rutas != `/auth` → 404.
- El token se lee de `env.GITHUB_SERVICE_TOKEN` (mock), no hardcodeado (INV-2).

## Deploy — preparar, NO ejecutar (infra del humano)

- `wrangler.toml` con `name`, `main`, vars placeholder; **sin** secretos. Documenta en un `README`/`DEPLOY.md`
  del Worker: `wrangler secret put GITHUB_SERVICE_TOKEN`, crear la **Access App** que cubra `/admin/*` **y** la
  ruta del Worker, y el PAT fine-grained de la cuenta de servicio. **No** hagas `wrangler deploy` ni toques
  Access/secretos — es del humano (ADR-0017 / runbook [cms-oauth-relay](/deploy/cms-oauth-relay.md)).
- La `config.yml` (`base_url` → este Worker) la aplica el **prompt 56** cuando el Worker esté desplegado.

## Verificación antes de "listo"

```
# en workers/cms-auth/
pnpm install && pnpm test && pnpm build   # o el equivalente del proyecto Worker
# en la raíz:
pnpm trace -- --check && pnpm okf:check
```

- Tests del Worker verdes; `/auth` no emite token sin JWT válido (INV-1). No se desplegó nada.
- Regenera `pnpm okf:index` (entran ADR-0017, SPEC-CMS-002, este prompt, el runbook).

## Git

Rama `feat/cms-auth-bridge` **desde `develop`**; Conventional Commit (`feat`, scope `cms`/`infra`), incluye
`docs/` + `workers/cms-auth/`. Al terminar y verde: **merge a `develop`**.

## Entregable

`workers/cms-auth/` con el Worker de SPEC-CMS-002: `/auth` con handshake + token de servicio, **gate por JWT de
Access** (sin JWT válido no hay token), allowlist de dominio, token como secret; tests TDD verdes; deploy
**preparado pero no ejecutado**. Reporta qué falta de infra (Access App + AUD, PAT de servicio + secret, deploy).
