---
type: Prompt
title: "Prompt 56 — CMS RF-6: apuntar Sveltia al relay OAuth (base_url) + publicar main"
description: "Fija backend.base_url del config.yml de Sveltia a la URL del Worker puente (modelo Cloudflare Access + puente, ADR-0017), asegura main pusheada, y actualiza el estado de RF-6. Depende de que el humano haya hecho el spike + Access + puente (ver runbook cms-oauth-relay). Implementa SPEC-CMS-001/RF-6."
tags: [prompt, cms, oauth]
timestamp: 2026-07-11T09:10:00Z
---

# Prompt 56 — CMS RF-6: base_url del relay OAuth

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`, **después** de montar el modelo Access + puente
> ([ADR-0017](/adr/0017-cms-client-agnostic-auth-cloudflare-access-bridge.md), runbook
> [cms-oauth-relay](/deploy/cms-oauth-relay.md)). Implementa **[SPEC-CMS-001](/specs/SPEC-CMS-001.md)/RF-6**.
> Cambio de **una línea de config** + git.

## Precondición (bloqueante)

El **spike** (contrato de token de Sveltia) está resuelto, **Cloudflare Access** cubre `/admin`, y el **Worker
puente** está desplegado con la identidad de servicio (secretos en el Worker). Su URL es conocida (p. ej.
`https://cms-auth.<subdominio>.workers.dev`). **Si no la tienes, detente y pídela** — no inventes la URL.

## Cambio

En `apps/web/public/admin/config.yml`, reemplaza el placeholder de `backend.base_url` por la **URL real del
Worker** (conserva `name: github`, `repo: solidgraph-io/sg-webpage`, `branch: main`, `auth_endpoint: auth`):

```yaml
  base_url: https://<URL-REAL-DEL-WORKER>
```

- **No** toques las colecciones ni los campos (paridad con los schemas intacta — INV-2).
- Verifica que `apps/web/src/content/` (contenido) está en `main` y que **`main` está pusheada** a `origin`
  (`git@github.com:solidgraph-io/sg-webpage.git`). Si `main` no tiene upstream/está atrás, publícala.

## Coherencia de rama (verifica, reporta)

El CMS commitea a `main`. Confirma que `sg-webpage.solidgraph.dev` **se construye desde `main`**; si ese dominio
despliega desde otra rama, **repórtalo** (es decisión de deploy del humano — no lo cambies a ciegas).

## Tests / estado

- Si hay un test que asevera el `config.yml` (`cms-001.test.ts`), ajústalo si fija el `base_url` (que no vuelva a
  aceptar el placeholder). Mantén su cita `[SPEC-CMS-001/RF-6]`.
- Marca **RF-6** como hecho en `SPEC-CMS-001` (y en el runbook) una vez verificado.

## Verificación

```
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check && pnpm okf:check
```

- Build local del sitio + `curl -sI` (o fetch) de `/admin/config.yml` en el preview: el `base_url` ya **no** es
  el placeholder.
- Verificación real end-to-end (login GitHub → editar → commit a `main`) la hace el humano en prod tras
  desplegar (Paso 4 del runbook).

## Git

Rama `feat/cms-oauth-base-url` **desde `develop`**; Conventional Commit (`feat`/`chore`, scope `cms`), incluye
`docs/` (runbook + esta actualización de estado). Regenera `pnpm okf:index` (el runbook `cms-oauth-relay` es un
concepto nuevo en `docs/deploy/`). Al terminar y verde: **merge a `develop`**; propaga a `main` según el flujo
(recuerda: el CMS necesita el `base_url` en la rama que sirve prod).

## Entregable

`config.yml` apuntando al relay real; `main` publicada con el contenido; RF-6 marcado; índices OKF coherentes.
Reporta la coherencia de rama y qué falta para el login en prod (Pasos 1–2 del runbook, si aún no).
