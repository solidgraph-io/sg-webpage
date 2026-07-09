/**
 * SPEC-SEC-013/RNF-4 + SPEC-QA-001/RF-1 — Contact visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

// Contact has white bg; RESET_CSS already leaves body white. Just hide nav.
// success-msg is hidden by default in both design and app (no JS submission).
const CONTACT_EXTRA_CSS = `
  .nav { display: none !important; }
`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-013/RNF-4] contact desktop 1440 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop gate runs in desktop project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '13-contact.html',
    selector: '.contact',
    viewport: { width: 1440, height: 900 },
    // 10% (same as mobile): form inputs have intentional width:100%;box-sizing:border-box
    // not in design's form.css — pre-existing diff, not a migration regression.
    threshold: 0.1,
    label: 'contact-desktop',
    extraCss: CONTACT_EXTRA_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-013/RNF-4] contact mobile 393 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile gate runs in mobile project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '13-contact.html',
    selector: '.contact',
    viewport: { width: 393, height: 852 },
    threshold: 0.1,
    label: 'contact-mobile',
    extraCss: CONTACT_EXTRA_CSS,
  });
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-013/RF-3] contact has 8 form fields', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.contact-form .field')).toHaveCount(8);
});

test('[SPEC-SEC-013/RF-3] success-msg hidden by default', async ({ page }) => {
  await waitForStyles(page);
  const el = page.locator('.success-msg');
  await expect(el).toBeHidden();
});

test('[SPEC-SEC-013/RF-2] contact-alt has 3 rows', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.contact-alt .row')).toHaveCount(3);
});

test('[SPEC-SEC-013/RNF-2] no dev toolbar', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
