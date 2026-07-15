---
type: Prompt
title: "Prompt 44 — UX del formulario: validación en tiempo real + estados + tarjeta de confirmación + autocomplete"
description: "Implementa SPEC-FORM-002: capa JS de cliente con validación on-blur, máquina de estados (idle→submitting→success/error), tarjeta de confirmación y tokens autocomplete, sin romper el fallback sin JS."
tags: [prompt, form, a11y, ui]
timestamp: 2026-07-11T01:10:00Z
---

# Prompt 44 — UX del formulario: validación real-time + estados + confirmación + autocomplete

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa **[SPEC-FORM-002](/specs/SPEC-FORM-002.md)**. TDD + trazabilidad.
> Rama `feat/form-ux` **desde `develop`**; al terminar y verde: **merge y borra la rama**.

---

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4, **SPEC-FORM-002** (`docs/specs/SPEC-FORM-002.md`),
y de contexto **[SPEC-FORM-001](/specs/SPEC-FORM-001.md)** (endpoint + PE) y **[SPEC-SEC-013](/specs/SPEC-SEC-013.md)** (UI del form).

## Qué construir (capa JS de UX, sobre la base progresiva existente)

Hoy `apps/web/src/scripts/contact-form.ts` solo intercepta el submit y pinta errores tras el round-trip; el
botón no tiene estado de carga y el éxito es un banner sobre el form inertizado. Añade la capa JS de UX,
**sin romper el fallback sin JS** (el server sigue siendo la fuente de verdad — SPEC-FORM-001/RF-4).

### 1. Validación en tiempo real (RF-1/RF-2)

- Valida cada campo con **constraint validation nativa** (`checkValidity()`/`validity` sobre `required`,
  `type=email`, `type=tel`) **al `blur`**; **re-valida al `input`** solo tras el primer error del campo.
- Reglas que **espejan** el Zod del servidor (no diverjas): requeridos = `first_name, last_name, email,
  business_name, city`; `email` con formato; `phone` opcional (laxo si viene). Mensajes **propios** (mapa de
  mensajes, no los del navegador → usa `novalidate` en el form y controla tú los mensajes).
- Campo inválido → `aria-invalid="true"` + `aria-describedby="<id>_err"` con el texto; al corregir, se limpian.

### 2. Máquina de estados (RF-3/RF-6)

Estados `idle | submitting | success | error` en vanilla TS (sin librerías):

- `submitting`: botón **deshabilitado** + label de carga ("Sending…") + anti doble-submit.
- éxito (2xx): → `success` (paso 3).
- error (red o `4xx/5xx`): → `idle` con los errores del servidor pintados (RF-2) y reintento posible.
- Mantén el `fetch` a `/api/lead` (JSON) existente; el server **re-valida** siempre.

### 3. Tarjeta de confirmación (RF-4)

- En `success`, **reemplaza el `<form>`** por una **tarjeta de confirmación** (ícono check de `icons.svg` +
  mensaje de gracias del contenido — reutiliza el `successMsg`/config del bloque contact; si necesitas un
  título corto, tómalo de la config con un default, citando [SPEC-CONTENT-001](/specs/SPEC-CONTENT-001.md); evita hardcodear copy).
- `role="status"` + `aria-live="polite"`, **foco** movido a la tarjeta. (Sustituye el patrón actual de banner
  + `inert`.)
- Markup **oculto por defecto** en `Contact.astro` (no visible en `idle`) → **QA-001 no cambia**.

### 4. Autocomplete (RF-5)

En `Contact.astro`, añade los tokens: `first_name`→`given-name`, `last_name`→`family-name`, `email`→`email`,
`phone`→`tel`, `business_name`→`organization`, `city`→`address-level2`. `_gotcha` conserva `off`;
`plan_interest`/`message` sin `autocomplete`.

## SRP / archivos

- **Elimina** el prompt obsoleto `docs/prompts/44-form-autocomplete-attributes.md` (su alcance —autocomplete—
  quedó absorbido aquí como RF-5). Regenera índices con `pnpm okf:index`.
- Si `contact-form.ts` supera ~150 líneas, descomponlo (p. ej. `contact-form/validate.ts` + `state.ts` +
  índice) — INV-2. Sin dependencias nuevas (RNF-3).
- Estilos de la tarjeta + `.field-error` + estado de carga del botón con **tokens** existentes.

## Tests (TDD / SDD)

- Estáticos (vitest) `[SPEC-FORM-002/RF-4,RF-5,RNF-4]`: la tarjeta existe **oculta** por defecto; los 6 tokens
  `autocomplete`; el estado `idle` no cambia (fidelidad).
- E2E (Playwright, con el harness a11y existente) `[SPEC-FORM-002/RF-1,RF-2,RF-3,RNF-2]`: blur en email vacío →
  aria-invalid + mensaje; submit válido → botón "Sending…"/deshabilitado; éxito (mock del endpoint) → aparece
  la tarjeta con foco/aria-live; error → vuelve a `idle` con reintento.
- Mockea `/api/lead` en E2E (no dependas de Resend/Turnstile reales).

## Fidelidad / a11y / PE

- **QA-001 verde**: el render por defecto del form no cambia (tarjeta/errores ocultos).
- **A11y**: aria-invalid/describedby, aria-live del estado, foco al primer error / a la tarjeta, teclado.
- **PE intacto**: sin JS, el form sigue posteando a `/api/lead` (no toques ese camino).

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check && pnpm okf:check
```

- Todo verde; DevTools → Issues: los 3 "autocomplete" **desaparecen**; Lighthouse sigue 100/100/100/100.

## Git (ciclo de vida — AGENTS.md §4)

Conventional Commit (`feat`, scope `form`/`ui`), incluye `docs/`. `pnpm exec prettier --write .` (solo código).

## Entregable

Formulario con validación en tiempo real, estados (idle/submitting/success/error), **tarjeta de confirmación**
al enviar y `autocomplete` correcto; PE y fidelidad intactos; `SPEC-FORM-002` → Implemented; tests (vitest +
e2e) y gates verdes. Reporta archivos tocados.
