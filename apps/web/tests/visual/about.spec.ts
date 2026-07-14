/**
 * SPEC-SEC-010/RNF-4 + SPEC-QA-001/RF-1 — About visual gate
 */

import { test, expect } from '@playwright/test';
import { compareWithDesign, waitForStyles } from './helpers';

// Restore lilac-2 bg (RESET_CSS makes sections transparent; design body was also lilac-2).
// Freeze spin/bob: RESET_CSS sets animation-duration:0.001ms which makes them cycle at
// thousands of fps — snapshot captures a random rotation each run. Freeze both pages equally.
const ABOUT_EXTRA_CSS = `
  .nav { display: none !important; }
  .about { background: var(--lilac-2) !important; }
  .orbit { animation: none !important; transform: none !important; }
  .badge-card { animation: none !important; transform: none !important; }
`;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Gate: design vs implementation ───────────────────────────────────────────

test('[SPEC-QA-001/RF-1][SPEC-SEC-010/RNF-4] about desktop 1440 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Desktop gate runs in desktop project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '10-about.html',
    selector: '.about',
    viewport: { width: 1440, height: 900 },
    threshold: 0.08,
    label: 'about-desktop',
    extraCss: ABOUT_EXTRA_CSS,
  });
});

test('[SPEC-QA-001/RF-1][SPEC-SEC-010/RNF-4] about mobile 393 — diff vs diseño', async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile gate runs in mobile project only');
  await compareWithDesign({
    astroPage: page,
    browser,
    testInfo,
    sectionFile: '10-about.html',
    selector: '.about',
    viewport: { width: 393, height: 852 },
    threshold: 0.1,
    label: 'about-mobile',
    extraCss: ABOUT_EXTRA_CSS,
  });
});

// ── Comportamiento ────────────────────────────────────────────────────────────

test('[SPEC-SEC-010/RF-1] about has orbit rings', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.about .orbit')).toHaveCount(2);
});

test('[SPEC-SEC-010/RF-1] about has 3 badge-cards', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.about .badge-card')).toHaveCount(3);
});

// No RF covers per-breakpoint badge visibility; RNF-3 (responsive) is the
// closest — fixed-px cards over a shrinking .about-visual overlap on mobile,
// so they hide under 760px (parity with .hero-float; the info lives on in
// the diff-list). Prompt 50.
test('[SPEC-SEC-010/RNF-3] badges .b1/.b2/.b3 hidden on mobile (430×932)', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await waitForStyles(page);
  for (const sel of ['.about .b1', '.about .b2', '.about .b3']) {
    await expect(page.locator(sel)).toBeHidden();
  }
  // only the badges get display:none — the orbit stays un-hidden. (Its 0×0
  // collapse on mobile is pre-existing and matches the design: `margin: 0 auto`
  // defeats grid stretch and every child is absolutely positioned.)
  for (const orbit of await page.locator('.about .orbit').all()) {
    expect(await orbit.evaluate((el) => getComputedStyle(el).display)).not.toBe('none');
  }
});

test('[SPEC-SEC-010/RF-1] badges .b1/.b2/.b3 visible on desktop (1440)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  for (const sel of ['.about .b1', '.about .b2', '.about .b3']) {
    await expect(page.locator(sel)).toBeVisible();
  }
});

test('[SPEC-SEC-010/RF-2] about has 3 diff items', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.about .diff')).toHaveCount(3);
});

test('[SPEC-SEC-010/RF-2] about has 2 city items', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('.about .city')).toHaveCount(2);
});

test('[SPEC-SEC-010/RNF-2] no dev toolbar in about', async ({ page }) => {
  expect(await page.locator('astro-dev-toolbar').count()).toBe(0);
});
