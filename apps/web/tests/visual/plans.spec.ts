/**
 * SPEC-SEC-007/RNF-4 + SPEC-QA-001/RF-1 — Plans visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

// Fixed nav hides below-fold sections in screenshots.
const HIDE_NAV_CSS = '.nav { display: none !important; }';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-007/RNF-4] plans desktop 1440 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop gate runs in desktop project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '07-plans.html',
    selector: '.plans',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'plans-desktop',
    extraCss: HIDE_NAV_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-007/RNF-4] plans mobile 393 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '07-plans.html',
    selector: '.plans',
    viewport: { width: 393, height: 852 },
    threshold: 0.1,
    label: 'plans-mobile',
    extraCss: HIDE_NAV_CSS,
  });
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-007/RF-1] plans has 4 plan cards', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.plans .plan')).toHaveCount(4);
});

test('[SPEC-SEC-007/RF-1] popular plan has badge', async ({ page }) => {
  await waitForStyles(page);
  const popular = page.locator('.plans .plan.popular');
  await expect(popular).toHaveCount(1);
  await expect(popular.locator('.badge')).toHaveCount(1);
});

test('[SPEC-SEC-007/RF-2] has hosting section with 4 cards', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.plans .hosting-card')).toHaveCount(4);
});

test('[SPEC-SEC-007/RNF-2] no dev toolbar in plans', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
