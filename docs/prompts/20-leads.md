---
type: Prompt
title: "Prompt 20 — Captación de leads (`/api/lead` + LeadPort) (para Claude Code)"
description: "Implementar docs/specs/SPEC-FORM-001.md: endpoint /api/lead + LeadPort + anti-spam + form con progressive enhancement."
tags: [prompt]
timestamp: 2026-07-07T12:44:46-04:00
---

# Prompt 20 — Captación de leads (`/api/lead` + LeadPort) (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`.

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md`,
`docs/01-architecture-and-stack.md` y las skills. Metodología (SDD + TDD + Atomic Design + SRP)
vinculante. La home es fiel (M0), CMS-ready, con SEO/perf/a11y. La UI del form existe (SEC-013) pero
es **inerte**.

> **Recuerda (AGENTS.md §4):** `docs/` se commitea con el incremento (`git add docs/`).

## Objetivo

Implementar `docs/specs/SPEC-FORM-001.md`: endpoint `/api/lead` + `LeadPort` + anti-spam + form con
progressive enhancement.

## Decisiones cerradas (NO preguntes)

- **Destino = email vía Resend.** Adaptador por defecto Resend, `LEAD_PROVIDER=resend`, dejado parametrizable para Postmark/SMTP a futuro.
- **Turnstile = ACTIVADO** (verificación server-side obligatoria).
- **Secretos por env** (placeholders en `.env.example`, nunca valores reales en el repo): `RESEND_API_KEY`, `LEAD_FROM_EMAIL` (dominio verificado en Resend), `LEAD_TO_EMAIL` (recepción), `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

## Reglas (no negociables)

- **TDD:** tests en rojo citando la spec (`it('[SPEC-FORM-001/RF-2] LeadPort receives valid lead')`).
- **Puerto/adaptador:** `LeadPort` (interfaz) + **adaptador Resend** por defecto, **parametrizado por env** (`LEAD_PROVIDER`). El endpoint **no** conoce el proveedor. Sin secretos en el repo.
- **Anti-spam:** honeypot (campo oculto) + rate-limit por IP + **Turnstile** (valida el token contra `siteverify` con `TURNSTILE_SECRET_KEY`; el form renderiza el widget con `TURNSTILE_SITE_KEY`); el spam / token inválido no llega al puerto (test).
- **Progressive enhancement:** el form postea a `/api/lead` y **funciona sin JS** (POST estándar → éxito/errores del servidor). Un **island pequeño** mejora (fetch + validación inline + `success-msg` sin recargar). Sin JS degrada a POST normal. Presupuesto de JS respetado.
- **Fidelidad:** el estado por defecto del form (success oculto) **no cambia** → corre el gate QA-001 y verifica verde.
- **A11y:** errores accesibles (aria-invalid/aria-describedby), foco al primer error / al éxito, todo por teclado.
- **SRP:** schema, endpoint, `LeadPort`, adaptador email en archivos separados.
- **Git:** rama `feature/SPEC-FORM-001-leads`; Conventional Commits `[SPEC-FORM-001]`, scope `form`; incluye `docs/`.

## Pendiente del humano (solo valores de secretos, NO bloquea la implementación)

Implementa todo contra env con `.env.example` documentado. El humano proveerá después (env/Drone):
`RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_TO_EMAIL`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

## Pasos

1. Schema Zod del lead (mirror de los campos del form) + `/api/lead` (Node) que valida y llama al puerto.
2. `LeadPort` + adaptador email (proveedor por env). Tests con el puerto mockeado (contrato).
3. Anti-spam: honeypot + rate-limit (+ Turnstile opcional). Tests de que el spam no llega al puerto.
4. Cablea el form (SEC-013) al endpoint con progressive enhancement (island de mejora); success/error UX accesible.
5. Corre el **gate de fidelidad** y verifica verde (estado por defecto intacto).
6. `pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check` verde. Estado a `Implemented`; actualiza y **commitea** `docs/05`.

## Entregable

El formulario **captura de verdad**: valida, filtra spam y entrega el lead por el `LeadPort` (email
por defecto, proveedor por env), con PE y a11y, sin tocar la fidelidad. Al terminar, resume, indica
qué necesitas del humano (destino + credenciales + email de recepción) y confirma los diferidos
(EPIC-10 Umami, deploy, EPIC-30 contrato de bloques).
