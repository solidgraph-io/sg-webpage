---
description: Checklist de calidad antes de abrir PR. Uso: /review-quality
---

# /review-quality

Revisa el cambio y reporta PASS/FAIL por sección:

**Atomic Design + SRP**
- [ ] Componentes pequeños: una responsabilidad, ≤ ~150 líneas cada uno.
- [ ] Reutiliza átomos/moléculas existentes; nada duplicado; markup repetido extraído.
- [ ] Átomos sin lógica de dominio; organismos = bloques del contrato.

**Accesibilidad (WCAG 2.1 AA)**
- [ ] Contraste, foco visible, tabulación lógica, roles/labels, `alt`, islands operables por teclado.
- [ ] Tests `axe` en verde en los componentes tocados.

**Performance**
- [ ] Sin JS salvo islands justificados; imágenes `astro:assets`; Poppins self-hosted.
- [ ] Dentro del presupuesto Lighthouse (LCP/CLS/TBT).

**SEO**
- [ ] Jerarquía de headings (un `h1`); metadatos vía `lib/seo.ts`; JSON-LD si aplica.

**Contrato de contenido**
- [ ] Sin copy/colores hardcodeados (props + tokens); schema Zod cubre el bloque; contenido inválido rompe el build.
- [ ] Organismo desacoplado del copy de SolidGraph (reutilizable en la fábrica).

**Diseño & trazabilidad**
- [ ] Fiel al diseño (`design/`); regresión visual en organismos.
- [ ] Cada `RF/RNF/INV` con test citándolo; `pnpm trace -- --check` verde; sin secretos; rama/commit citan la spec.

Si algo falla, NO abras PR: arregla o abre follow-ups documentados.
