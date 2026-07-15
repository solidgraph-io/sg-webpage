---
type: Prompt
title: "Prompt 24 — Arreglar CI en `develop`: test frágil `0.10` + descomposición SRP (para Claude Code)"
description: "src/tests/qa-001.test.ts → [SPEC-QA-001/RNF-1] mobile threshold is 0.10 … lee el código fuente de tests/visual/{nav,hero,marquee}.spec.ts y busca el string literal '0.10'."
tags: [prompt]
timestamp: 2026-07-08T14:59:14-04:00
---

# Prompt 24 — Arreglar CI en `develop`: test frágil `0.10` + descomposición SRP (para Claude Code)

> Pégale esto a Claude Code en la raíz del repo `sg-webpage`. Bloquea el pipeline dev (10 tests en rojo).

---

Eres un implementador en `sg-webpage`. Lee y respeta `AGENTS.md`, `CLAUDE.md` y las skills
(**`design-to-components`**, **`spec-driven-development`**). Atomic Design + SRP + TDD vinculantes.
**Recuerda (AGENTS.md §4):** `docs/` se commitea. Usa subagentes **Explore** (localizar átomos/moléculas
existentes, no duplicar) y **Plan** (descomposición atómica) como exige `CLAUDE.md`.

## Contexto — 10 tests fallando en `develop`, dos causas distintas

### Tarea A (1 test) — test frágil de umbral, destapado por prettier
`src/__tests__/qa-001.test.ts` → `[SPEC-QA-001/RNF-1] mobile threshold is 0.10 …` lee el **código
fuente** de `tests/visual/{nav,hero,marquee}.spec.ts` y busca el string literal `'0.10'`. Pero prettier
**normaliza números y quita ceros finales**, así que `threshold: 0.10` quedó como `0.1` → el string no
matchea → falla. Es un test frágil (compara literal en vez del valor).

**Arreglo:** que el test valide el **valor numérico**, no el string. Ej.: extraer el número tras
`threshold:` con regex y `expect(value).toBeCloseTo(0.1)` (móvil) / `toBeCloseTo(0.08)` (desktop en el
test hermano). No re-introduzcas `0.10` a mano (prettier lo volverá a normalizar). El intent no cambia:
umbral móvil 0.10, desktop 0.08.

### Tarea B (9 tests) — invariante SRP por líneas: **descomponer** los organismos grandes
**Decisión del humano (consensuada):** NO relajar la métrica ni subir límites. **Descomponer** los
componentes que exceden su límite en sub-componentes (Atomic Design), de modo que cada `.astro` quede
bajo su límite **contando también su `<style>`**. En todos los casos la plantilla ya está bajo el límite;
lo que sobra es el **CSS portado** → al extraer sub-componentes, **reparte el `<style>` con ellos** (cada
sub-componente lleva su slice de CSS scoped).

Componentes y su límite (archivo actual → límite):
- `Hero.astro` 372 → **≤200** (plantilla ~144 + CSS ~228)
- `Contact.astro` 284 → **≤160** (creció con Turnstile; plantilla ~153 + CSS ~131)
- `PlanCard.astro` 272 → **≤150** (plantilla ~62 + CSS ~210 → dominado por CSS)
- `About.astro` 251 → **≤150**
- `HowItWorks.astro` 220 → **≤150**
- `Footer.astro` 217 → **≤130**
- `PainPoints.astro` 215 → **≤150**
- `Value.astro` 186 → **≤150**
- `Plans.astro` 166 → **≤150**

**Sugerencias de extracción** (finalízalas con Explore/Plan; reutiliza átomos existentes como
Button/IconBox/FloatingCard/SectionHead antes de crear nuevos):
- **Hero** → extraer el **panel de preview** (tarjeta 3D + badges flotantes) y el **snippet de código** a
  sub-componentes; Hero queda como composición (aurora + copy + CTAs + slots).
- **Contact** → extraer el **grupo de campos del form**, el **widget Turnstile** y el **success-msg** a
  sub-componentes; Contact compone.
- **PlanCard** → partir en sub-piezas (cabecera/precio, lista de features, CTA/badge), cada una con su CSS.
- **About** → extraer la **visualización de órbita/ciudades**.
- **HowItWorks / PainPoints / Value / Plans / Footer** → extraer las piezas repetidas (step, bento-card,
  pillar, columna de footer…) como moléculas con su CSS; el organismo compone la lista.

## Reglas (no negociables)
- **TDD:** los tests `[SPEC-SEC-XXX/INV-1]` (línea) ya están en rojo → hazlos verdes **descomponiendo**,
  **no** editando los límites ni los tests de línea. Si creas sub-componentes con su propia spec/atómica,
  añade sus tests.
- **Contenido y props intactos** — cero cambios de copy; solo estructura. El contenido sigue viniendo de
  las Content Collections ([SPEC-CONTENT-001](/specs/SPEC-CONTENT-001.md)).
- **Fidelidad = la guarda:** al terminar, corre el **gate QA-001** (visual vs diseño) y verifica **verde**
  en las secciones tocadas + página completa. Esto prueba que la descomposición no cambió el render.
- **a11y y perf** siguen verdes (axe de página, Lighthouse budgets).
- **SRP/tokens:** cada sub-componente = una responsabilidad, consume tokens, sin hex sueltos, sin Tailwind.
- **Specs:** actualiza la **INV-1** de cada `SPEC-SEC-XXX` afectada para reflejar la nueva descomposición
  (organismo compone; sub-componentes listados). Mantén su estado `Verified` **solo tras** re-pasar el gate.
- **Git:** rama `refactor/SPEC-SEC-srp-decompose`; Conventional Commits (scope por sección), incluye `docs/`.

## Verificación antes de "listo"
```
pnpm lint && pnpm type-check && pnpm test && pnpm test:e2e && pnpm trace -- --check
```
Todo verde: los 10 tests que fallaban ahora pasan (1 de umbral + 9 de línea vía descomposición), el gate
de fidelidad sigue verde, y el número de tests no baja.

## Entregable
CI de `develop` en verde. Resume: qué sub-componentes creaste por organismo, confirma que el gate de
fidelidad (QA-001) pasó en cada sección tocada (diffs bajo umbral), y que no cambió el contenido ni la
API pública de las secciones.
