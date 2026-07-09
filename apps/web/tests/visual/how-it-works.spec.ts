/**
 * SPEC-SEC-006/RNF-4 + SPEC-QA-001/RF-1 — How It Works visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

// The fixed nav overlaps below-fold sections when scrolled — hide it for gate comparison.
// Also restore dark section bg (RESET_CSS makes sections transparent) and hide aurora a3
// (design HTML only uses a1+a2; Aurora.astro renders a3 too creating extra blob coverage).
const HOW_EXTRA_CSS = `
  .nav { display: none !important; }
  .how { background: var(--night) !important; }
  .aurora .a3 { display: none !important; }
`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-006/RNF-4] how-it-works desktop 1440 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop gate runs in desktop project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '06-how-it-works.html',
    selector: '.how',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'how-desktop',
    extraCss: HOW_EXTRA_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-006/RNF-4] how-it-works mobile 393 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '06-how-it-works.html',
    selector: '.how',
    viewport: { width: 393, height: 852 },
    threshold: 0.1,
    label: 'how-mobile',
    extraCss: HOW_EXTRA_CSS,
  });
});

// ── Anti-regresión ────────────────────────────────────────────────────────────

test('[SPEC-SEC-006/RNF-4] how-it-works desktop — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await expect(page.locator('.how')).toHaveScreenshot('how-desktop.png');
});

test('[SPEC-SEC-006/RNF-4] how-it-works mobile — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  await expect(page.locator('.how')).toHaveScreenshot('how-mobile.png');
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-006/RF-1] how has 4 step cards', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.how .step')).toHaveCount(4);
});

test('[SPEC-SEC-006/RNF-2] no dev toolbar in how-it-works', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
