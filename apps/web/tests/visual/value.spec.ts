/**
 * SPEC-SEC-005/RNF-4 + SPEC-QA-001/RF-1 — Value visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

// The fixed nav overlaps below-fold sections when scrolled — hide it for gate comparison.
const HIDE_NAV_CSS = '.nav { display: none !important; }';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-005/RNF-4] value desktop 1440 — diff vs diseño', async ({
  page, browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page, browser, testInfo,
    sectionFile: '05-value.html',
    selector: '.value',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'value-desktop',
    extraCss: HIDE_NAV_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-005/RNF-4] value mobile 393 — diff vs diseño', async ({
  page, browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page, browser, testInfo,
    sectionFile: '05-value.html',
    selector: '.value',
    viewport: { width: 393, height: 852 },
    threshold: 0.10,
    label: 'value-mobile',
    extraCss: HIDE_NAV_CSS,
  });
});

// ── Anti-regresión ────────────────────────────────────────────────────────────

test('[SPEC-SEC-005/RNF-4] value desktop — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await expect(page.locator('.value')).toHaveScreenshot('value-desktop.png');
});

test('[SPEC-SEC-005/RNF-4] value mobile — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  await expect(page.locator('.value')).toHaveScreenshot('value-mobile.png');
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-005/RF-1] value has pillars grid', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.value .pillars')).toBeVisible();
  await expect(page.locator('.value .pillar')).toHaveCount(4);
});

test('[SPEC-SEC-005/RNF-2] no dev toolbar in value', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
