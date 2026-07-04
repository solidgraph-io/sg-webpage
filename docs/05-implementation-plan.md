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
| SPEC-SEC-008 | 08-testimonials (+ stats) | ✅ **Verified** — diff 0.44% desktop / 1.84% mobile vs diseño |
| SPEC-SEC-009 | 09-portfolio | ✅ **Verified** — diff 0.98% desktop / 0.67% mobile vs diseño |
| SPEC-SEC-010 | 10-about (órbita/ciudades) | ✅ **Verified** — diff 4.92% desktop / 6.91% mobile vs diseño |
| SPEC-SEC-011 | 11-faq | ✅ **Verified** — diff 0.56% desktop / 8.74% mobile vs diseño |
| SPEC-SEC-012 | 12-cta | ✅ **Verified** — diff 1.97% desktop / 0.20% mobile vs diseño |
| SPEC-SEC-013 | 13-contact (UI del form; envío → EPIC-06) | ✅ **Verified** — diff 7.10% desktop / 7.78% mobile vs diseño |
| SPEC-SEC-014 | 14-footer | ✅ **Verified** — diff 1.46% desktop / 3.28% mobile vs diseño |
| SPEC-SEC-015 | index.astro — ensamblado + orden + `<head>`/SEO base + fidelidad de página | ✅ **Verified** — 14 secciones, orden correcto, SEO OK, h1 único, baseline above-fold |

### EPIC-22 — Contenido CMS-ready (prerequisito de SEO)
> El contenido estaba inline en `index.astro` → **no editable por CMS**. Se mueve a Content
> Collections (datos + Zod) para que Sveltia (EPIC-05) lo edite sin migración. El gate de fidelidad
> prueba que el render no cambia.

| ID | Ítem | Estado |
|----|------|--------|
| STORY-221 / SPEC-CONTENT-001 | Content Collections (`settings/site` + `pages/home`) + migración verbatim del contenido inline + `index.astro` lee de la colección | **Implemented** — `feature/SPEC-CONTENT-001-content-layer` |

### EPIC-07/08 — SEO + Performance + Accesibilidad (M1, EN CURSO)
> **M0 (sitio fiel) alcanzado.** Track elegido para M1. **SEO depende de EPIC-22** (SiteConfig CMS-editable). Gates nuevos: JSON-LD/sitemap/robots, Lighthouse, axe de página.

| ID | Ítem | Estado |
|----|------|--------|
| STORY-071 / SPEC-SEO-001 | Metadatos, OG, **JSON-LD LocalBusiness**, canonical, sitemap, robots + `SiteConfig` tipado | **Implemented** |
| STORY-072 / SPEC-PERF-001 | Presupuestos **Lighthouse CI** (gate) + imágenes `astro:assets` + presupuesto de JS | **Implemented** |
| STORY-081 / SPEC-A11Y-001 | Auditoría WCAG AA de página + **skip-link** (oculto hasta foco) + teclado + gate CI | **Implemented** |

### EPIC-05 — CMS Sveltia (`/admin`, git-based) — EN CURSO
> El contenido ya es CMS-ready (EPIC-22). Se monta el editor Sveltia mapeando `settings/site` +
> `pages/home`. Requiere host Git + OAuth (setup humano); `local_backend` permite probar ya.

| ID | Ítem | Estado |
|----|------|--------|
| STORY-051 / SPEC-CMS-001 | Sveltia en `/admin` + `config.yml` (file collections → colecciones), `local_backend` para dev, OAuth de producción parametrizado | **Implemented** — `feature/SPEC-CMS-001-sveltia`; OAuth pendiente de client_id/secret humano |

### EPIC-06 — Leads (EN CURSO)
| ID | Ítem | Estado |
|----|------|--------|
| STORY-061 / SPEC-FORM-001 | `/api/lead` (Node) + `LeadPort` (email por defecto, proveedor por env) + honeypot/rate-limit + form con progressive enhancement | **Implemented** — `feature/SPEC-FORM-001-leads`; destino/credenciales pendientes del humano (EMAIL_RECIPIENT + proveedor) |

### Diferido
| EPIC | Título | Estado |
|------|--------|--------|
| EPIC-10 | Analítica first-party → Umami | Diferido |
| EPIC-30 | Reintroducir contrato de bloques Zod para la **fábrica** (envolver los organismos) | Diferido |
| — | Deploy a producción (DroneCI→Dokploy, listo; falta decisión humana + secretos) | Diferido |

## 4. Trazabilidad
`scripts/trace.ts` → `docs/traceability.md`; CI falla si una spec `Approved` tiene un requisito sin test.
