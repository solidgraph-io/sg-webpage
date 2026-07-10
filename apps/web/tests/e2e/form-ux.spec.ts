/**
 * SPEC-FORM-002 — form UX behavior: real-time validation, state machine,
 * confirmation card. /api/lead is mocked (no Resend/Turnstile involved).
 */

import { test, expect, type Page, type Route } from '@playwright/test';
import { runAxe, formatViolations } from '../a11y/helpers';

const FORM = '.contact-form';
const SUBMIT = `${FORM} button[type="submit"]`;
const CARD = '#confirmCard';

async function fillValidForm(page: Page): Promise<void> {
  await page.locator(FORM).scrollIntoViewIfNeeded();
  await page.fill('#first_name', 'Alice');
  await page.fill('#last_name', 'Smith');
  await page.fill('#email', 'alice@example.com');
  await page.fill('#business_name', 'Acme LLC');
  await page.selectOption('#city', 'Charlotte, NC');
}

function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(FORM).scrollIntoViewIfNeeded();
});

// ── RF-1 / RF-2: real-time validation with accessible errors ─────────────────

test('[SPEC-FORM-002/RF-1][SPEC-FORM-002/RF-2] blur on empty email → aria-invalid + own message', async ({
  page,
}) => {
  await page.locator('#email').focus();
  await page.locator('#email').blur();
  await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#email')).toHaveAttribute('aria-describedby', 'email_err');
  await expect(page.locator('#email_err')).toHaveText('Valid email required');
});

test('[SPEC-FORM-002/RF-1] malformed email → error; fixing it re-validates on input', async ({
  page,
}) => {
  await page.fill('#email', 'not-an-email');
  await page.locator('#email').blur();
  await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true');
  // correcting the value clears the error while typing (no second blur needed)
  await page.fill('#email', 'alice@example.com');
  await expect(page.locator('#email')).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#email_err')).toHaveCount(0);
});

test('[SPEC-FORM-002/RF-2] invalid submit paints all errors and focuses the first one', async ({
  page,
}) => {
  await page.locator(FORM).scrollIntoViewIfNeeded();
  await page.locator(SUBMIT).click();
  await expect(page.locator('#first_name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#first_name_err')).toHaveText('First name is required');
  await expect(page.locator('#email_err')).toHaveText('Valid email required');
  await expect(page.locator('#first_name')).toBeFocused();
});

// ── RF-3 / RF-6: submitting state + anti double-submit ────────────────────────

test('[SPEC-FORM-002/RF-3][SPEC-FORM-002/RF-6] valid submit → button disabled with loading label, no double POST', async ({
  page,
}) => {
  let requests = 0;
  let release: () => void = () => undefined;
  const gate = new Promise<void>((r) => (release = r));
  await page.route('**/api/lead', async (route) => {
    requests++;
    await gate;
    await fulfillJson(route, 200, { ok: true });
  });

  await fillValidForm(page);
  await page.locator(SUBMIT).click();

  const btn = page.locator(SUBMIT);
  await expect(btn).toBeDisabled();
  await expect(btn).toContainText('Sending');
  // a second click while submitting must not fire another request
  await btn.click({ force: true });
  expect(requests).toBe(1);

  release();
  await expect(page.locator(CARD)).toBeVisible();
});

// ── RF-4 / RNF-2: confirmation card ───────────────────────────────────────────

test('[SPEC-FORM-002/RF-4][SPEC-FORM-002/RNF-2] success → form replaced by focused status card', async ({
  page,
}) => {
  await page.route('**/api/lead', (route) => fulfillJson(route, 200, { ok: true }));
  await fillValidForm(page);
  await page.locator(SUBMIT).click();

  const card = page.locator(CARD);
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('role', 'status');
  await expect(card).toHaveAttribute('aria-live', 'polite');
  await expect(card).toBeFocused();
  await expect(page.locator(FORM)).toBeHidden();
});

test('[SPEC-FORM-002/RNF-4] confirmation card is not rendered in idle state', async ({ page }) => {
  await expect(page.locator(CARD)).toBeHidden();
  await expect(page.locator(FORM)).toBeVisible();
});

// ── RF-3: server error returns to idle and allows retry ──────────────────────

test('[SPEC-FORM-002/RF-3] server error → back to idle with server errors painted; retry succeeds', async ({
  page,
}) => {
  let call = 0;
  await page.route('**/api/lead', (route) => {
    call++;
    if (call === 1) {
      return fulfillJson(route, 400, { ok: false, errors: { email: ['Valid email required'] } });
    }
    return fulfillJson(route, 200, { ok: true });
  });

  await fillValidForm(page);
  await page.locator(SUBMIT).click();

  // back to idle: button re-enabled with its original label, server error visible
  const btn = page.locator(SUBMIT);
  await expect(btn).toBeEnabled();
  await expect(btn).toContainText('Send My Request');
  await expect(page.locator('#email_err')).toHaveText('Valid email required');

  // leaving the errored field re-validates and clears it (RF-1), settling the
  // layout before the retry tap (blur mid-click would shift the button)
  await page.locator('#email').blur();
  await expect(page.locator('#email_err')).toHaveCount(0);

  await btn.click();
  await expect(page.locator(CARD)).toBeVisible();
  expect(call).toBe(2);
});

test('[SPEC-FORM-002/RF-3] network failure → back to idle with retry possible', async ({
  page,
}) => {
  let call = 0;
  await page.route('**/api/lead', (route) => {
    call++;
    if (call === 1) return route.abort('failed');
    return fulfillJson(route, 200, { ok: true });
  });

  await fillValidForm(page);
  await page.locator(SUBMIT).click();
  await expect(page.locator(SUBMIT)).toBeEnabled();
  await expect(page.locator('#message_err')).toHaveText('Network error. Please try again.');

  // settle the layout before retrying (see server-error test above)
  await page.locator('#message').blur();
  await expect(page.locator('#message_err')).toHaveCount(0);

  await page.locator(SUBMIT).click();
  await expect(page.locator(CARD)).toBeVisible();
});

// ── RNF-2: a11y of the new states ─────────────────────────────────────────────

test('[SPEC-FORM-002/RNF-2] error and success states have 0 WCAG AA violations', async ({
  page,
}) => {
  await page.route('**/api/lead', (route) => fulfillJson(route, 200, { ok: true }));

  // error state
  await page.locator('#email').focus();
  await page.locator('#email').blur();
  await expect(page.locator('#email_err')).toBeVisible();
  let results = await runAxe(page, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  expect(results.violations, formatViolations(results.violations)).toHaveLength(0);

  // success state
  await fillValidForm(page);
  await page.locator(SUBMIT).click();
  await expect(page.locator(CARD)).toBeVisible();
  results = await runAxe(page, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  expect(results.violations, formatViolations(results.violations)).toHaveLength(0);
});
