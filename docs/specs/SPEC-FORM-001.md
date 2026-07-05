# SPEC-FORM-001 — Captación de leads: `/api/lead` + `LeadPort` + anti-spam

- **ID:** SPEC-FORM-001
- **Estado:** Implemented
- **Épica / Story:** EPIC-06 / STORY-061 (leads)
- **Capa atómica:** feature (endpoint + form behavior)
- **Depende de:** SPEC-SEC-013 (UI del form), SPEC-CONTENT-001 (config del bloque contact), SPEC-DS-001 (Node adapter)

## Contexto / problema
La UI del formulario de contacto existe (SEC-013) pero es **inerte**. Falta el camino de envío: un
**endpoint de servidor** que valide y **entregue el lead** a un destino, con anti-spam. El destino se
abstrae tras un **`LeadPort`** (email por defecto; CRM/webhook intercambiables) para no acoplar el
endpoint a un proveedor.

## Requisitos funcionales (testeables)
- **RF-1 (endpoint)** — `POST /api/lead` (Astro API route, Node adapter): valida el payload con **Zod** (campos del form: name, email, phone?, business?, message, …); inválido → `400` con errores por campo; válido → invoca el `LeadPort`.
- **RF-2 (LeadPort)** — interfaz `LeadPort` + **adaptador email por defecto = Resend** (email transaccional; env `LEAD_PROVIDER=resend`, dejado **parametrizable** para Postmark/SMTP a futuro). Credenciales (`RESEND_API_KEY`), remitente (`LEAD_FROM_EMAIL`, dominio verificado en Resend) y **email de recepción** (`LEAD_TO_EMAIL`) vienen de env/secrets (**nunca** en el repo). El puerto permite añadir CRM/webhook después sin tocar el endpoint.
- **RF-3 (anti-spam)** — **honeypot** (campo oculto; si viene relleno → se descarta silenciosamente) + **rate-limit por IP** + **Cloudflare Turnstile ACTIVADO**: el endpoint valida el token server-side contra `siteverify` (secret `TURNSTILE_SECRET_KEY`); el form renderiza el widget (`TURNSTILE_SITE_KEY`). Ningún spam/token inválido llega al puerto.
- **RF-4 (progressive enhancement)** — el form de SEC-013 postea a `/api/lead`: **funciona sin JS** (POST estándar → respuesta del servidor con éxito/errores). Un **island pequeño** mejora: `fetch` + validación inline + muestra el `success-msg` del diseño **sin recargar**. Sin JS, degrada a POST normal.
- **RF-5 (UX éxito/error)** — en éxito, se muestra el `success-msg` (del diseño); errores inline y accesibles (`aria-invalid`/`aria-describedby`). Mensajes desde el contenido (config del bloque contact).
- **RF-6 (seguridad)** — validación/saneado del input; sin secretos en el repo (van en env/Drone); el endpoint no filtra info sensible en errores.
- **RF-7 (env en runtime, `astro:env`)** — toda la config de env (`LEAD_*`, `RESEND_API_KEY`, `TURNSTILE_*`) se lee vía **`astro:env`** (server/secret; el site key de Turnstile server/public), **no** `process.env` ni `import.meta.env` directos. Motivo: `import.meta.env` de vars no públicas se **hornea en build**, pero el contenedor recibe las vars de **Dokploy en runtime** → hay que leerlas en runtime. Esto arregla el `500` en `pnpm dev` (Vite no vuelca `.env` a `process.env`) y el site key vacío en el contenedor. (Fix: prompt 23; rama `fix/env-runtime-astro-env`.)

## Requisitos no funcionales
- **RNF-1 (a11y)** — errores anunciados (aria); todo operable por teclado; foco al primer error / al mensaje de éxito.
- **RNF-2 (perf)** — el island de mejora es pequeño (dentro del presupuesto de JS); sin dependencias pesadas en cliente.
- **RNF-3 (fidelidad)** — el **estado por defecto** del form no cambia (success oculto) → el **gate de fidelidad (QA-001) sigue verde**.
- **RNF-4 (fiabilidad)** — el puerto maneja fallos del proveedor (retry/manejo de error) sin perder el lead silenciosamente (log + respuesta de error clara).

## Invariantes
- **INV-1** — el **destino está tras `LeadPort`**; el endpoint no conoce el proveedor concreto.
- **INV-2** — cero secretos en el repo; el email de recepción y las credenciales son env.
- **INV-3** — el spam (honeypot/rate-limit) no llega al puerto; test lo verifica.
- **INV-4 (SRP)** — validación (schema), endpoint, `LeadPort` y adaptador en archivos separados.

## Criterios de aceptación (Gherkin)
```gherkin
Scenario: lead válido se entrega por el puerto
  Given un POST /api/lead con datos válidos
  When se procesa
  Then el LeadPort recibe el lead (adaptador email lo envía al destino configurado) y responde éxito

Scenario: honeypot descarta spam
  Given un POST con el campo honeypot relleno
  When se procesa
  Then se descarta silenciosamente y el LeadPort NO se invoca

Scenario: funciona sin JS
  Given el form enviado sin JavaScript (POST estándar)
  When el servidor responde
  Then muestra éxito o errores sin depender del island

Scenario: inválido devuelve errores por campo
  Given un POST sin email
  When se valida
  Then responde 400 con el error del campo email (accesible en la UI)
```

## Decisiones cerradas (humano) + secretos pendientes
- **Destino = email vía Resend.** El `LeadPort` sigue siendo la abstracción (CRM/webhook a futuro sin tocar el endpoint), pero el **adaptador por defecto es Resend**. El adaptador email queda **parametrizado por env** (`LEAD_PROVIDER=resend`) por si se cambia después.
- **Turnstile = ACTIVADO.** El endpoint **verifica el token de Turnstile** (server-side, contra el endpoint `siteverify` de Cloudflare) además del honeypot + rate-limit. El widget se renderiza en el form (SEC-013).
- **Secretos (env/Drone, NUNCA en el repo)** — dejar como `.env.example` con placeholders hasta que el humano los provea:
  - `RESEND_API_KEY` — API key de Resend.
  - `LEAD_FROM_EMAIL` — remitente (dominio **verificado en Resend**).
  - `LEAD_TO_EMAIL` — email de recepción de los leads (pendiente del humano).
  - `TURNSTILE_SITE_KEY` (público, front) + `TURNSTILE_SECRET_KEY` (server).

## Fuera de alcance
- CRM completo (más allá de un adaptador/webhook), doble opt-in, secuencias de email → futuro.
- Analítica del envío → EPIC-10 (Umami).

## Trazabilidad
- **Tests:** `[SPEC-FORM-001/RF-1..6]`, `[.../RNF-1..4]`, `[.../INV-1..4]` — validación del endpoint, honeypot/rate-limit, PE (POST sin JS), a11y de errores, LeadPort mockeado (contrato), gate de fidelidad intacto.
- **PRs:** —  ·  **ADR:** ADR-0010 posible ("leads tras LeadPort; email por defecto, proveedor por env").
