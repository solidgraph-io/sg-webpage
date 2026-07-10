---
type: Prompt
title: "Prompt 21 — Corregir la doc del `/admin` (Sveltia: proxy → File System Access) + tracking de `docs/`"
description: "Alinear toda la doc del /admin con docs/specs/SPEC-CMS-001.md (RF-5 ya corregido)."
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 21 — Corregir la doc del `/admin` (Sveltia: proxy → File System Access) + tracking de `docs/`

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md` y las skills.
Es una **corrección de documentación** (no toca render ni bundle): el flujo de edición local de
**Sveltia CMS** está mal documentado.

## Contexto (el error)

La doc actual del CMS dice usar `@sveltia/cms-proxy-server` + `local_backend`. **Eso es de Decap, no
de Sveltia.** Ese paquete **no existe** (`npm error 404`). Sveltia **no usa proxy**: `local_backend` se
**ignora** y en su lugar usa la **File System Access API** del navegador para leer/escribir el repo local.

## Objetivo

Alinear toda la doc del `/admin` con `docs/specs/SPEC-CMS-001.md` (RF-5 ya corregido). El flujo correcto:

> Editar en local **sin OAuth**: `pnpm dev` → abrir `http://localhost:4321/admin/index.html` en un
> navegador **Chromium** (Chrome/Edge/Brave; **no** Firefox/Safari) → pulsar **"Work with Local
> Repository"** → seleccionar la **raíz del repo** (la carpeta con `.git`). Sveltia escribe directo en
> `content/`. **Sin** `@sveltia/cms-proxy-server` ni `local_backend`.

## Pasos

1. **Busca** toda mención del proxy/local_backend en el repo:
   `git grep -n -i "cms-proxy-server\|local_backend\|proxy"` (revisa `apps/web/public/admin/config.yml`,
   cualquier `README`/`.md` del admin, comentarios, y scripts de `package.json`).
2. **Corrige** cada aparición:
   - En `config.yml`: elimina/renombra el comentario que refiere al proxy; deja el bloque `backend:`
     `{ name: github, repo: solidgraph-io/sg-webpage, branch: main }` intacto y el `base_url` del OAuth
     de producción como está (placeholder). No añadas `local_backend`.
   - En el/los README del admin: reemplaza los pasos del proxy por el flujo File System Access de arriba,
     con la advertencia **Chromium-only**.
   - Si hay un script npm que llama al proxy inexistente, elimínalo.
3. **Verifica** que ya no queda ninguna referencia: repite el `git grep` (debe salir vacío salvo, si acaso,
   una nota histórica intencional).
4. **No** cambies componentes, contenido ni estado por defecto del sitio → el gate de fidelidad
   (QA-001) debe seguir verde. Corre `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check`.

## Git

- Rama `fix/sveltia-local-docs`. Conventional Commit: `docs(cms): corrige flujo local de Sveltia (File System Access, no proxy)`, scope `docs`.
- **Recuerda (AGENTS.md §4):** `docs/` se commitea con el incremento (`git add docs/`). Incluye en el
  commit el `SPEC-CMS-001.md` ya corregido si aún no estuviera trackeado, y confirma que **toda** la
  carpeta `docs/` está bajo seguimiento (no gitignored).

## Entregable

La doc del `/admin` describe el flujo real (Chromium + "Work with Local Repository", sin proxy);
cero referencias a `@sveltia/cms-proxy-server`/`local_backend`; `docs/` trackeado; gates verdes.
Al terminar, resume qué archivos cambiaste y confirma que el OAuth de producción sigue pendiente del
humano (GitHub OAuth App + Worker `sveltia-cms-auth` + `base_url`).
