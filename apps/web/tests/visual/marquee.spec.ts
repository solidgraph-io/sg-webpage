/**
 * SPEC-SEC-003/RNF-3 + SPEC-QA-001/RF-1 — Marquee visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-003/RNF-3] marquee desktop 1440 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop gate runs in desktop project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '03-marquee.html',
    selector: '.marquee',
    viewport: { width: 1440, height: 300 },
    threshold: 0.08,
    label: 'marquee-desktop',
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-003/RNF-3] marquee mobile 393 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile gate runs in mobile project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '03-marquee.html',
    selector: '.marquee',
    viewport: { width: 393, height: 300 },
    threshold: 0.10,
    label: 'marquee-mobile',
  });
});

// ── Anti-regresión ─────────────────────────────────────────────────────────────

test('[SPEC-SEC-003/RNF-3] marquee desktop — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await expect(page.locator('.marquee')).toHaveScreenshot('marquee-desktop.png');
});

// ── Comportamiento ─────────────────────────────────────────────────────────────

test('[SPEC-SEC-003/RNF-3] marquee animación pausa en hover', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  await page.locator('.marquee').hover();
  const playState = await page
    .locator('.marquee-track')
    .evaluate((el) => getComputedStyle(el).animationPlayState);
  expect(playState).toBe('paused');
});

test('[SPEC-QA-001/RF-2] marquee no contiene dev toolbar', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
