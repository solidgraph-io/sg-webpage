# DEPLOY — Worker `sg-cms-auth` (infra del humano)

El Worker está **listo pero sin desplegar** (SPEC-CMS-002; decisión de CLAUDE.md: registry/CI/
deploy = humano). Modelo completo en [ADR-0017](../../docs/adr/0017-cms-client-agnostic-auth-cloudflare-access-bridge.md)
y el runbook [cms-oauth-relay](../../docs/deploy/cms-oauth-relay.md).

## Qué hace

`GET /auth` → valida el JWT de **Cloudflare Access** (`Cf-Access-Jwt-Assertion`: firma RS256
contra `TEAM_DOMAIN/cdn-cgi/access/certs`, `aud` = `ACCESS_AUD`, `iss`, `exp`) y el `site_id`
contra `ALLOWED_DOMAINS`; si todo pasa, entrega `GITHUB_SERVICE_TOKEN` a Sveltia por el
handshake `postMessage` de Netlify/Decap. Sin JWT válido **nunca** sale el token (INV-1).
No hay OAuth de GitHub.

## Pasos (una sola vez)

1. **Cuenta de servicio + PAT.** En la cuenta bot (p. ej. `solidgraph-cms-bot`, colaboradora del
   repo): PAT **fine-grained**, `Contents: read/write`, **solo** `solidgraph-io/sg-webpage`,
   expiración con recordatorio de rotación.
2. **Vars.** Edita `wrangler.toml`: `TEAM_DOMAIN` (tu team de Zero Trust) y `ALLOWED_DOMAINS`.
   El `ACCESS_AUD` sale del paso 4 — puedes desplegar con el placeholder y actualizar después.
3. **Secret + deploy** (desde `workers/cms-auth/`):
   ```sh
   npx wrangler secret put GITHUB_SERVICE_TOKEN   # pega el PAT (nunca al repo)
   npx wrangler deploy
   ```
4. **Access App** (Zero Trust → Access → Applications): una app **self-hosted** que cubra
   `sg-webpage.solidgraph.dev/admin*` **y** el dominio del Worker (`sg-cms-auth.<subdominio>.workers.dev`
   o la ruta custom), con la política de login del cliente (email OTP / Google). Copia su **AUD**
   → `ACCESS_AUD` en `wrangler.toml` → `npx wrangler deploy` de nuevo.
5. **Conectar el CMS** — lo hace el prompt 56: `backend.base_url` de
   `apps/web/public/admin/config.yml` → la URL del Worker (+ `auth_endpoint: auth`).

## Verificación

- `curl -s https://<worker>/auth?site_id=sg-webpage.solidgraph.dev` (sin JWT) → HTML con
  `authorization:github:error:` y **sin** token.
- Navegador → `https://sg-webpage.solidgraph.dev/admin` → challenge de Access → Sveltia carga
  colecciones y Save/Publish commitea a `main` como la cuenta de servicio (spike de ADR-0017).

## Rotación / revocación

Regenerar el PAT → `npx wrangler secret put GITHUB_SERVICE_TOKEN` → listo (el token viejo se
revoca en GitHub). Los editores no notan nada (re-login vía Access).
