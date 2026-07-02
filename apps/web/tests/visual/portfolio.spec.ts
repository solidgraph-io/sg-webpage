/**
 * SPEC-SEC-009/RNF-4 + SPEC-QA-001/RF-1 — Portfolio visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

const HIDE_NAV_CSS = '.nav { display: none !important; }';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-009/RNF-4] portfolio desktop 1440 — diff vs diseño', async ({
  page, browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page, browser, testInfo,
    sectionFile: '09-portfolio.html',
    selector: '.portfolio',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'portfolio-desktop',
    extraCss: HIDE_NAV_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-009/RNF-4] portfolio mobile 393 — diff vs diseño', async ({
  page, browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page, browser, testInfo,
    sectionFile: '09-portfolio.html',
    selector: '.portfolio',
    viewport: { width: 393, height: 852 },
    threshold: 0.10,
    label: 'portfolio-mobile',
    extraCss: HIDE_NAV_CSS,
  });
});

// ── Anti-regresión ────────────────────────────────────────────────────────────

test('[SPEC-SEC-009/RNF-4] portfolio desktop — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await expect(page.locator('.portfolio')).toHaveScreenshot('portfolio-desktop.png');
});

test('[SPEC-SEC-009/RNF-4] portfolio mobile — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  await expect(page.locator('.portfolio')).toHaveScreenshot('portfolio-mobile.png');
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-009/RF-1] portfolio has 3 cards', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.portfolio .p-card')).toHaveCount(3);
});

test('[SPEC-SEC-009/RF-1] center-cta button exists', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.portfolio .center-cta .btn')).toHaveCount(1);
});

test('[SPEC-SEC-009/RNF-2] no dev toolbar in portfolio', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
