/**
 * SPEC-SEC-004/RNF-4 + SPEC-QA-001/RF-1 — Pain Points visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

// The fixed nav overlaps below-fold sections when scrolled into view — hide it
// so the section screenshot matches the standalone design HTML (which has no nav).
const HIDE_NAV_CSS = '.nav { display: none !important; }';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-004/RNF-4] pain-points desktop 1440 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop gate runs in desktop project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '04-pain-points.html',
    selector: '.pain',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'pain-desktop',
    extraCss: HIDE_NAV_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-004/RNF-4] pain-points mobile 393 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '04-pain-points.html',
    selector: '.pain',
    viewport: { width: 393, height: 852 },
    threshold: 0.1,
    label: 'pain-mobile',
    extraCss: HIDE_NAV_CSS,
  });
});

// ── Anti-regresión ────────────────────────────────────────────────────────────

test('[SPEC-SEC-004/RNF-4] pain-points desktop — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await expect(page.locator('.pain')).toHaveScreenshot('pain-desktop.png');
});

test('[SPEC-SEC-004/RNF-4] pain-points mobile — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  await expect(page.locator('.pain')).toHaveScreenshot('pain-mobile.png');
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-004/RF-1] pain-points has bento grid and feature card', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.pain .bento')).toBeVisible();
  await expect(page.locator('.pain .bento-feature')).toBeVisible();
});

test('[SPEC-SEC-004/RNF-2] no dev toolbar in pain-points', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
