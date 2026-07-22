---
type: Spec
title: "SPEC-ANALYTICS-001 — Analítica first-party (Umami self-hosted): pageviews + eventos de conversión"
description: "Instrumentar el sitio con Umami self-hosted (cookieless, sin banner): tracker cargado por astro:env en runtime, pageviews automáticos y eventos declarativos de conversión (CTAs, envío de lead, plan de interés), sin regresar el perf 100 ni la fidelidad. EPIC-10."
tags: [analytics, perf, privacy]
timestamp: 2026-07-11T11:00:00Z
---

# SPEC-ANALYTICS-001 — Analítica first-party (Umami self-hosted)

- **ID:** SPEC-ANALYTICS-001
- **Estado:** Implemented <!-- Draft → Review → Approved → Implemented → Verified -->
  <!-- Nombres de evento (RF-3, prompt 58): cta_quote_hero (Nav + Hero "Get a Free
  Quote" + HowItWorks "Get Started", todos → #contact), cta_plans (HowItWorks
  "See Plans" → #plans), cta_plan_start (PlanCard "Get Started" por plan, con
  la propiedad `plan` = nombre del tier). Mapeo centralizado en
  apps/web/src/lib/analytics.ts. -->

- **Épica / Story:** EPIC-10 (Analítica first-party → Umami)
- **Capa atómica:** feature (instrumentación transversal)
- **Depende de:** [SPEC-FORM-002](/specs/SPEC-FORM-002.md) (éxito del lead), [SPEC-DS-001](/specs/SPEC-DS-001.md) (Button), [SPEC-CONTENT-001](/specs/SPEC-CONTENT-001.md) (CTAs del contenido), patrón `astro:env` de [SPEC-FORM-001](/specs/SPEC-FORM-001.md)/RF-7

## Contexto / problema

Falta la **analítica de conversión** (milestone M1). Decisión: **Umami self-hosted** — first-party, **cookieless**
(sin banner de consentimiento), datos propios. Hoy solo existe el beacon de **Cloudflare Web Analytics** (inyectado
por Cloudflare); se consolida en Umami (ver Fuera de alcance / infra). El reto: instrumentar **sin regresar** el
Lighthouse 100 ni la fidelidad (QA-001).

## Requisitos funcionales (testeables)

- **RF-1 (tracker first-party, por env, runtime)** — el script de Umami se sirve **desde el propio dominio** (no
  desde el host de Umami): `<script async defer src="/stats/script.js" data-website-id={ID} data-host-url="/stats">`.
  El `data-host-url="/stats"` hace que los beacons vayan a **`/stats/api/send`** (mismo origen), no a un tercero.
  `ANALYTICS_UMAMI_WEBSITE_ID` se lee vía **`astro:env`** (`context:'server', access:'secret'`, runtime). Carga
  **`async defer`**, **fuera del critical path**. Si el env **no** está → **no se inyecta nada** (no-op).
- **RF-5 (proxy SSR first-party)** — dos rutas del SSR (Astro node adapter) reenvían a la instancia Umami
  (`ANALYTICS_UMAMI_HOST`, env runtime/secret): **`GET /stats/script.js`** → devuelve el `script.js` de Umami
  (con su content-type + cache); **`POST /stats/api/send`** → reenvía el beacon a `<host>/api/send`
  **preservando la IP y el `User-Agent` del cliente** (`X-Forwarded-For`) para que Umami cuente bien. Sin
  `ANALYTICS_UMAMI_HOST` → las rutas son no-op (404) y no se rompe nada.
- **RF-2 (pageviews)** — con el tracker cargado, cada navegación (MPA Astro) registra un pageview automáticamente
  (comportamiento nativo de Umami); no requiere código extra.
- **RF-3 (eventos de conversión — declarativos)** — eventos clave del funnel vía **`data-umami-event`** (sin JS
  imperativo donde se pueda): CTAs primarios ("Get a Free Quote"/nav + hero, "See Our Plans", "Get Started" por
  plan), y **envío de lead exitoso** (estado `success` de [SPEC-FORM-002](/specs/SPEC-FORM-002.md)) con el `plan_interest`
  como propiedad. Nombres de evento estables y documentados.
