---
type: Prompt
title: "Prompt 52 — OKF Fase 4a: log.md raíz + higiene de refs muertos + okf:check enmascara zonas de código"
description: "Cierra la higiene del bundle: añade log.md raíz (historial de decisiones, OKF §7), limpia los 13 refs muertos en los specs vivos (re-apuntar/quitar) dejando los prompts históricos intactos, y corrige okf:check para que enmascare code fences/inline code (deja de marcar ejemplos como enlaces rotos). Fase 4 de ADR-0015."
tags: [prompt, okf, docs]
timestamp: 2026-07-11T06:10:00Z
---

# Prompt 52 — OKF Fase 4a: log.md + higiene de refs + fix de okf:check

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Implementa parte de la **Fase 4** de
> **[ADR-0015](/adr/0015-adopt-open-knowledge-format-okf.md)**. Cambio **docs + tooling**; no toca la app. TDD.
> Todo va contra `develop`. (El visualizador OKF va en un prompt aparte — Fase 4b.)

Eres un implementador en `sg-webpage`. Lee `AGENTS.md` §4, **ADR-0015** (plan fasado, §Fase 4) y
**[SPEC-DOCS-OKF-001](/specs/SPEC-DOCS-OKF-001.md)**. Tres secciones independientes; commitea coherente.

## Sección 0 — Higiene de los 13 refs muertos

El codemod de la Fase 3 dejó **13 referencias en prosa sin resolver** (apuntan a specs/ADRs borrados en el reset
del proyecto): `SPEC-LAYOUT-001` (×3), `SPEC-LAYOUT-002`, `SPEC-BLOCK-101`, `SPEC-BLOCK-107`,
`ADR-0002/0006/0007/0008/0009/0010/0011`. Están en **11 archivos**, y el criterio **depende del tipo de doc**:

- **Docs vivos/canónicos** — `docs/specs/SPEC-CMS-001.md`, `SPEC-DEPLOY-001.md`, `SPEC-DS-001.md`,
  `SPEC-FORM-001.md`, `SPEC-QA-001.md`, `SPEC-INFRA-001.md`: **límpialos**. Por cada ref muerto, con criterio:
  - Si hay un **concepto vigente que lo reemplaza** (p. ej. el antiguo `SPEC-LAYOUT/BLOCK` → el contrato de
    bloques / la spec de layout actual; un `ADR-000x` → el ADR vigente equivalente), **re-apúntalo** a ese
    concepto y enlázalo.
  - Si **ya no aplica** (la decisión/objeto desapareció), **reescribe la frase** para quitar la mención muerta
    sin romper el sentido (no dejes un enlace ni un ID colgante).
  - **No inventes** un target: si no estás seguro de a qué reemplazo apunta, **déjalo listado en el reporte**
    para que el humano decida, y no lo re-apuntes a ciegas.
- **Prompts históricos** — `docs/prompts/01-foundations.md`, `02-atoms.md`, `07-fidelity-foundation.md`,
  `08-organisms-reskin-phaseA.md`, `09-reset.md`: **NO los reescribas**. Son el **registro** de lo que se pidió
  cuando esos specs aún existían; falsear el historial es peor que un ref colgante. Déjalos **tal cual**.

Reporta, por cada uno de los 13: archivo, si se re-apuntó (a qué), se quitó, o se dejó (histórico/indeciso).

## Sección 1 — `log.md` raíz (OKF §7)

Crea **`docs/log.md`** (archivo **reservado**, **sin** `type` en frontmatter — como `index.md`) con el
**historial cronológico de decisiones** del bundle (OKF §7). Reverse-chronological (lo más nuevo arriba),
entradas con **fecha** y enlace al concepto:

- Siémbralo de las fuentes existentes: los **ADR** (0012–0015) por su `timestamp`, los hitos de specs
  relevantes, y los cambios notables recientes (Lighthouse 100, Turnstile runtime-key + diferido, animaciones
  CSS Modules, adopción OKF Fases 0–4). Usa `git log` para fechas/commits donde ayude, pero **cura** (no
  vuelques el log entero): una línea por decisión, con enlace bundle-relativo al ADR/spec.
- Formato sugerido por entrada: `- **2026-07-10** — Adoptado OKF v0.1 ([ADR-0015](/adr/0015-…​.md)).`
- Menciónalo desde el `index.md` raíz (una línea, junto a las secciones) si encaja; `okf:index` no debe listar
  `log.md` como concepto (es reservado — verifica que el generador lo ignora, igual que `index.md`).

## Sección 2 — `okf:check` enmascara zonas de código (fix del falso positivo)

Hoy `okf:check` escanea enlaces bundle-relativos **sin** distinguir zonas → marca como "enlace roto" ejemplos
que están dentro de **code fences / inline code** (p. ej. el literal `[ADR-0014](/adr/0014-….md)` del prompt 51).
Reutiliza el **enmascarado de zonas** que ya implementaste en `okf-link.ts` (fences ```` ``` ````, inline code
`` `…` ``, frontmatter) para que `okf:check` **ignore** los enlaces dentro de código al validar RF-5.

- Extrae el enmascarado a un helper compartido si evita duplicar (SRP), o reutilízalo; sin dependencias nuevas.
- Test `[SPEC-DOCS-OKF-001/RF-5]`: un enlace roto en **prosa** → warning; el **mismo** enlace dentro de un fence
  o inline code → **ignorado** (sin warning). Rojo antes, verde después.
- Tras el fix, el warning del ejemplo del prompt 51 **desaparece**; confírmalo.

## Verificación antes de "listo"

```
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check && pnpm okf:check && pnpm okf:index -- --check
```

- Gates verdes. `okf:check` **sin** el warning del ejemplo (ni otros falsos positivos de código).
- `docs/log.md` existe, reservado (sin `type`), no listado como concepto por `okf:index`.
- Reporte de los 13 refs (re-apuntado/quitado/dejado) y de los tests añadidos.

## Git (ciclo de vida — AGENTS.md §4)

Rama `feat/okf-phase4a-log-hygiene` **desde `develop`**; Conventional Commit (`docs`/`chore`, scope `okf`),
incluye `docs/` y el tooling. `pnpm exec prettier --write .` (solo tooling; cuidado con frontmatter/enlaces).
Al terminar y verde: **merge a `develop` y borra la rama**.

## Entregable

`docs/log.md` (historial curado con enlaces); los 6 specs vivos sin refs muertos (re-apuntados/quitados) y los
5 prompts históricos intactos; `okf:check` enmascarando zonas de código (sin falsos positivos) con test;
índices OKF coherentes. Reporta el destino de cada uno de los 13 refs. La Fase 4b (visualizador) y la Fase 5
(cross-proyecto) quedan para prompts siguientes.
