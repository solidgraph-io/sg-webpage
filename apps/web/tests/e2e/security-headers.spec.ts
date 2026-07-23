/**
 * SPEC-SEC-016/RF-1, INV-1 — security headers + CSP against the real running
 * server (build/render-time CSP via experimental.csp; prompt 61). Verifies
 * exactly what the ad-hoc manual check did during development: the header is
 * a genuine `Content-Security-Policy` (not a <meta> tag), script-src carries
 * no `unsafe-inline`, style-src's `unsafe-inline` actually survives (the
 * style-hash-vs-unsafe-inline spec interaction fixed by
 * stripStyleHashesFromCsp), /admin stays exempt, and interacting with the
 * page (the scenario that broke under the old per-request-hash middleware)
 * produces zero CSP violations in the console.
 */

import { test, expect } from '@playwright/test';

test('[SPEC-SEC-016/RF-1] home document carries the security headers', async ({ page }) => {
  const res = await page.goto('/');
  const headers = res?.headers() ?? {};
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toContain('camera=()');
});

test('[SPEC-SEC-016/RF-1][SPEC-SEC-016/INV-1] CSP is a real header (not meta) with the expected directives', async ({
  page,
}) => {
  const res = await page.goto('/');
  const csp = res?.headers()['content-security-policy'];
  expect(csp).toBeTruthy();
  expect(csp).toContain("frame-ancestors 'none'"); // only deliverable via header, never <meta>
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain('https://challenges.cloudflare.com');

  const scriptSrc = /script-src[^;]*/.exec(csp ?? '')?.[0] ?? '';
  expect(scriptSrc).not.toContain('unsafe-inline');

  // style-src keeps unsafe-inline honored — stripStyleHashesFromCsp removes
  // whatever style hash Astro auto-added for legacy scoped <style> blocks,
  // since a hash's mere presence would otherwise silently revoke it (CSP spec).
  const styleSrc = /style-src[^;]*/.exec(csp ?? '')?.[0] ?? '';
  expect(styleSrc).toContain('unsafe-inline');
  expect(styleSrc).not.toMatch(/'sha(256|384|512)-/);

  // no <meta http-equiv="Content-Security-Policy"> duplicate in the document
  await expect(page.locator('meta[http-equiv="Content-Security-Policy" i]')).toHaveCount(0);
});

test('[SPEC-SEC-016/RF-1] /admin is exempt from the strict site CSP', async ({ page }) => {
  const res = await page.goto('/admin/index.html');
  expect(res?.headers()['content-security-policy']).toBeUndefined();
});

test('[SPEC-SEC-016/RNF-1] interacting with the page produces zero CSP violations', async ({
  page,
}) => {
  const violations: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { __v: string[] }).__v ??= [];
      (window as unknown as { __v: string[] }).__v.push(e.violatedDirective);
    });
  });

  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const first = page.locator('#first_name');
  if (await first.count()) {
    await first.fill('Ana');
    await page.locator('#last_name').fill('Gomez');
    await page.locator('#email').fill('ana@example.com');
    await page.locator('#business_name').fill('Ana Co');
  }

  violations.push(
    ...(await page.evaluate(() => (window as unknown as { __v?: string[] }).__v ?? [])),
  );
  expect(violations).toEqual([]);
});
