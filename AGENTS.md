# AGENTS.md — SolidGraph Website (sg-webpage)

> **Fuente de verdad** de las reglas de desarrollo (estándar abierto: Claude Code, Codex,
> Gemini, Cursor). `CLAUDE.md` importa este archivo y solo añade lo específico de Claude Code.
> Metodología heredada de **Guani** (SDD + TDD + épicas + trazabilidad), adaptada a un sitio de
> marketing con **diseño ya definido**: los controles críticos son **Atomic Design + SRP,
> accesibilidad, performance, SEO y el contrato de contenido**.
>
> Producto y stack: `docs/01-architecture-and-stack.md`. Metodología: `docs/04-engineering-methodology.md`.
> Arquitectura de la fábrica: `../agency-structure/Agency Structure/ARQUITECTURA.md`.

---

## 1. Spec-Driven Development (SDD) — nada se implementa sin spec

```
Diseño (Claude Design export en design/)
  → SPEC (docs/specs/SPEC-<DOMINIO>-<NNN>.md)     ← qué + criterios de aceptación
     → ADR si hay decisión arquitectónica (docs/adr)
        → Tests (rojo) → Implementación (verde) → Refactor
           → PR enlazada a SPEC (+ADR)
```
Si falta la spec, el agente la crea y **pide aprobación** antes de escribir código.

### 1.1 Anatomía de una SPEC
`docs/specs/SPEC-<DOMINIO>-<NNN>.md`, ID **estable**. Estado: Draft → Review → Approved →
Implemented → Verified. Secciones: Contexto · `RF-x` (testeables) · `RNF-x` (a11y/perf/SEO/
responsive) · `INV-x` (invariantes) · Criterios Gherkin · Fuera de alcance · Trazabilidad.
Dominios: `LAYOUT`, `ATOM`, `MOLECULE`, `BLOCK` (organismo), `CONTENT`, `CMS`, `FORM`, `SEO`,
`A11Y`, `PERF`, `ANALYTICS`, `INFRA`.

### 1.2 Regla de oro de trazabilidad
Cada `RF-x` → ≥1 test que cita la spec: `it('[SPEC-BLOCK-006/RF-3] ...')`. `scripts/trace.ts`
genera `docs/traceability.md`. **CI falla** si una spec `Approved` tiene un requisito sin test.
Jerarquía: `EPIC → STORY → SPEC → tests + PR` (`docs/05-implementation-plan.md`).

---

## 2. Atomic Design + Single Responsibility Principle (arquitectura de componentes)

**Vinculante.** El diseño se convierte a componentes con la skill `design-to-components`.

- **5 capas:** `atoms → molecules → organisms → templates → pages`. Los **organismos son los
  bloques** del contrato (`packages/blocks-contract`); átomos y moléculas son sus piezas internas.
- **SRP:** un componente = un archivo = una responsabilidad. **Ningún componente supera ~150
  líneas**; si lo hace (o hace >1 cosa, o repite markup), se descompone. Prohibidos los
  componentes gigantes.
- **Construcción bottom-up:** tokens → átomos → moléculas → organismos → template → página, para
  maximizar reutilización.
- **Sin lógica de negocio en átomos**; sin copy/colores hardcodeados (props + tokens).
- Ubicación: `src/components/{atoms,molecules,organisms,templates}/`.

---

## 3. Test-Driven Development (TDD) — Red → Green → Refactor

### 3.1 Pirámide (web)
| Nivel | Herramienta | Qué cubre |
|-------|-------------|-----------|
| Unit/componente | Vitest + `astro/container` | render de átomos/moléculas/organismos, props → salida |
| Contrato de contenido | Zod | `content/**` cumple el schema; props inválidas fallan (build) |
| Accesibilidad | axe | WCAG 2.1 AA por componente y página |
| E2E/visual | Playwright | nav, FAQ, form; **regresión visual vs. diseño** |
| Perf | Lighthouse CI | LCP/CLS/TBT, peso JS/imágenes |

### 3.2 Reglas TDD vinculantes
- Un test en rojo antes de cada comportamiento; todo bug empieza por un test que lo reproduce.
- El **schema Zod del bloque** es la fuente de verdad.
- Cobertura: render/adapter/endpoint ≥ 85%; resto ≥ 70% (gate CI).
- Proveedores externos (leads→email/CRM, analytics→Umami) tras **puerto** con test de contrato.

---

## 4. Git Flow + Conventional Commits + CI

Ramas `main`/`develop`/`feature/*`/`hotfix/*`; la rama cita la spec
(`feature/SPEC-BLOCK-006-pricing`). Conventional Commits con footer `[SPEC-XXX]` (commitlint).
Scopes: `layout|atom|molecule|block|content|cms|form|seo|a11y|perf|analytics|infra|docs`.
PR enlaza SPEC(+ADR) con checklist; revisión extra si toca el **contrato de bloques** o el
**layout global**.

> **`docs/` SIEMPRE se commitea.** El registro SDD (specs, `docs/05`, `docs/prompts`,
> `docs/traceability.md`, ADRs) es parte del entregable y debe versionarse **en la misma rama/PR**
> que su implementación. Al cerrar un incremento, **`git add docs/`** junto al código (la spec que
> pasa a Implemented/Verified viaja con su commit). `docs/` **nunca** va en `.gitignore`. El
> `trace check` depende de `docs/specs` estando en el repo.

**Gates de CI (bloqueantes):**
```
lint → type-check (astro check) → unit+contract → a11y → build → coverage
     → trace check (spec↔test) → visual/e2e → security scan (gitleaks, npm audit)
```
Entrega: DroneCI → Custom Registry → Dokploy → VPS/Docker (ver `docs/01` §6).

---

## 5. Reglas duras para agentes

1. **Spec primero, test después, código al final.** Si falta la spec, créala y pide aprobación.
2. **Atomic Design + SRP:** componentes pequeños, una responsabilidad, ≤ ~150 líneas; descompón antes que agrandar.
3. **El contenido es dato.** Copy vía props desde Content Collections; colores/spacing desde tokens. Nada hardcodeado.
4. **El schema Zod del bloque se define una vez** y es la fuente de verdad.
5. **Sin Next.js ni segundo framework de página.** Astro islands solo donde la interacción lo exija.
6. **Accesibilidad AA y performance son criterios de aceptación**, no extras.
7. **Nunca commitear secretos** (Drone/Dokploy; en el repo solo `.env.example`).
8. **Conventional Commits + rama que cita la spec.**
9. **Cada `RF-x` con ≥1 test que cita `[SPEC-XXX/RF-y]`.**
10. **Todo proveedor externo tras un puerto/adaptador** (leads, analytics).
11. **Fidelidad al diseño** (`design/` — export de Claude Design); regresión visual en organismos.
12. **Bloques/organismos desacoplados del copy de SolidGraph** para reutilizarlos en la fábrica.

### Detente y confirma con el humano
- Antes de cambiar el **contrato de bloques** (`packages/blocks-contract`).
- Antes de tocar **CI/CD, registry o deploy de producción**.
- Antes de añadir una **dependencia pesada** o JS de cliente no previsto en la spec.

---

## 6. Verificación antes de decir "listo"
```
pnpm lint && pnpm type-check && pnpm test && pnpm trace -- --check
```
