---
type: Runbook
title: "CMS Sveltia — auth de producción agnóstica al cliente (Cloudflare Access + Worker puente)"
description: "Activar el login de producción del CMS (SPEC-CMS-001/RF-6, ADR-0017): Cloudflare Access delante de /admin (login sin GitHub) + un Worker puente que entrega a Sveltia el token de una identidad de servicio para commitear. Incluye el spike de validación del contrato de token de Sveltia. Infra/secretos del humano."
tags: [deploy, cms, auth, cloudflare]
timestamp: 2026-07-11T09:50:00Z
---

# Runbook — Auth de producción del CMS (Cloudflare Access + puente)

## Contexto

El CMS ([SPEC-CMS-001](/specs/SPEC-CMS-001.md)) está montado y la edición local (File System Access API,
Chromium) funciona. Falta el **login de producción agnóstico al cliente** — el cliente no técnico no usa GitHub.
Modelo elegido en **[ADR-0017](/adr/0017-cms-client-agnostic-auth-cloudflare-access-bridge.md)**: **Cloudflare
Access** delante de `/admin` + un **Worker puente** que da a Sveltia el token de una **identidad de servicio**.
Todo esto es **infra/secretos del humano**; el repo solo cambia el `base_url`.

## Paso 0 — Spike de validación (hacer primero, de barato a caro)

**Hallazgo de la doc de Sveltia:** existe el **"access token method"** → Sveltia acepta un **token de acceso de
GitHub plano**. Por tanto un **PAT fine-grained de una cuenta máquina** es credencial válida (no hace falta App
ni token de usuario especial). El `sveltia-cms-auth` (relay) solo **devuelve un token al CMS** por el contrato
`postMessage` de Netlify/Decap (`authorization:github:success:<token>`). Nuestro puente **replica ese contrato**
devolviendo el PAT de la cuenta máquina tras validar Access.

Pasos (haz el **(b) primero** — valida sin construir nada):

- **(a) Credencial:** cuenta máquina `solidgraph-cms-bot` (colaboradora del repo) + **PAT fine-grained** con
  `Contents: Read and write` + `Metadata: read` **solo** en `solidgraph-io/sg-webpage`.
- **(b) Validación barata (~5 min, sin infra):** en `/admin`, usar el **access token method** de Sveltia (pegar
  token) con ese PAT → ¿carga colecciones y **commitea**? Si sí, la arquitectura queda validada; el resto es
  automatizar la entrega del token.
- **(c) Contrato:** leer el fuente de `sveltia-cms-auth` (minúsculo) para el mensaje exacto de éxito que el
  puente debe replicar.
- **(d) Prototipo:** Worker mínimo detrás de Access que, en el endpoint de auth, devuelve el PAT por ese
  `postMessage`. `config.yml` de prueba → `base_url` al Worker → login automático tras Access + commit real.

> **Seguridad:** el token va al **navegador** de cada editor (el SPA lo guarda). Por eso el PAT es fine-grained,
> `Contents` sobre **un solo repo**, con rotación. Access define quién puede pedirlo.
> **PKCE (futuro):** GitHub añadirá PKCE y eso deprecará el relay, pero sigue siendo login *por-usuario-de-GitHub*
> → no resuelve el requisito agnóstico; el puente + Access se mantiene.

## Paso 1 — Cloudflare Access sobre `/admin` (login del cliente)

En Cloudflare **Zero Trust** (free ≤ 50 usuarios):

1. Añade una **Access Application** (self-hosted) cubriendo `https://sg-webpage.solidgraph.dev/admin/*` **y** el
   endpoint del Worker puente (Paso 2).
2. **Método de login** amigable, sin GitHub: **One-time PIN por email**, Google, o magic link (el que prefieras).
3. **Policy:** allow por email(s) del/los editor(es) del cliente (o un dominio). Esto define quién puede editar.

## Paso 2 — Identidad de servicio + Worker puente (secretos del humano)

1. **Identidad de servicio** (según el spike): una cuenta máquina `solidgraph-cms-bot` **colaboradora** del repo
   `solidgraph-io/sg-webpage`, **o** una **GitHub App** instalada solo en ese repo. Genera su credencial.
2. **Worker puente** (Cloudflare Worker): en el endpoint de auth
   - **valida el JWT de Access** (`CF-Access-Jwt-Assertion`, contra las claves públicas de tu equipo de Access),
   - **entrega a Sveltia el token de la identidad de servicio** con el contrato que espera (del Paso 0),
   - opcional: incrusta el **email del editor** (del JWT) para la atribución en el commit.
   Credenciales (`GITHUB_*` de la identidad de servicio) como **secretos del Worker** (`wrangler secret put`),
   **nunca en el repo**. Preferible **token efímero** por sesión, no uno duradero en el navegador.
3. Anota la URL del Worker (p. ej. `https://cms-auth.<subdominio>.workers.dev`).

## Paso 3 — Apuntar el CMS al puente (única línea en el repo)

En `apps/web/public/admin/config.yml`, `backend.base_url` → la URL del **Worker puente** (mantén
`auth_endpoint`). Lo aplica el **prompt 56**. Commit + push de `main`; el pipeline reconstruye `/admin`.

## Paso 4 — Verificación (end-to-end)

1. `sg-webpage.solidgraph.dev/admin/` → **Cloudflare Access** pide el login (email/Google), **sin** GitHub.
2. Tras pasar Access → Sveltia carga ya "logueado" (token de servicio vía puente) y muestra las colecciones.
3. Editar + **Save** → commit a `main` (autor = identidad de servicio; email del editor en el mensaje).
4. El push dispara el pipeline (build fail-fast valida contra los schemas Zod — INV-1); el cambio aparece tras
   el rebuild.

## Coherencia de rama (verificar)

El CMS commitea a `main`. Confirma que `sg-webpage.solidgraph.dev` **se construye desde `main`**; si despliega
desde otra rama, alinéalo (o los editores guardan sin ver el cambio).

## Notas de seguridad (RNF-2)

- Access define **quién** llega al CMS; el puente **solo** entrega token si el JWT de Access es válido.
- Token de servicio **repo-scoped mínimo**, preferible efímero; secretos solo en el Worker.
- Atribución compartida (identidad de servicio) + email del editor en el commit (ADR-0017).

## Estado

- RF-1..RF-5: hechos. **RF-6: pendiente** — Paso 0 (spike) + Pasos 1–2 (tú) → Paso 3 (prompt 56) → Paso 4
  (verificación conjunta). El OAuth por-editor original queda **descartado** (ADR-0017).
