/**
 * SPEC-SEC-008/RNF-4 + SPEC-QA-001/RF-1 — Testimonials visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

// Fixed nav hides below-fold sections; restore lilac-2 bg (RESET_CSS makes sections transparent).
// The design page has body { background: var(--lilac-2) } which RESET_CSS overrides to white.
// Both pages get the same treatment so sections still match, but restoring the bg makes cards
// render correctly against their intended surface.
const TESTIMONIALS_EXTRA_CSS = `
  .nav { display: none !important; }
  .testimonials { background: var(--lilac-2) !important; }
`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-008/RNF-4] testimonials desktop 1440 — diff vs diseño', async ({
  page, browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page, browser, testInfo,
    sectionFile: '08-testimonials.html',
    selector: '.testimonials',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'testimonials-desktop',
    extraCss: TESTIMONIALS_EXTRA_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-008/RNF-4] testimonials mobile 393 — diff vs diseño', async ({
  page, browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page, browser, testInfo,
    sectionFile: '08-testimonials.html',
    selector: '.testimonials',
    viewport: { width: 393, height: 852 },
    threshold: 0.10,
    label: 'testimonials-mobile',
    extraCss: TESTIMONIALS_EXTRA_CSS,
  });
});

// ── Anti-regresión ────────────────────────────────────────────────────────────

test('[SPEC-SEC-008/RNF-4] testimonials desktop — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  await expect(page.locator('.testimonials')).toHaveScreenshot('testimonials-desktop.png');
});

test('[SPEC-SEC-008/RNF-4] testimonials mobile — anti-regresión baseline', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  await expect(page.locator('.testimonials')).toHaveScreenshot('testimonials-mobile.png');
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-008/RF-1] has 3 stat cards', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.testimonials .stat')).toHaveCount(3);
});

test('[SPEC-SEC-008/RF-2] has 3 testimonial cards', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.testimonials .t-card')).toHaveCount(3);
});

test('[SPEC-SEC-008/RNF-2] no dev toolbar in testimonials', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
