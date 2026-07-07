---
name: design-to-components
description: >
  Convierte el diseño de SolidGraph (export de Claude Design / HTML standalone) en componentes
  Astro siguiendo Atomic Design + Single Responsibility Principle. Úsala cuando haya que
  "convertir el diseño a componentes", "pasar el diseño a código", "implementar el diseño",
  "extraer átomos/moléculas/organismos", "de Claude Design a Astro", o construir cualquier
  bloque/organismo a partir del diseño. Se integra con SDD/TDD (AGENTS.md): cada componente
  nace de una spec y tests en rojo.
---

# Design → Components (Atomic Design + SRP)

Convierte el diseño **ya definido** de SolidGraph en componentes Astro pequeños, testeables y
reutilizables. **No** es un pegado 1:1 del HTML: es una descomposición en capas atómicas con
una única responsabilidad por componente.

## 0. Fuente del diseño (canónica)

**El diseño se toma del HTML de ejemplo**, el export standalone de Claude Design. Es la única
fuente de verdad visual:

```
design/solidgraph-website.html
```

> Copia de referencia mientras no esté dentro del repo:
> `../agency-structure/Agency Structure/assets/SolidGraph Website (standalone).html`.
> Ver `design/README.md`.

Es un **bundle**: el markup va como JSON en `<script type="__bundler/template">` (React/JSX
compilado) y los assets en base64 en `<script type="__bundler/manifest">`. Cómo extraer:

- **Visual (regla):** ábrelo en el navegador → es el objetivo pixel de cada organismo
  (regresión visual de Playwright compara contra él).
- **Estructura/copy:** inspecciona el DOM en el navegador, o `grep` sobre el archivo para sacar
  textos, clases y estilos del template embebido.
- **Tokens:** ya extraídos en `docs/01-architecture-and-stack.md` §5 (Poppins; navy #131634;
  azules #3a4db0/#5c70d6/#7d8ef0; acento #34d39a).

No hay un MCP dedicado de Claude Design (verificado en el registro). _Solo si algún día se migra
el diseño a Figma_, podría usarse el Figma MCP (`get_design_context`, `get_variable_defs`); por
ahora, la fuente es este HTML.

**No se copia el HTML 1:1**: se descompone en Atomic Design + SRP (§1–§3).

## 1. Atomic Design — las 5 capas

| Capa          | Qué es                               | Regla                                             | Dónde                                    |
| ------------- | ------------------------------------ | ------------------------------------------------- | ---------------------------------------- |
| **Atoms**     | primitivos sin lógica de negocio     | no conocen el dominio; solo props visuales        | `src/components/atoms/`                  |
| **Molecules** | 2–3 átomos con un propósito          | una responsabilidad; reutilizable                 | `src/components/molecules/`              |
| **Organisms** | secciones = **bloques** del contrato | componen moléculas/átomos; reciben `block` tipado | `src/components/organisms/`              |
| **Templates** | layout que ordena organismos         | `BaseLayout` + `BlockRenderer`                    | `src/components/templates/` + `layouts/` |
| **Pages**     | página real con contenido            | cargan Content Collections                        | `src/pages/`                             |

**Los organismos SON los bloques** del contrato (`packages/blocks-contract`). Átomos y moléculas
son sus piezas internas; se comparten entre organismos.

### Mapa concreto para este diseño

- **Atoms:** `Logo`, `Button` (primary/secondary/link), `Icon`, `Eyebrow`, `Heading`, `Prose`,
  `Badge`, `PriceTag`, `Avatar`, `Divider`, `Input`, `Textarea`.
- **Molecules:** `NavItem`, `CtaGroup`, `PlanFeature` (check+texto), `StepItem`, `StatItem`,
  `TestimonialCard`, `FaqItem` (island acordeón), `FeatureItem` (icono+título+texto),
  `PlanCard`, `FooterColumn`, `FormField`.
- **Organisms (= bloques):** `Nav`, `Hero`, `PainPoints`, `ValueProp`, `Process`, `Pricing`,
  `MaintenancePlans`, `Stats`, `Testimonials`, `CtaBand`, `About`, `Faq`, `Footer`.
- **Templates:** `PageTemplate` (BlockRenderer sobre organismos) dentro de `BaseLayout`.
- **Pages:** `index.astro` (home) + páginas legales.

## 2. Single Responsibility Principle — componentes pequeños

- **Un componente = un archivo = una responsabilidad.** Si hace dos cosas, se parte.
- **Límite duro:** un componente que supere **~150 líneas** (o con >1 responsabilidad, o con
  markup repetido) **debe** descomponerse en átomos/moléculas. Nada de componentes gigantes.
- **Extrae en cuanto se repita:** si un fragmento de markup aparece 2 veces, conviértelo en
  átomo/molécula.
- **Sin lógica de negocio en átomos.** Los átomos no conocen `pricing`, `plan`, etc.: solo props.
- **Contenido y color por fuera:** copy vía props desde Content Collections; color/spacing vía
  tokens (`tokens.css` / Tailwind). Nunca hardcodear (regla dura AGENTS.md §4).

## 3. Flujo de conversión (bottom-up, integrado con SDD/TDD)

Siempre **de abajo hacia arriba** para que la composición reutilice:

1. **Tokens primero.** Extrae colores/tipografía/spacing del diseño → `tokens.css` + config de
   Tailwind. (Spec `SPEC-LAYOUT-001`.)
2. **Inventario.** Recorre el diseño y lista átomos → moléculas → organismos (usa el mapa §1).
   Anota variantes (p. ej. `Button` primary/secondary/link).
3. **Átomos.** Por cada átomo: `/new-spec BLOCK "<Atom>"` (o dominio `LAYOUT` para primitivos) →
   TDD (`/tdd`) → componente pequeño. Test de render + a11y + variantes.
4. **Moléculas.** Componen átomos. Spec + TDD. Test de que renderizan sus átomos con las props.
5. **Organismos (bloques).** Define la variante Zod en `packages/blocks-contract`, luego el
   organismo que compone moléculas/átomos. Spec + TDD + **regresión visual** contra el export.
6. **Template + página.** `BlockRenderer` mapea `block.type` → organismo; `index.astro` carga el
   contenido. Test e2e de la home montada.

Cada paso respeta la regla de oro de trazabilidad (`[SPEC-XXX/RF-y]`) y la DoD.

## 4. Checklist de conversión de un organismo (bloque)

- [ ] Spec creada y aprobada (`/new-spec`), con RF/RNF/INV y contrato Zod.
- [ ] Descompuesto en átomos/moléculas existentes (reutiliza; crea solo lo nuevo).
- [ ] Ningún componente > ~150 líneas; una responsabilidad cada uno.
- [ ] Sin copy/colores hardcodeados (props + tokens).
- [ ] Tests: render (`astro/container`), contrato Zod, a11y (axe AA), regresión visual vs. diseño.
- [ ] Registrado en `BlockRenderer` (`lib/blocks.ts`) y en la union del contrato.
- [ ] `pnpm trace -- --check` en verde; commit citando la spec.

## 5. Anti-patrones

- Volcar una sección entera del diseño en un solo `.astro` gigante.
- Duplicar markup entre organismos en vez de extraer una molécula/átomo.
- Meter lógica de dominio o copy fijo en un átomo.
- Saltarse la spec/tests "porque solo estoy maquetando".
