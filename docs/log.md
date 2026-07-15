# Log — SolidGraph Website Knowledge Bundle

Historial cronológico **curado** de decisiones del bundle (OKF §7; archivo reservado, sin
frontmatter). Lo más reciente arriba; cada entrada enlaza al concepto que la registra.
Una línea por decisión — el detalle vive en el ADR/spec/prompt enlazado.

- **2026-07-15** — OKF Fase 4a: `log.md` raíz, higiene de refs muertos post-reset en los specs
  vivos y `okf:check` enmascara zonas de código (fin de falsos positivos)
  ([prompt 52](/prompts/52-okf-phase4a-log-hygiene-check.md)).
- **2026-07-14** — OKF Fase 3: codemod `pnpm okf:link` convierte referencias en prosa en enlaces
  bundle-relativos; `traceability.md` + `pnpm trace` se mantienen como gate mecánico
  ([prompt 51](/prompts/51-okf-phase3-crosslinks.md), [SPEC-DOCS-OKF-001](/specs/SPEC-DOCS-OKF-001.md)).
- **2026-07-14** — Badges flotantes de About ocultos ≤760px, paridad con el Hero; la información
  persiste en la diff-list ([SPEC-SEC-010](/specs/SPEC-SEC-010.md),
  [prompt 50](/prompts/50-about-floats-hide-on-mobile.md)).
- **2026-07-12** — Las animaciones de CSS Modules referencian los `@keyframes` globales con
  `global()` en el nombre: la localización de `animation-name` las mataba en silencio
  ([ADR-0012](/adr/0012-component-as-folder.md), [prompt 49](/prompts/49-fix-css-modules-keyframes-scoping.md)).
- **2026-07-11** — Turnstile se difiere hasta que el formulario entra al viewport + CSS crítico
  inline (perf móvil) ([prompt 47](/prompts/47-mobile-perf-turnstile-lazy-css-inline.md)).
- **2026-07-11** — `TURNSTILE_SITE_KEY` pasa a leerse en runtime (`astro:env` public→secret): la
  clave deja de hornearse en la imagen Docker ([prompt 45](/prompts/45-fix-turnstile-sitekey-runtime.md)).
- **2026-07-10** — Adoptado **OKF v0.1**: `docs/` se convierte en Knowledge Bundle conformante.
  Fases 0–2 el mismo día: spec de conformidad, frontmatter tipado + `pnpm okf:check` en CI, e
  índices de *progressive disclosure* generados por `pnpm okf:index`
  ([ADR-0015](/adr/0015-adopt-open-knowledge-format-okf.md), [SPEC-DOCS-OKF-001](/specs/SPEC-DOCS-OKF-001.md)).
- **2026-07-10** — Formulario de contacto con validación en tiempo real, máquina de estados de
  envío y tarjeta de confirmación ([SPEC-FORM-002](/specs/SPEC-FORM-002.md),
  [prompt 44](/prompts/44-form-ux-validation-state-confirmation.md)).
- **2026-07-09** — Lighthouse 100/100/100/100 local: orden de headings, aspect-ratio del hero y
  logo a tamaño de display con srcset retina ([SPEC-PERF-001](/specs/SPEC-PERF-001.md)).
- **2026-07-09** — El gate `compareWithDesign` contra `design/template/` queda como **única**
  regresión visual; los self-baselines se retiran
  ([ADR-0014](/adr/0014-design-gate-sole-visual-regression.md), [SPEC-QA-001](/specs/SPEC-QA-001.md)).
- **2026-07-08** — CD moderno build-once: un solo `pnpm build`, gates visual/a11y/perf en
  paralelo y stub de promote-image para paridad de bits dev↔prod
  ([ADR-0013](/adr/0013-modern-cd-build-once-promote.md), [SPEC-DEPLOY-002](/specs/SPEC-DEPLOY-002.md)).
- **2026-07-08** — **Component-as-folder** vinculante (`Name.astro` + `Name.module.scss` +
  `Name.types.ts` + barrel) con CSS Modules y tokens; rollout a todas las secciones
  ([ADR-0012](/adr/0012-component-as-folder.md)).
- **2026-07-01** — **Reset del proyecto**: se eliminan los componentes y specs de la era
  anterior; el diseño canónico pasa a `design/template/`. Los IDs `SPEC-LAYOUT-*`,
  `SPEC-BLOCK-1xx` y `ADR-0002..0011` desaparecen del bundle (los prompts históricos que los
  citan se conservan tal cual como registro).