- **RF-4 (privacy)** — cookieless; **sin banner de consentimiento**; **respeta Do Not Track**; **cero PII** en
  eventos (no email/nombre; el `plan_interest` es categórico). No rastrea el `/admin`.

## Requisitos no funcionales

- **RNF-1 (perf)** — el tracker es pequeño (~2 KB) y `async defer`, **no** render-blocking → **Lighthouse 100 se
  mantiene** en las cuatro categorías. Verificar en el preview de prod.
- **RNF-2 (fidelidad)** — no cambia el render → **QA-001 intacto** (el script no pinta nada).
- **RNF-3 (env/secrets)** — config por `astro:env` en runtime; **nada** hardcodeado (el website id no es secreto
  pero va por env para no hornearlo y permitir dev sin analítica).
- **RNF-4 (a11y)** — `data-umami-event` no altera semántica ni foco; sin impacto en la auditoría del sitio.

## Invariantes

- **INV-1** — la analítica es **aditiva**: el sitio funciona idéntico sin el env (no-op). Nunca bloquea render ni
  interacción.
- **INV-2** — cero PII en eventos; cookieless; DNT respetado (INV de privacidad).
- **INV-3** — `/admin` (CMS) queda **fuera** del tracking.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: sin env, no hay analítica
  Given el sitio construido sin ANALYTICS_UMAMI_* en runtime
  When se sirve una página
  Then no se inyecta el script de Umami y el sitio funciona igual (no-op)

Scenario: con env, pageview + script diferido
  Given ANALYTICS_UMAMI_SRC y _WEBSITE_ID presentes en runtime
  When se carga una página
  Then el script de Umami se incluye async/defer con el website id y registra el pageview

Scenario: evento de conversión en el lead
  Given el tracker cargado
  When el formulario llega al estado success (SPEC-FORM-002)
  Then se emite el evento de lead con plan_interest, sin PII

Scenario: perf y fidelidad intactos
  Given el tracker cargado
  When se audita el sitio
  Then Lighthouse sigue 100/100/100/100 y el gate de fidelidad QA-001 sigue verde
```

## Fuera de alcance

- **Dashboard/visualización** de métricas (se ven en el panel de Umami; un dashboard propio sería otra spec).
- **Deploy de Umami** (infra): contenedor Umami + Postgres en Dokploy; crear el "website" → website id. Es
  **infra del humano** (ver abajo). La app degrada a no-op hasta que exista.
- **Cloudflare Web Analytics**: al consolidar en Umami, el beacon de CF se **desactiva en el dashboard de
  Cloudflare** (ops) para no duplicar ni sumar peso.

## Infra (humano)

- Desplegar **Umami** (imagen `ghcr.io/umami-software/umami` + Postgres) en Dokploy; crear el website del sitio →
  copiar el **`ANALYTICS_UMAMI_WEBSITE_ID`**. Poner como env de runtime (Dokploy, no en el repo):
  **`ANALYTICS_UMAMI_HOST`** (URL **interna** de la instancia Umami, adonde el proxy SSR reenvía) y
  **`ANALYTICS_UMAMI_WEBSITE_ID`**. El sitio expone todo bajo su propio dominio (`/stats/*`) → **first-party**.
- Umami hashea IP+UA a diario (no guarda IP cruda); el proxy solo **reenvía** la IP/UA para ese hash.

## Trazabilidad

- **Tests:** `[SPEC-ANALYTICS-001/RF-1..5]`, `[.../RNF-1..4]`, `[.../INV-1..3]` — sin env → no-op (no script, y
  las rutas `/stats/*` 404); con env → `<script async defer src="/stats/script.js" data-website-id … data-host-url="/stats">`
  (**mismo origen**); las rutas `/stats/script.js` (GET) y `/stats/api/send` (POST) reenvían a
  `ANALYTICS_UMAMI_HOST` preservando IP/UA (mock del upstream); `data-umami-event` en los CTAs y `umami.track`
  en el éxito del lead (sin PII); `/admin` sin tracker; estado por defecto sin cambios (QA-001).
- **PRs:** — · **ADR:** — (posible ADR breve: "analítica first-party Umami self-hosted; consolidar sobre CF").
