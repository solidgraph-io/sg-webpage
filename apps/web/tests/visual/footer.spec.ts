/**
 * SPEC-SEC-014/RNF-4 + SPEC-QA-001/RF-1 — Footer visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

// <footer> keeps var(--night-2): RESET_CSS only clears section/main backgrounds.
// Just hide nav. foot-big watermark is pure CSS (no animations).
const FOOTER_EXTRA_CSS = `
  .nav { display: none !important; }
`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-014/RNF-4] footer desktop 1440 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop gate runs in desktop project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '14-footer.html',
    selector: 'footer',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'footer-desktop',
    extraCss: FOOTER_EXTRA_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-014/RNF-4] footer mobile 393 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile gate runs in mobile project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '14-footer.html',
    selector: 'footer',
    viewport: { width: 393, height: 852 },
    threshold: 0.1,
    label: 'footer-mobile',
    extraCss: FOOTER_EXTRA_CSS,
  });
});

// ── Anti-regresión ────────────────────────────────────────────────────────────

test('[SPEC-SEC-014/RNF-4] footer desktop — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await expect(page.locator('footer')).toHaveScreenshot('footer-desktop.png');
});

test('[SPEC-SEC-014/RNF-4] footer mobile — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  await expect(page.locator('footer')).toHaveScreenshot('footer-mobile.png');
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-014/RF-1] footer has dark background', async ({ page }) => {
  await waitForStyles(page);
  const bg = await page.locator('footer').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(bg).not.toBe('transparent');
});

test('[SPEC-SEC-014/RF-3] footer has 3 nav columns', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('footer .foot-col')).toHaveCount(3);
});

test('[SPEC-SEC-014/RF-2] footer has location pills', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('footer .locs span')).toHaveCount(2);
});

test('[SPEC-SEC-014/RNF-2] no dev toolbar', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
