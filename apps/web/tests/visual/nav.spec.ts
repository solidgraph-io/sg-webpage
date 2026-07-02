/**
 * SPEC-SEC-001/RNF-3 — Nav visual regression
 *
 * Each test:
 *  1. Captures the DESIGN source HTML (attached to report as "design-reference")
 *  2. Captures the ASTRO implementation (attached as "astro-implementation")
 *  3. Locks regression with toHaveScreenshot() against the Astro baseline
 *
 * First run: --update-snapshots creates baselines. Visually compare the
 * two attachments in the HTML report to confirm parity with the design.
 */

import { test, expect } from '@playwright/test';
import { captureDesign, waitForFonts } from './helpers';

test.describe('SPEC-SEC-001/RNF-3 — Nav visual', () => {
  test('[SPEC-SEC-001/RNF-3] nav desktop — design vs astro', async ({ page, browser }, testInfo) => {
    // Design reference (01-nav.html)
    const designPage = await browser.newPage();
    await designPage.setViewportSize({ width: 1440, height: 900 });
    const designShot = await captureDesign(designPage, '01-nav.html', '.nav');
    await designPage.close();
    await testInfo.attach('design-reference', { body: designShot, contentType: 'image/png' });

    // Astro implementation
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForFonts(page);
    const astroShot = await page.locator('.nav').screenshot();
    await testInfo.attach('astro-implementation', { body: astroShot, contentType: 'image/png' });

    // Regression baseline
    await expect(page.locator('.nav')).toHaveScreenshot('nav-desktop.png');
  });

  test('[SPEC-SEC-001/RNF-3] nav mobile 375px', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await waitForFonts(page);
    const shot = await page.locator('.nav').screenshot();
    await testInfo.attach('astro-mobile', { body: shot, contentType: 'image/png' });
    await expect(page.locator('.nav')).toHaveScreenshot('nav-mobile.png');
  });

  test('[SPEC-SEC-001/RNF-3] nav scrolled state', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForFonts(page);
    await page.evaluate(() => window.scrollBy(0, 250));
    await page.waitForTimeout(500); // wait for .scrolled transition
    await expect(page.locator('.nav')).toHaveScreenshot('nav-scrolled.png');
  });
});
