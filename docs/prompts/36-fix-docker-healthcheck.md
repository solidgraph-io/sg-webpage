---
type: Prompt
title: "Prompt 36 — Fix HEALTHCHECK del Dockerfile (Swarm mata el contenedor por unhealthy)"
description: "Fix HEALTHCHECK del Dockerfile (Swarm mata el contenedor por unhealthy)"
tags: [prompt]
timestamp: 2026-07-09T17:50:15-04:00
---

# Prompt 36 — Fix HEALTHCHECK del Dockerfile (Swarm mata el contenedor por unhealthy)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Bloquea el deploy dev (contenedor unhealthy).

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4 y `SPEC-INFRA-001`/`SPEC-DEPLOY-001`.
Cambio en `apps/web/Dockerfile` (+ test/spec si aplica).

## Bug (con evidencia)
En el deploy (Dokploy sobre Docker Swarm) el servicio queda **0/1**: las tasks mueren con
`task: non-zero exit (137): dockerexec: unhealthy container`. La app **sí arranca**
(`[@astrojs/node] Server listening on 0.0.0.0:4321`), pero el **HEALTHCHECK falla** → Swarm mata (SIGKILL)
y recrea en bucle → sin backend sano → Traefik 502.

El healthcheck actual: `wget -qO- http://**localhost**:4321/`.

## Causa raíz CONFIRMADA (diagnóstico del humano)
Se corrió la imagen y `wget -S http://**127.0.0.1**:4321/` devuelve **`HTTP/1.1 200 OK`, EXIT 0** — la app
está sana. El problema es que el healthcheck usa **`localhost`**, que en Alpine resuelve primero a
**IPv6 `::1`**, y el server Astro bindea solo **IPv4 `0.0.0.0`** → el check contra `::1:4321` da
connection refused → unhealthy → Swarm mata (137). **Con `127.0.0.1` (IPv4 explícito) funciona.** No hay
problema de app; el único cambio necesario es `localhost` → `127.0.0.1` en el healthcheck.

## Fix del HEALTHCHECK (robusto)
Reemplaza el `HEALTHCHECK` de `apps/web/Dockerfile` por uno que:
1. Use **`127.0.0.1`** (no `localhost`).
2. Use el **binario `node`** (garantizado en la imagen) en vez de `wget` (evita quirks de busybox):
   ```dockerfile
   HEALTHCHECK --interval=15s --timeout=10s --start-period=45s --retries=5 \
     CMD node -e "fetch('http://127.0.0.1:4321/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
   ```
   (Node 22 trae `fetch` global.) `start-period=45s` + `retries=5` dan margen de arranque.
3. Verifica que el `USER node` puede ejecutar ese node -e (sí puede; es el mismo binario del CMD).

## Reglas
- **No** quites el healthcheck (queremos que Swarm sepa cuándo la app está sana); hazlo **fiable**.
- Si un test valida el contenido del Dockerfile (p. ej. `infra.test.ts` que asegure `HEALTHCHECK`),
  actualízalo para reflejar el nuevo comando (coherencia test↔config).
- Documenta el porqué en un comentario del Dockerfile.

## Verificación
- Local, en el contenedor: `docker build -t sgtest apps/web` (o el contexto correcto), `docker run` y
  confirma que `docker inspect --format '{{.State.Health.Status}}'` llega a **healthy**.
- `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` verde.

## Git (ciclo de vida — AGENTS.md §4)
Rama `fix/docker-healthcheck` **desde `develop`**; Conventional Commit (`fix`/`ci`, scope `infra`), incluye
`docs/`. `pnpm exec prettier --write .` (solo código) antes de commitear. Al terminar y verde:
**merge a `develop` y borra la rama**.

## Entregable
HEALTHCHECK fiable (node fetch a 127.0.0.1, start-period holgado); el contenedor llega a `healthy` en
Swarm; el servicio queda `1/1` y el sitio sirve. Si el diagnóstico mostró 5xx, reporta y arregla la causa
de app (sessions/dir) además del check. Reporta archivos tocados.
