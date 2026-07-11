/**
 * SPEC-FORM-001/RNF-2 — Turnstile stays out of the critical path: api.js is
 * injected only when the contact section nears the viewport.
 *
 * The local/CI server runs without TURNSTILE_SITE_KEY (runtime-read since
 * prompt 45), so the widget div is planted as a fixture before the page
 * scripts run; the Cloudflare request itself is stubbed (third-party network
 * is not under test).
 */

import { test, expect } from '@playwright/test';

const API = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const SCRIPT = `script[src="${API}"]`;

test('[SPEC-FORM-001/RNF-2] no Turnstile script in the page when the widget is absent', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('script[src*="turnstile"]')).toHaveCount(0);
});

test.describe('with a widget div present (site key at runtime)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(API, (route) =>
      route.fulfill({ contentType: 'text/javascript', body: '/* stubbed api.js */' }),
    );
    // plant the .cf-turnstile div as soon as the form parses — before the
    // deferred module scripts (and thus the lazy loader) run
    await page.addInitScript(() => {
      const plant = (mo: MutationObserver): void => {
        const form = document.querySelector('.contact-form');
        if (form && !document.querySelector('.cf-turnstile')) {
          const div = document.createElement('div');
          div.className = 'cf-turnstile';
          div.setAttribute('data-sitekey', 'test-key');
          form.append(div);
          mo.disconnect();
        }
      };
      // init scripts run before <html> exists — observe the document itself
      const mo = new MutationObserver(() => plant(mo));
      mo.observe(document, { childList: true, subtree: true });
    });
    await page.goto('/');
    await expect(page.locator('.cf-turnstile')).toHaveCount(1);
  });

  test('[SPEC-FORM-001/RNF-2] api.js is NOT injected while above the fold', async ({ page }) => {
    // give the loader a beat: it must stay quiet at the top of the page
    await page.waitForTimeout(400);
    await expect(page.locator(SCRIPT)).toHaveCount(0);
  });

  test('[SPEC-FORM-001/RNF-2][SPEC-FORM-001/RF-3] scrolling to contact injects api.js exactly once', async ({
    page,
  }) => {
    // scroll to the widget itself (on mobile the section top is still >200px
    // away from it); by the time the user reaches it, api.js must be there
    await page.locator('.cf-turnstile').scrollIntoViewIfNeeded();
    await expect(page.locator(SCRIPT)).toHaveCount(1);

    // scroll away and back: the single-shot guard must not add a second tag
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('.cf-turnstile').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(page.locator(SCRIPT)).toHaveCount(1);
  });
});
