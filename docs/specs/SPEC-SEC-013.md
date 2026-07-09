# SPEC-SEC-013 — Sección 13: Contact (UI del formulario)

- **ID:** SPEC-SEC-013
- **Estado:** Approved
- **Épica / Story:** EPIC-21 / STORY-210 (secciones)
- **Capa atómica:** organism (sección) — port directo
- **Depende de:** SPEC-DS-001, SPEC-QA-001
- **Fuente:** `design/template/sections/13-contact.html` (+ `components/{form,icon-box}.css`)

## Contexto / problema

"Get a Free Quote": sección **clara** con formulario + info de contacto. Port 1:1 de la **UI**. El
**envío** (`/api/lead`, validación JS, mensaje de éxito) es **EPIC-06 (diferido)** — aquí solo la UI.

## Requisitos funcionales (testeables)

- **RF-1 (estructura/estilo)** — `Contact.astro` porta `13-contact.html`: `contact-grid` (2 col): izquierda (`Eyebrow?` + h2 + `lead` + `contact-alt` con filas `IconBox`+label+value) y derecha (`form.contact-form` con `field-grid`).
- **RF-2 (FormField)** — molécula `FormField` (label + control `input`/`select`/`textarea` + error/hint) con semántica accesible (`label[for]`, `aria-describedby`, `aria-invalid` cuando hay error). El `success-msg` existe pero **oculto por defecto** (lo activará EPIC-06).
- **RF-3 (contenido tipado)** — props: `eyebrow?`,`heading`,`lead?`,`alt`{`heading`,`rows[]`{`icon`,`label`,`value`}}, `form`{`fields[]`{`name`,`label`,`type`,`required?`,`options?[]`,`full?`},`submitLabel`,`privacy?`,`successMessage`}. Copy por props.
- **RF-4 (hooks)** — `data-reveal`/`--d`.

## Requisitos no funcionales

- **RNF-1 (a11y)** — cada campo con etiqueta programática; `required` accesible; foco visible; contraste AA.
- **RNF-2 (perf)** — sin JS por sección (la lógica de envío llega en EPIC-06).
- **RNF-3 (responsive)** — 2col→1col; field-grid 2→1.
- **RNF-4 (fidelidad)** — **gate compareWithDesign** (SPEC-QA-001): diff contra `13-contact.html` (estado por defecto, success oculto) bajo umbral (desktop+mobile). Self-baselines (`toHaveScreenshot`) retirados per ADR-0014.

## Invariantes

- **INV-1 (SRP)** — `Contact.astro` ≤ ~150 líneas delegando en `FormField`.
- **INV-2** — color/medida por tokens; copy/labels por props; sin lógica de envío.

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: contact UI fiel, sin lógica de envío
  Given alt y form
  When se renderiza contra 13-contact.html (success oculto)
  Then coincide (bajo umbral): info de contacto + formulario accesible; el success-msg no se muestra
```

## Fuera de alcance

- Envío `/api/lead`, validación JS, mensaje de éxito → **EPIC-06 / SPEC-FORM-001**.

## Trazabilidad

- **Tests:** `[SPEC-SEC-013/RF-1..4]`, `[.../RNF-1..4]`, `[.../INV-1..2]` — render + a11y del form + gate de fidelidad.
- **PRs:** —
