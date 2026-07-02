/**
 * SPEC-SEC-012/RNF-4 + SPEC-QA-001/RF-1 — CTA Strip visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

// .cta-strip uses var(--night) via a div (RESET_CSS only clears <section>/<main> bgs).
// Hide nav, suppress a3 blob (design only has a1+a2), freeze aurora float animations.
const CTA_EXTRA_CSS = `
  .nav { display: none !important; }
  .aurora .a3 { display: none !important; }
  .aurora b { animation: none !important; transform: none !important; }
`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-012/RNF-4] cta desktop 1440 — diff vs diseño', async ({
  page, browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop gate runs in desktop project only');
  await compareWithDesign({
    astroPage: page, browser, testInfo,
    sectionFile: '12-cta.html',
    selector: '.cta-strip',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'cta-desktop',
    extraCss: CTA_EXTRA_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-012/RNF-4] cta mobile 393 — diff vs diseño', async ({
  page, browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile gate runs in mobile project only');
  await compareWithDesign({
    astroPage: page, browser, testInfo,
    sectionFile: '12-cta.html',
    selector: '.cta-strip',
    viewport: { width: 393, height: 852 },
    threshold: 0.10,
    label: 'cta-mobile',
    extraCss: CTA_EXTRA_CSS,
  });
});

// ── Anti-regresión ────────────────────────────────────────────────────────────

test('[SPEC-SEC-012/RNF-4] cta desktop — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await expect(page.locator('.cta-strip')).toHaveScreenshot('cta-desktop.png');
});

test('[SPEC-SEC-012/RNF-4] cta mobile — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  await expect(page.locator('.cta-strip')).toHaveScreenshot('cta-mobile.png');
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-012/RF-1] cta-strip has dark background (--night)', async ({ page }) => {
  await waitForStyles(page);
  const bg = await page.locator('.cta-strip').evaluate(
    (el) => getComputedStyle(el).backgroundColor
  );
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(bg).not.toBe('transparent');
});

test('[SPEC-SEC-012/RF-1] cta-strip has aurora inside', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.cta-strip .aurora')).toHaveCount(1);
});

test('[SPEC-SEC-012/RF-2] cta-strip has white button', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.cta-strip .btn-white')).toHaveCount(1);
});

test('[SPEC-SEC-012/RNF-2] no dev toolbar in cta', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
