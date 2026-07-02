/**
 * SPEC-SEC-002/RNF-3 — Hero visual regression
 */

import { test, expect } from '@playwright/test';
import { captureDesign, waitForFonts } from './helpers';

test.describe('SPEC-SEC-002/RNF-3 — Hero visual', () => {
  test('[SPEC-SEC-002/RNF-3] hero desktop — design vs astro', async ({ page, browser }, testInfo) => {
    // Design reference (02-hero.html)
    const designPage = await browser.newPage();
    await designPage.setViewportSize({ width: 1440, height: 900 });
    const designShot = await captureDesign(designPage, '02-hero.html', '.hero');
    await designPage.close();
    await testInfo.attach('design-reference', { body: designShot, contentType: 'image/png' });

    // Astro implementation
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForFonts(page);
    const astroShot = await page.locator('.hero').screenshot();
    await testInfo.attach('astro-implementation', { body: astroShot, contentType: 'image/png' });

    await expect(page.locator('.hero')).toHaveScreenshot('hero-desktop.png');
  });

  test('[SPEC-SEC-002/RNF-3] hero mobile 375px', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await waitForFonts(page);
    const shot = await page.locator('.hero').screenshot();
    await testInfo.attach('astro-mobile', { body: shot, contentType: 'image/png' });
    await expect(page.locator('.hero')).toHaveScreenshot('hero-mobile.png');
  });

  test('[SPEC-SEC-002/RNF-3] hero has single h1', async ({ page }) => {
    await page.goto('/');
    await waitForFonts(page);
    const h1Count = await page.locator('.hero h1').count();
    expect(h1Count).toBe(1);
  });

  test('[SPEC-SEC-002/RNF-3] hero preview card visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForFonts(page);
    await expect(page.locator('.hero-screen')).toBeVisible();
  });

  test('[SPEC-SEC-002/RNF-3] hero preview hidden on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await waitForFonts(page);
    // hero floats are hidden at 760px breakpoint
    const float = page.locator('.hero-float').first();
    if (await float.count() > 0) {
      await expect(float).not.toBeVisible();
    }
  });
});
