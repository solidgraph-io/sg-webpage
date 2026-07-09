# ADR-0013 — CD moderno: build-once + promote-image; se rechaza el ladder de environments

- **Estado:** Accepted (2026-07)
- **Contexto:** infra / CI-CD
- **Relacionado:** SPEC-DEPLOY-002 (implementación), SPEC-DEPLOY-001, AGENTS.md §4

## Contexto

El pipeline construía la app 3–4× y corría los gates pesados en serie, con el deploy esperando a
Lighthouse. Al analizar la modernización, se consideró un modelo multi-stage con environments por rama
(`dev/qa/homo/prod`).

## Decisión

Adoptamos las prácticas de **entrega continua moderna** (trunk-based / DORA), **right-sized** para un
sitio productizado operado por una persona:

1. **Build once, promote the same immutable artifact.** Se construye **una** imagen y **la misma** se
   promueve `develop`(dev) → `main`(prod) por **retag** (`sha-<SHA>` → `latest`), sin reconstruir.
2. **Gates una sola vez** sobre ese artefacto (en `develop`), **en paralelo** (fidelidad ∥ a11y ∥ perf)
   contra un único `dist/`. Prod es una **promoción**, no re-corre gates.
3. **Environments = destinos de deploy, no ramas.** Se mantiene `develop` + `main`.

## Rechazado (y por qué)

- **Ladder de environments por rama (`dev/qa/homo/prod`).** Hoy es un **anti-patrón legacy**: causa drift
  entre entornos, fricción de promoción y "funciona en staging, rompe en prod". Los equipos ágiles de alto
  desempeño (DORA/Accelerate) usan **un artefacto promovido** a través de entornos, no una rama por entorno.
  Además, a la escala de un dev solo, 4 entornos = 4× infra (servicio+dominio+secrets) sin beneficio real.
- **Trunk-based puro con feature flags / merges múltiples al día.** Optimizado para equipos grandes con
  alto volumen de cambios; innecesario aquí. Se conserva el flujo ligero `feature/* → develop → main`.

## Consecuencias

- Pipeline mucho más rápido (build 1× + gates en paralelo) **sin** eliminar ningún gate de calidad.
- **Paridad de bits dev↔prod**: prod sirve la imagen exacta certificada en dev (garantía más fuerte que
  "mismos gates re-corridos").
- `perf` (Lighthouse) sale del camino serial pero **sigue bloqueando** en `develop` (honra la promesa del
  README); queda documentado un flag para moverlo a nightly si se prioriza velocidad.
- Refina INV-2 de SPEC-DEPLOY-001: la paridad dev↔prod pasa de "mismos gates" a "**mismo artefacto**".
