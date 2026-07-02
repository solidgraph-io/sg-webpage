/**
 * SPEC-SEC-002/RNF-3 + SPEC-QA-001/RF-1 — Hero visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-002/RNF-3] hero desktop 1440 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '02-hero.html',
    selector: '.hero',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'hero-desktop',
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-002/RNF-3] hero mobile 393 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '02-hero.html',
    selector: '.hero',
    viewport: { width: 393, height: 852 },
    threshold: 0.10,
    label: 'hero-mobile',
  });
});

// ── Anti-regresión ─────────────────────────────────────────────────────────────

test('[SPEC-SEC-002/RNF-3] hero desktop — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await expect(page.locator('.hero')).toHaveScreenshot('hero-desktop.png');
});

test('[SPEC-SEC-002/RNF-3] hero mobile — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  await expect(page.locator('.hero')).toHaveScreenshot('hero-mobile.png');
});

// ── Comportamiento ─────────────────────────────────────────────────────────────

test('[SPEC-SEC-002/RNF-3] hero tiene exactamente un h1', async ({ page }) => {
  expect(await page.locator('.hero h1').count()).toBe(1);
});

test('[SPEC-SEC-002/RNF-3] hero preview visible en desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.hero-screen')).toBeVisible();
});

test('[SPEC-SEC-002/RNF-3] hero floats ocultos en mobile', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  const floats = page.locator('.hero-float');
  for (let i = 0; i < await floats.count(); i++) {
    await expect(floats.nth(i)).not.toBeVisible();
  }
});

test('[SPEC-QA-001/RF-3] hero logo del preview no es imagen rota', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  const img = page.locator('.hero .core img');
  const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);
});

test('[SPEC-QA-001/RF-2] hero no contiene dev toolbar', async ({ page }) => {
  const count = await page.locator('astro-dev-toolbar').count();
  expect(count).toBe(0);
});
