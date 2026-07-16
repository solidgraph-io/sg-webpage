---
type: ADR
title: "ADR-0017 — Auth del CMS agnóstica al cliente: Cloudflare Access + puente a identidad de servicio"
description: "El CMS git-based (Sveltia) ata cada commit a una identidad de git, inviable para un cliente no técnico sin GitHub. Se antepone Cloudflare Access (login amigable, sin GitHub) y un Worker puente que entrega a Sveltia el token de una identidad de servicio para commitear. Reemplaza el OAuth por-editor de SPEC-CMS-001/RF-6."
tags: [adr, cms, auth, cloudflare]
timestamp: 2026-07-11T09:40:00Z
---

# ADR-0017 — Auth del CMS agnóstica al cliente (Cloudflare Access + puente)

- **Estado:** Accepted (2026-07-15) — **spike validado**: un PAT fine-grained de cuenta de servicio da
  **lectura + escritura** en Sveltia (colecciones cargan; Save/Publish commitea a `main`). Contrato del puente
  confirmado (abajo).
- **Contexto:** CMS / autenticación / experiencia del cliente
- **Relacionado:** [SPEC-CMS-001](/specs/SPEC-CMS-001.md) (CMS Sveltia), runbook
  [cms-oauth-relay](/deploy/cms-oauth-relay.md), `../agency-structure/Agency Structure/ARQUITECTURA.md` (tiers)

## Contexto

El CMS ([SPEC-CMS-001](/specs/SPEC-CMS-001.md)) es **git-based** (Sveltia): cada guardado es un **commit**, y un
commit exige una **identidad de git**. El diseño original de RF-6 asumía **OAuth de GitHub por-editor** — cada
editor con su cuenta de GitHub. Eso sirve para un dev, pero el **cliente final es no técnico y no tiene (ni debe
tener) cuenta de GitHub ni entender qué es un repo**. Se necesita un login **agnóstico** que desacople la
identidad del cliente de la identidad de git.

## Decisión

Anteponer una **capa de autenticación propia con Cloudflare Access** y un **Worker puente** a la identidad de
git:

1. **Cloudflare Access (Zero Trust)** protege `/admin/*` y el endpoint de auth. El cliente entra con un método
   **amigable y sin GitHub** (código por email / Google / magic link — configurable). Zero Trust free cubre
   hasta 50 usuarios, coherente con el tier básico serverless.
2. **Worker puente:** valida la sesión de Access (JWT `CF-Access-Jwt-Assertion`) y **entrega a Sveltia el token
   de una identidad de servicio** (una cuenta bot dedicada / GitHub App con acceso **solo al repo**). El cliente,
   tras pasar el challenge de Access, queda "logueado" en el CMS **sin ver GitHub**.
3. **Atribución:** los commits los firma la identidad de servicio; el **email del editor** (del JWT de Access) se
   incrusta en el **mensaje del commit** para trazar quién editó. La autoría git por-editor no es nativa (se
   acepta; se puede añadir después).

Una **vista de login propia con marca SolidGraph** (opción evaluada) puede montarse **encima** de Access más
adelante sin cambiar esta arquitectura.

## Justificación

- **Agnóstico para el cliente:** cero GitHub, login que él entiende (email/Google). Es el requisito.
- **Sin servidor 24/7:** se mantiene el modelo serverless/git-based del tier básico; Access + Worker son
  managed. (Un CMS con BD tipo Strapi resolvería multi-usuario nativo pero **añade servidor** — se reserva para
  el tier avanzado, no para esto.)
- **Encaja con el stack:** ya usamos Cloudflare (DNS, cache rules, Turnstile). Access reutiliza esa base.
- **Incremental:** el login a medida es una capa opcional posterior sobre la misma base.

## Consecuencias

- **Reemplaza SPEC-CMS-001/RF-6** (OAuth por-editor) por este modelo. Hay que **revisar RF-6** en el spec.
- **Access:** app de Access sobre `/admin/*` (+ el endpoint del Worker), con la política de identidad elegida.
- **Identidad de servicio:** una cuenta máquina (`solidgraph-cms-bot`, colaboradora del repo) **o** una GitHub
  App instalada en el repo. Su credencial vive **solo en el Worker** (nunca en el repo/navegador de forma
  duradera; preferible token **efímero** por sesión).
- **Atribución compartida:** aceptada; email del editor en el mensaje del commit.
- **Runbook:** el de auth del CMS se reescribe a este modelo (Access + puente), sustituyendo el relay OAuth
  clásico.

### Spike — **validado** + contrato confirmado

**Resultado (2026-07):** con un **PAT fine-grained de cuenta de servicio** (`Contents: read/write` en
`solidgraph-io/sg-webpage`), Sveltia **carga las colecciones** (lectura) y **commitea a `main`** al
Save/Publish (escritura). La duda de "token de usuario vs App" queda descartada: un token plano basta (es el
"access token method" de Sveltia).

**Contrato del puente (del fuente de `sveltia-cms-auth`):** el relay solo devuelve un HTML que hace el handshake
`postMessage` de Netlify/Decap — el popup, al recibir `authorizing:github` del CMS, responde
`authorization:github:success:` + `JSON.stringify({ provider:'github', token })`. **Implicación:** el puente
**no necesita el roundtrip de OAuth de GitHub**; su endpoint `/auth`, tras validar Access, **devuelve directo ese
HTML con el PAT de servicio** (sin redirect ni `/callback`). Worker minúsculo. Especificado en
[SPEC-CMS-002](/specs/SPEC-CMS-002.md).

**Consecuencia de seguridad:** el token termina en el **navegador** de cada editor (el SPA lo guarda). Mitigar
con PAT **fine-grained** (`Contents`, un solo repo) + rotación; Access controla quién puede pedirlo. Fallback
siempre disponible: el modo local (File System Access API).

## Fuera de alcance

- Roles/multi-usuario con permisos por sección (si se necesita, es señal de pasar al tier con BD).
- La vista de login a medida (capa posterior sobre Access).

## Citations

Continúa [SPEC-CMS-001](/specs/SPEC-CMS-001.md); documentación de Cloudflare Access (Zero Trust) y del backend
GitHub de Sveltia CMS.
