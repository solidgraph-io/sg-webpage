# 05 — Plan de Implementación Trazable (sg-webpage)

> **Estado:** Reset 2026-07-01 — re-planificación contra `design/template/` pendiente del arquitecto.
> IDs estables. Documento vivo.

## 0. Estructura de IDs
```
EPIC-XX → STORY-XXX → SPEC-DOM-NNN → tests + PR
```
Estados de spec: Planned · Draft · Approved · Implemented · Verified.

## 1. Milestones (por confirmar tras re-planificación)
- **M0 — Sitio en vivo:** sistema de diseño + organismos + contenido + deploy.
- **M1 — Conversión:** form leads, analítica, SEO completo, perf.
- **M2 — Handoff CMS & pulido:** Sveltia `/admin`, a11y AA, base `apps/crm`.

## 2. EPIC-01 — Fundaciones (completado)

| ID | Ítem | Estado |
|----|------|--------|
| STORY-011 / SPEC-INFRA-001 | Scaffold monorepo + tooling + CI + `scripts/trace.ts` + Docker | ✅ **Implemented** |
| STORY-012 | Arneses IA (AGENTS/CLAUDE), comandos SDD/TDD, skills | ✅ Done |

## 3. Resto de épicas — Reset pendiente de re-planificación

> El diseño de referencia es ahora `design/template/` (HTML por secciones).
> El arquitecto re-planificará EPIC-02…EPIC-11 contra esas secciones y actualizará este documento.

| EPIC | Título | Estado |
|------|--------|--------|
| EPIC-02 | Sistema de diseño: tokens + tipografía + átomos | Reset — re-planificación pendiente |
| EPIC-03 | Moléculas reutilizables | Reset — re-planificación pendiente |
| EPIC-04 | Organismos (bloques) + contrato Zod + BlockRenderer | Reset — re-planificación pendiente |
| EPIC-05 | Contenido & CMS (Content Collections + Sveltia) | Reset — re-planificación pendiente |
| EPIC-06 | Leads: form + `/api/lead` + puerto email/CRM | Reset — re-planificación pendiente |
| EPIC-07 | SEO & performance | Reset — re-planificación pendiente |
| EPIC-08 | Accesibilidad WCAG AA transversal | Reset — re-planificación pendiente |
| EPIC-09 | Infra & CI/CD (ya implementado en EPIC-01) | ✅ Done vía SPEC-INFRA-001 |
| EPIC-10 | Analítica first-party → Umami | Reset — re-planificación pendiente |
| EPIC-11 | (obsoleto — era el correctivo visual v1) | Absorbido por el reset |

## 4. Trazabilidad
`scripts/trace.ts` → `docs/traceability.md`; CI falla si una spec `Approved` tiene un requisito sin test.
