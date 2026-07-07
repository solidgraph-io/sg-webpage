# Prompt 23 — Fix crítico: leer env en runtime con `astro:env` (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. **Prioritario: bloquea el deploy dev.**

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md` y las skills.
**Recuerda (AGENTS.md §4):** `docs/` se commitea. TDD vinculante.

## Bug (con evidencia)

El sitio lee variables de entorno de **dos formas incoherentes**, y ambas fallan con inyección en runtime:

- `apps/web/src/pages/index.astro:24` → `import.meta.env.TURNSTILE_SITE_KEY` (funciona en dev, pero
  `import.meta.env` de vars **no públicas se hornea en build** → vacío en el contenedor donde Dokploy
  inyecta en runtime).
- `apps/web/src/pages/api/lead.ts:67` → `createEmailAdapter(process.env)` → en `pnpm dev` Vite **no**
  vuelca `.env` a `process.env`, así que `LEAD_TO_EMAIL`/`RESEND_API_KEY` salen `undefined` →
  `500 [lead] delivery error: LEAD_TO_EMAIL env var is required`.

**Impacto:** el form da 500 en local, y en el stage dev (Drone construye sin las vars, Dokploy las
inyecta en runtime) el `TURNSTILE_SITE_KEY` saldría vacío y los leads romperían. Hay que leer en runtime.

## Objetivo — migrar a `astro:env` (Astro 5, ya en uso: `astro@^5.9.3`)

Define el esquema en `astro.config.ts` (`env.schema`, `envField`) y **lee desde `astro:env`**, para que
dev (`.env` en la raíz, respetando el `envDir` actual) y el contenedor (env de Dokploy en runtime)
funcionen igual.

### Esquema requerido

- `TURNSTILE_SITE_KEY` → `envField.string({ context: 'server', access: 'public', optional: true })`
  (se renderiza server-side en runtime; **no** debe inlinearse en build).
- `TURNSTILE_SECRET_KEY` → `context: 'server', access: 'secret', optional: true`.
- `RESEND_API_KEY` → `context: 'server', access: 'secret', optional: true`.
- `LEAD_TO_EMAIL` → `context: 'server', access: 'secret', optional: true`.
- `LEAD_FROM_EMAIL` → `context: 'server', access: 'secret', optional: true` (default `leads@solidgraph.io`).
- `LEAD_PROVIDER` → `context: 'server', access: 'secret', optional: true` (default `resend`).
- `PUBLIC_SITE_URL` → mantener como está (o `context: 'server', access: 'public'` si lo migras también,
  sin romper SEO).

### Cambios de lectura

- `index.astro`: `import { TURNSTILE_SITE_KEY } from 'astro:env/server'` en vez de `import.meta.env`.
- `lead.ts` + `lead-email-adapter.ts`: leer de `astro:env/server` (o pasar un objeto `env` construido
  desde `astro:env`) en vez de `process.env`. **Mantén** la firma inyectable del adaptador/endpoint para
  los tests (los tests siguen pasando un `env`/port mock; no rompas `handleLead(request, port?, verify?)`).
- Igual para `turnstile.ts` si lee el secret directamente.

## Reglas

- **TDD:** añade/ajusta tests citando la spec (p. ej. `[SPEC-FORM-001/RF-2]` para que el adaptador lea la
  config inyectada; y un test de que el endpoint responde 200 cuando la env está presente y 500 controlado
  cuando falta). No bajes cobertura.
- **Dev sin secretos sigue funcionando:** Turnstile se salta sin `TURNSTILE_SECRET_KEY` (comportamiento
  actual intacto). Con `.env` presente en la raíz, el form entrega por Resend en local.
- **Fidelidad:** no cambia el render por defecto → gate QA-001 verde.
- **SRP / sin secretos en el repo.** `.env.example` actualizado si hace falta (sin valores reales).
- **Git:** rama `fix/env-runtime-astro-env`; Conventional Commits, scope `form`/`config`; incluye `docs/`.

## Verificación antes de "listo"

- `pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check` verde (+ `test:e2e`).
- Prueba manual: con `.env` en la raíz (`LEAD_TO_EMAIL`, `RESEND_API_KEY`), `pnpm dev` → enviar el form →
  **200** y email entregado; sin esas vars → sigue el flujo controlado (no crash del server).

## Entregable

Todas las lecturas de env de runtime pasan por `astro:env`; el form entrega en local con `.env`; el
contenedor leerá las vars de Dokploy en runtime (sin hornearlas en build). Resume los archivos tocados y
confirma que el gate de fidelidad sigue verde. Nota: este fix **debe ir en `develop` antes** de validar el
stage dev (SPEC-DEPLOY-001).
