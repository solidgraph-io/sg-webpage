/**
 * SPEC-SEC-001/RNF-3 + SPEC-QA-001/RF-1 — Nav visual gate
 *
 * Gate principal: compara .nav de la app contra 01-nav.html del diseño con pixelmatch.
 * Falla si diff > umbral. Baselines de anti-regresión (toHaveScreenshot) se regeneran
 * SOLO después de que el gate pase.
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// CSS extra para el gate de nav: oculta los elementos decorativos del hero
// (aurora blobs, spotlight, grid-mesh) que se ven a través del pill semi-transparente.
// En 01-nav.html estos selectores no existen → no-op; en la app eliminan el fondo colorido.
const NAV_EXTRA_CSS = `
  .aurora b, .spotlight, .hero-grid-mesh { display: none !important; }
  section { background: white !important; }
`;

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-001/RNF-3] nav desktop 1440 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop gate runs in desktop project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '01-nav.html',
    selector: '.nav-inner',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'nav-desktop',
    extraCss: NAV_EXTRA_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-001/RNF-3] nav mobile 393 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '01-nav.html',
    selector: '.nav-inner',
    viewport: { width: 393, height: 852 },
    threshold: 0.1,
    label: 'nav-mobile',
    extraCss: NAV_EXTRA_CSS,
  });
});

// ── Anti-regresión (baseline = impl correcta post-gate) ───────────────────────

test('[SPEC-SEC-001/RNF-3] nav desktop — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await expect(page.locator('.nav')).toHaveScreenshot('nav-desktop.png');
});

test('[SPEC-SEC-001/RNF-3] nav mobile — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  await expect(page.locator('.nav')).toHaveScreenshot('nav-mobile.png');
});

test('[SPEC-SEC-001/RNF-3] nav scrolled state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await page.evaluate(() => window.scrollBy(0, 250));
  await page.waitForTimeout(500);
  await expect(page.locator('.nav')).toHaveScreenshot('nav-scrolled.png');
});

// ── Comportamiento ─────────────────────────────────────────────────────────────

test('[SPEC-QA-001/RF-3][SPEC-SEC-001/RNF-3] nav logo no es imagen rota', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  const logo = page.locator('.nav .logo img');
  // naturalWidth > 0 ↔ la imagen cargó correctamente
  const naturalWidth = await logo.evaluate((img: HTMLImageElement) => img.naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);
});

test('[SPEC-QA-001/RF-2] nav no contiene dev toolbar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const toolbar = page.locator('astro-dev-toolbar');
  const count = await toolbar.count();
  expect(count).toBe(0);
});
