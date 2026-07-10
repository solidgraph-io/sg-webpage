---
type: Spec
title: "SPEC-CMS-001 — CMS Sveltia (`/admin`, git-based) sobre las colecciones CMS-ready"
description: "El contenido ya vive en Content Collections editables por archivo (SPEC-CONTENT-001)."
tags: [cms]
timestamp: 2026-07-07T12:44:46-04:00
---

# SPEC-CMS-001 — CMS Sveltia (`/admin`, git-based) sobre las colecciones CMS-ready

- **ID:** SPEC-CMS-001
- **Estado:** Implemented
- **Épica / Story:** EPIC-05 / STORY-051 (CMS)
- **Capa atómica:** CMS / admin (estático)
- **Depende de:** SPEC-CONTENT-001 (colecciones `settings/site` + `pages/home`)

## Contexto / problema

El contenido ya vive en Content Collections editables por archivo (SPEC-CONTENT-001). Falta el
**panel de edición**: **Sveltia CMS** (git-based, sucesor de Decap/Netlify CMS) servido como
**app estática en `/admin`**, que mapea esas colecciones a un editor y **commitea al repo** (push →
CI/build). No hay servidor de CMS 24/7 (coherente con el tier básico de la fábrica, `../agency-structure/Agency Structure/ARQUITECTURA.md`).

## Requisitos funcionales (testeables)

- **RF-1 (admin estático)** — Sveltia servido en `/admin` de `apps/web`: `public/admin/index.html` carga Sveltia + su `config.yml`. No añade JS al sitio (ruta aparte).
- **RF-2 (config → colecciones)** — `config.yml` con `backend: { name: github, repo: solidgraph-io/sg-webpage, branch: main }` + `media_folder`/`public_folder` para imágenes, y **file collections** que mapean 1:1 a los archivos de `SPEC-CONTENT-001`: `settings/site` y `pages/home` (con sus campos/widgets).
- **RF-3 (paridad de campos)** — los campos del `config.yml` **reflejan los schemas Zod** de `SPEC-CONTENT-001` (mismos campos/estructura). Editar y guardar produce contenido **válido** (el build fail-fast lo verifica). _(Recomendado: un test de paridad config↔schema, o al menos un smoke que valide el contenido de ejemplo.)_
- **RF-4 (flujo git-based)** — guardar en Sveltia **commitea al repo** (rama configurable) vía la API de Git; el push dispara el pipeline (DroneCI→build). Documentado.
- **RF-5 (dev sin OAuth — File System Access API)** — Sveltia **NO usa proxy** (a diferencia de Decap; `local_backend` se ignora). Para editar en local sin OAuth: `pnpm dev` + abrir `http://localhost:4321/admin/index.html` en **Chromium** (Chrome/Edge/Brave), pulsar **"Work with Local Repository"** y seleccionar la raíz del repo (con `.git`). Escribe directo en `content/`. Documentar así (sin `@sveltia/cms-proxy-server`, que no existe).
- **RF-6 (auth producción)** — login vía **OAuth del host Git** (GitHub/GitLab/Gitea) con acceso solo al repo. Documentar el setup (OAuth App / relay); **requiere secretos y decisión humana** (ver "Detente").

## Requisitos no funcionales

- **RNF-1 (perf/fidelidad)** — `/admin` es una ruta separada: **no** añade peso al sitio ni altera su render → el **gate de fidelidad (QA-001) no se ve afectado**.
- **RNF-2 (seguridad)** — OAuth con scope mínimo (solo el repo); sin secretos en el repo (van en el host/relay); commits del CMS firmados/atribuibles.
- **RNF-3 (a11y)** — el admin usa la a11y propia de Sveltia; no es parte de la auditoría del sitio.

## Invariantes

- **INV-1** — el contenido editado por Sveltia **sigue validando** contra los schemas Zod (fail-fast en build).
- **INV-2 (paridad)** — el `config.yml` y los schemas Zod describen la **misma** forma de datos; su divergencia es el riesgo nº1 (mitigar con test/CI).
- **INV-3** — `/admin` no impacta el bundle ni el render del sitio.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: editar en local sin OAuth (File System Access API)
  Given pnpm dev corriendo y /admin/index.html abierto en Chromium
  When se pulsa "Work with Local Repository", se elige la raíz del repo y se edita settings/site o pages/home
  Then el cambio se guarda en el archivo de contenido y el sitio lo refleja tras rebuild

Scenario: contenido editado sigue válido
  Given un cambio guardado por Sveltia
  When se construye el sitio
  Then valida contra los schemas Zod (fail-fast si el CMS produjo algo inválido)

Scenario: /admin no afecta el sitio
  Given la ruta /admin
  When se analiza el bundle del sitio
  Then no añade JS a las páginas del sitio y el gate de fidelidad sigue verde
```

## Fuera de alcance

- Roles/multi-usuario, flujos editoriales avanzados, multi-página (solo `home` + `site` por ahora).
- Deploy a producción (activar el pipeline) → decisión humana aparte.

## Host Git y auth

- **Host = GitHub, repo `solidgraph-io/sg-webpage`, rama `main`.** El `backend` de Sveltia es `github`.
- **Auth de producción:** login con **GitHub OAuth App** (o GitHub App). Sveltia con backend `github` sobre github.com necesita un **OAuth relay** (p. ej. Cloudflare Worker `sveltia-cms-auth`, o equivalente) que intercambie el code por token — **`client_id`/`client_secret` son secretos** (van en el Worker/relay, **no** en el repo). Documentar el setup del relay.
- **Detente y pide al humano:** las **credenciales de la OAuth App de GitHub** (client id/secret) y la URL del relay. Hasta tenerlas, el flujo local (File System Access API, Chromium) permite editar sin OAuth, y el OAuth queda documentado/parametrizado.

## Trazabilidad

- **Tests:** `[SPEC-CMS-001/RF-1..6]`, `[.../RNF-1..3]`, `[.../INV-1..3]` — presencia/estructura del `config.yml`, paridad config↔schema (o smoke de validez), `/admin` sin impacto en el bundle del sitio, gate de fidelidad intacto.
- **PRs:** — · **ADR:** ADR-0009 posible ("Sveltia CMS git-based sobre Content Collections; sin servidor").
