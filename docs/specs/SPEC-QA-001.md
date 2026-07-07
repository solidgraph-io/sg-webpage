# SPEC-QA-001 — Gate de fidelidad: regresión visual contra el DISEÑO (no contra sí misma)

- **ID:** SPEC-QA-001
- **Estado:** Implemented
- **Épica / Story:** EPIC-21 / STORY-219 (calidad/fidelidad)
- **Capa atómica:** tooling / test harness
- **Depende de:** SPEC-DS-001, SPEC-SEC-001..003

## Contexto / problema

La regresión visual actual usa como **baseline la propia implementación**, así que un organismo
infiel **pasa en verde**. Revisión de arquitecto sobre las capturas encontró: **Hero** con fondo
claro en vez de `--night` (inversión de tema), **logos rotos**, **panel de preview** descuadrado y
la **dev toolbar de Astro** dentro de la captura; **Marquee** prácticamente en blanco. Hay que
convertir la fidelidad en un **gate real**: comparar la implementación contra el **diseño** fuente.

## Requisitos funcionales (testeables)

- **RF-1 (design-as-reference)** — cada test visual de sección captura (a) la sección renderizada de la app y (b) la sección del diseño `design/template/sections/NN-*.html`, **en el mismo viewport/device**, y **compara ambas** (pixelmatch). **Falla** si el ratio de diferencia supera el umbral (`maxDiffPixelRatio` ≈ 0.08 desktop / 0.10 mobile). El **diseño es la referencia**, no la implementación.
- **RF-2 (sin artefactos)** — desactivar la **dev toolbar de Astro** en las capturas (`devToolbar.enabled=false` o correr contra el build/preview, no dev). Ninguna captura debe incluir UI de dev.
- **RF-3 (assets + fuentes)** — garantizar que **fuentes** (waitForFonts) y **assets locales** (logos) cargan en ambas capturas; corregir rutas de logo (copiar a `public/` + `src` correcto) para que **no haya imágenes rotas**.
- **RF-4 (re-baseline)** — los baselines de implementación solo se (re)generan **después** de que el diff contra el diseño pase el umbral. El diff contra el diseño es el gate; el baseline de implementación queda como anti-regresión secundario.
- **RF-5 (CI)** — el gate de fidelidad corre en el pipeline (bloqueante) junto a lint/type-check/test/trace.

## Requisitos no funcionales

- **RNF-1** — umbral tolerante a sub-pixel/antialiasing pero que **atrapa** errores gruesos (tema invertido, layout roto, imágenes ausentes).
- **RNF-2** — el reporte adjunta diseño + implementación + diff para inspección.

## Invariantes

- **INV-1** — una sección es `Verified` **solo** si su diff contra el diseño está bajo umbral.
- **INV-2** — ninguna captura de baseline contiene la dev toolbar ni imágenes rotas.

## Correcciones de fidelidad requeridas (para pasar el gate)

- **SEC-002 Hero:** fondo **`--night`** oscuro con texto blanco (corregir inversión); **preview panel** (chrome + izquierda + rings/core + floats) posicionado como el diseño; logos renderizan.
- **SEC-003 Marquee:** banda **oscura** con los items en scroll visibles (no en blanco).
- **SEC-001 Nav:** el **logo** carga (sin imagen rota).

## Criterios de aceptación (Gherkin)

```gherkin
Scenario: el gate atrapa el tema invertido
  Given un Hero renderizado con fondo claro (inversión)
  When corre el test visual contra design/template/sections/02-hero.html
  Then el diff supera el umbral y el test FALLA

Scenario: captura limpia
  Given cualquier snapshot de sección
  When se genera
  Then no contiene la dev toolbar de Astro ni imágenes rotas

Scenario: fidelidad verde real
  Given Hero/Marquee/Nav corregidos
  When corren los tests visuales contra el diseño
  Then el diff está bajo umbral en desktop y mobile
```

## Fuera de alcance

- Secciones 04..14 (se benefician del gate, pero se implementan en sus specs).

## Trazabilidad

- **Tests:** `[SPEC-QA-001/RF-1..5]`, `[.../RNF-1..2]`, `[.../INV-1..2]` — comparación impl-vs-diseño, ausencia de dev toolbar, assets/fuentes, corrección Hero/Marquee/Nav.
- **PRs:** — · **ADR:** ADR-0007 posible ("fidelidad = regresión visual contra el diseño como gate").
