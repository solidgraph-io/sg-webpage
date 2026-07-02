/**
 * SPEC-SEC-003/RNF-3 — Marquee visual regression
 */

import { test, expect } from '@playwright/test';
import { captureDesign, waitForFonts } from './helpers';

test.describe('SPEC-SEC-003/RNF-3 — Marquee visual', () => {
  test('[SPEC-SEC-003/RNF-3] marquee desktop — design vs astro', async ({ page, browser }, testInfo) => {
    // Design reference
    const designPage = await browser.newPage();
    await designPage.setViewportSize({ width: 1440, height: 200 });
    const designShot = await captureDesign(designPage, '03-marquee.html', '.marquee');
    await designPage.close();
    await testInfo.attach('design-reference', { body: designShot, contentType: 'image/png' });

    // Astro implementation
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await waitForFonts(page);
    const astroShot = await page.locator('.marquee').screenshot();
    await testInfo.attach('astro-implementation', { body: astroShot, contentType: 'image/png' });

    await expect(page.locator('.marquee')).toHaveScreenshot('marquee-desktop.png');
  });

  test('[SPEC-SEC-003/RNF-3] marquee animation paused on hover', async ({ page }) => {
    await page.goto('/');
    await waitForFonts(page);
    // Remove dev toolbar so it doesn't intercept pointer events
    await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
    const track = page.locator('.marquee-track');
    await page.locator('.marquee').hover();
    const playState = await track.evaluate(
      el => getComputedStyle(el).animationPlayState,
    );
    expect(playState).toBe('paused');
  });
});
