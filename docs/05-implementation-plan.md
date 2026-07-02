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

## 3. Reconstrucción v3 (contra `design/template/`)

> **Enfoque (consensuado):** **secciones directas** — un organismo `.astro` por sección, portado
> 1:1 desde `design/template/sections/`, compuestas en `index.astro`; contenido en datos tipados;
> átomos compartidos donde se reusen. **Sin** contrato Zod/BlockRenderer/Content-Collections por
> ahora (se reintroduce para la fábrica cuando el sitio esté fiel). **Una spec por sección** +
> regresión visual contra su HTML. Fidelidad primero.

### EPIC-20 — Sistema de diseño (foundation)
| ID | Ítem | Estado |
|----|------|--------|
| STORY-201 / SPEC-DS-001 | Port de `design-system/{tokens,base,animations}.css` + Poppins + `BaseLayout` + `scripts/interactions.js` (reveal/magnetic/nav, progressive enhancement) + átomos/utilidades compartidas (button, eyebrow, pill, badge, logo, icon-box, section-head, aurora, floating-card) | ✅ **Implemented** |

### EPIC-21 — Secciones (una spec por sección, 1:1 con `design/template/sections/`)
| ID | Sección | Estado |
|----|---------|--------|
| SPEC-QA-001 | **Gate de fidelidad** (regresión visual contra el DISEÑO, sin dev toolbar, assets) | ✅ **Implemented** — harness pixelmatch + drone blocker activos |
| SPEC-SEC-001 | 01-nav | ✅ **Verified** — diff 0.00% desktop / 0.45% mobile vs diseño |
| SPEC-SEC-002 | 02-hero | ✅ **Verified** — diff 2.0% desktop / 4.4% mobile vs diseño |
| SPEC-SEC-003 | 03-marquee | ✅ **Verified** — diff 2.4% desktop / 2.3% mobile vs diseño |
| SPEC-SEC-004 | 04-pain-points (bento) | ✅ **Verified** — diff 0.28% desktop / 1.95% mobile vs diseño |
| SPEC-SEC-005 | 05-value | ✅ **Verified** — diff 3.84% desktop / 5.81% mobile vs diseño |
| SPEC-SEC-006 | 06-how-it-works (sticky) | ✅ **Verified** — diff 0.34% desktop / 1.15% mobile vs diseño |
| SPEC-SEC-007 | 07-plans (+ hosting) | ✅ **Verified** — diff 1.35% desktop / 6.51% mobile vs diseño |
| SPEC-SEC-008 | 08-testimonials (+ stats) | **Approved** — pendiente Claude Code |
| SPEC-SEC-009 | 09-portfolio | **Approved** — pendiente Claude Code |
| SPEC-SEC-010 | 10-about (órbita/ciudades) | Planned |
| SPEC-SEC-011 | 11-faq | Planned |
| SPEC-SEC-012 | 12-cta | Planned |
| SPEC-SEC-013 | 13-contact (form) | Planned |
| SPEC-SEC-014 | 14-footer | Planned |
| SPEC-SEC-015 | index.astro — ensamblado + orden + `<head>`/SEO base | Planned |

### Diferido (tras el sitio fiel)
| EPIC | Título | Estado |
|------|--------|--------|
| EPIC-06 | Leads: `/api/lead` + puerto email/CRM (el form UI llega en SEC-013) | Diferido |
| EPIC-07/08 | SEO/perf + a11y transversal (gates) | Diferido |
| EPIC-10 | Analítica first-party → Umami | Diferido |
| EPIC-30 | Reintroducir contrato de bloques Zod para la **fábrica** (envolver los organismos) | Diferido |
| EPIC-05 | CMS Sveltia `/admin` | Diferido |

## 4. Trazabilidad
`scripts/trace.ts` → `docs/traceability.md`; CI falla si una spec `Approved` tiene un requisito sin test.
