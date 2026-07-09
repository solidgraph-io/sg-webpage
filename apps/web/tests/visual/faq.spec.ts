/**
 * SPEC-SEC-011/RNF-4 + SPEC-QA-001/RF-1 — FAQ visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

// FAQ has white background — RESET_CSS already leaves body white; just hide nav.
const FAQ_EXTRA_CSS = `
  .nav { display: none !important; }
`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-011/RNF-4] faq desktop 1440 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop gate runs in desktop project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '11-faq.html',
    selector: '.faq',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'faq-desktop',
    extraCss: FAQ_EXTRA_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-011/RNF-4] faq mobile 393 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile gate runs in mobile project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '11-faq.html',
    selector: '.faq',
    viewport: { width: 393, height: 852 },
    threshold: 0.1,
    label: 'faq-mobile',
    extraCss: FAQ_EXTRA_CSS,
  });
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-011/RF-1] faq has 8 faq-item details', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.faq-list details.faq-item')).toHaveCount(8);
});

test('[SPEC-SEC-011/RF-1] all faq-items closed by default', async ({ page }) => {
  await waitForStyles(page);
  const items = page.locator('.faq-list details.faq-item');
  for (let i = 0; i < 8; i++) {
    await expect(items.nth(i)).not.toHaveAttribute('open');
  }
});

test('[SPEC-SEC-011/RF-3] faq-item opens on click without JS reload', async ({ page }) => {
  await waitForStyles(page);
  const first = page.locator('.faq-list details.faq-item').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
});

test('[SPEC-SEC-011/RNF-2] no dev toolbar in faq', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
