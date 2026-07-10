---
type: Spec
title: "SPEC-FORM-002 — UX del formulario: validación en tiempo real + máquina de estados + confirmación"
description: "Capa JS de cliente: validación en tiempo real on-blur, máquina de estados (idle→submitting→success/error), tarjeta de confirmación al enviar y autocomplete — sobre la base progresiva de SPEC-FORM-001."
tags: [form, a11y, ui]
timestamp: 2026-07-11T01:00:00Z
---

# SPEC-FORM-002 — UX del formulario: validación en tiempo real + máquina de estados + confirmación

- **ID:** SPEC-FORM-002
- **Estado:** Implemented <!-- Draft → Review → Approved → Implemented → Verified -->
- **Épica / Story:** EPIC-06 / STORY-062 (form UX)
- **Capa atómica:** feature (comportamiento de cliente del form)
- **Depende de:** SPEC-FORM-001 (endpoint `/api/lead` + PE), SPEC-SEC-013 (UI del form), SPEC-A11Y-001

## Contexto / problema

El form de contacto ya entrega leads (SPEC-FORM-001) y funciona **sin JS** (POST a `/api/lead`, el servidor
valida con Zod y responde). Pero la capa de cliente (`contact-form.ts`) es mínima: **no hay validación en
tiempo real** (solo pinta errores tras el round-trip del submit), el botón **no tiene estado de carga**, y el
**estado de éxito** es un banner sobre el form inertizado —poco logrado—. Esta spec añade la **capa JS de UX**:
validación inmediata, manejo de estado y una **tarjeta de confirmación**, **sin** sacrificar el fallback sin JS
ni mover al servidor como fuente de verdad de la validación.

## Objetivo

Que el formulario, con JS, valide en tiempo real y transicione por estados claros hasta una confirmación
limpia; sin JS, siga posteando al servidor como hoy.

## Requisitos funcionales (testeables)

- **RF-1 (validación en tiempo real)** — Con JS, cada campo se valida en el cliente usando **constraint
  validation nativa** (`required`, `type=email`, `type=tel`) **al `blur`**, y **re-valida al `input`** tras el
  primer error. Reglas que **espejan** las del servidor (no divergen): requeridos = first_name, last_name,
  email, business_name, city; email con formato; phone opcional (formato laxo si viene). Mensajes **propios**
  (no los del navegador).
- **RF-2 (errores accesibles)** — Un campo inválido marca `aria-invalid="true"` y enlaza `aria-describedby` a
  un `#<id>_err` con el mensaje; al corregirse, se limpian atributos y mensaje. (Sustituye/unifica el manejo
  actual de `setFieldErrors`.)
- **RF-3 (máquina de estados)** — El form maneja estados **`idle | submitting | success | error`**:
  - `submitting`: botón **deshabilitado** + label de carga (p. ej. "Sending…"); no re-enviable (anti doble-submit).
  - `error` (red o `4xx`/`5xx` del servidor): vuelve a `idle` con los errores del servidor pintados (RF-2) y
    permite reintento.
  - El **servidor sigue siendo la fuente de verdad**: la validación de cliente es *enhancement*; el server
    re-valida siempre (SPEC-FORM-001/RF-1).
- **RF-4 (tarjeta de confirmación)** — En `success`, el `<form>` se **reemplaza** por una **tarjeta de
  confirmación** (ícono de check + mensaje de gracias tomado del contenido del bloque contact), en vez del
  banner sobre el form inertizado. Foco movido a la tarjeta + `role="status"`/`aria-live="polite"`.
- **RF-5 (autocomplete)** — Campos de identidad con tokens `autocomplete` correctos (cierra los 3 issues de
  DevTools): `first_name`→`given-name`, `last_name`→`family-name`, `email`→`email`, `phone`→`tel`,
  `business_name`→`organization`, `city`→`address-level2`. `_gotcha` conserva `autocomplete="off"`.
- **RF-6 (submit gating)** — El botón de envío no permite **doble submit** y (opcional) puede estar
  deshabilitado mientras el form es inválido; nunca bloquea el envío de un form ya válido.

## Requisitos no funcionales

- **RNF-1 (progressive enhancement intacto)** — Sin JS, el form **sigue** posteando a `/api/lead` y mostrando
  éxito/errores del servidor (SPEC-FORM-001/RF-4 no se rompe). La tarjeta de confirmación y la validación
  real-time son **solo** capa JS.
- **RNF-2 (a11y)** — Errores anunciados (aria-invalid/describedby); estado anunciado (aria-live); foco al
  primer error en submit fallido y a la tarjeta en éxito; todo operable por teclado (WCAG 2.1 AA).
- **RNF-3 (perf)** — El island sigue pequeño, **sin dependencias** (validación nativa + estado en vanilla TS);
  dentro del presupuesto de JS.
- **RNF-4 (fidelidad)** — El **estado por defecto (`idle`)** del form **no cambia** de apariencia (tarjeta y
  errores ocultos por defecto) → **QA-001 sigue verde**. Los estados nuevos usan **tokens** existentes.

## Invariantes

- **INV-1** — La validación de cliente **espeja** el schema Zod del servidor; el servidor **re-valida** (nunca
  se confía solo en el cliente).
- **INV-2 (SRP)** — Validación, máquina de estados y render de la tarjeta en piezas separadas y legibles;
  `contact-form.ts` ≤ ~150 líneas o se descompone.
- **INV-3** — Sin `autocomplete` en campos no-autofill (`plan_interest`, `message`); honeypot intacto.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: validación al salir del campo
  Given el campo email vacío o mal formado
  When pierde el foco (blur)
  Then se marca aria-invalid y aparece su mensaje; el botón no envía hasta corregir

Scenario: estado de envío
  Given un form válido
  When se hace submit
  Then el botón queda deshabilitado con "Sending…" y no admite doble envío

Scenario: confirmación al enviar
  Given el servidor responde 2xx
  When termina el envío
  Then el form se reemplaza por la tarjeta de confirmación, con foco y aria-live

Scenario: error del servidor permite reintento
  Given el servidor responde error o falla la red
  When se procesa
  Then vuelve a idle con el error visible y se puede reintentar

Scenario: sin JS sigue funcionando
  Given el form enviado sin JavaScript
  When el servidor responde
  Then muestra éxito/errores por la vía del servidor (sin la capa JS)
```

## Fuera de alcance

- Cambiar el endpoint, el `LeadPort` o el anti-spam (SPEC-FORM-001).
- Máquina de estados con librería externa (se hace en vanilla TS).
- Analítica del envío (EPIC-10).

## Trazabilidad

- **Tests:** `[SPEC-FORM-002/RF-1..6]`, `[.../RNF-1..4]`, `[.../INV-1..3]` — validación on-blur/input,
  atributos aria de error, transiciones de estado (submitting/success/error), reemplazo por tarjeta de
  confirmación + foco/aria-live, tokens autocomplete, PE sin JS intacto, gate de fidelidad verde.
- **PRs:** — · **ADR:** — (si se decide abandonar el fallback sin JS, requeriría ADR + cambiar SPEC-FORM-001/RF-4)
