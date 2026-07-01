# Diseño — fuente de verdad visual

El diseño del sitio **ya está definido** y su **fuente canónica** es el export de Claude Design
en formato HTML standalone:

```
solidgraph-website.html
```

> **Estado:** pendiente de copiar dentro de este repo. Copia de referencia actual:
> `../../agency-structure/Agency Structure/assets/SolidGraph Website (standalone).html`
> (547 KB). Cópialo aquí como `design/solidgraph-website.html` para que el repo sea
> autocontenido.
>
> **Logos de la empresa:** en **`design/assets/`** (logos + favicon de SolidGraph). Desde ahí se
> copian los necesarios a `apps/web/public/`.

## Qué es este archivo
Un **bundle autocontenido** de Claude Design:
- El markup real va como JSON en `<script type="__bundler/template">` (React/JSX compilado).
- Los assets (imágenes/logos) van en base64 dentro de `<script type="__bundler/manifest">`.
- Al abrirlo en un navegador se renderiza el diseño completo (requiere JS).

## Cómo se usa (skill `design-to-components`)
1. **Referencia visual / regresión:** ábrelo en el navegador; es el objetivo pixel de los
   organismos (Playwright visual regression compara contra él).
2. **Estructura y copy:** inspecciona el DOM en el navegador, o extrae texto/estilos del
   template embebido (grep sobre el archivo).
3. **Tokens:** ya extraídos en `docs/01-architecture-and-stack.md` §5 (Poppins; navy #131634;
   azules #3a4db0/#5c70d6/#7d8ef0; acento #34d39a).

## Inventario (secciones → organismos)
Nav · Hero ("You Own Everything · Built From Scratch") · PainPoints ("The Walls You Hit") ·
ValueProp · Process ("How It Works", 6 pasos) · Pricing ("No Hidden Fees": Nano/Micro/Pro/…) ·
MaintenancePlans ("Keep Your Site Running Smoothly") · Stats · Testimonials · CtaBand ·
About ("Developers Who Build From Scratch") · Faq · Footer.

> Regla: no se copia el HTML 1:1. Se **descompone** en Atomic Design + SRP (ver la skill y
> `AGENTS.md` §2).
