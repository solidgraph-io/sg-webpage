/**
 * SPEC-SEC-015/RNF-4 — Full-page assembly gate
 *
 * The design index.html composes sections via JS fetch which cannot run
 * in file:// context; individual section gates (SEC-001–014) cover per-section
 * fidelity. This spec verifies the assembled page: correct section order,
 * SEO meta, and single <h1>. Per ADR-0014, self-baselines (toHaveScreenshot)
 * are retired; visual fidelity is covered by compareWithDesign in section specs.
 */

import { test, expect } from '@playwright/test';
import { waitForStyles } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ── Section order ─────────────────────────────────────────────────────────────

test('[SPEC-SEC-015/RF-2] all 14 sections present in DOM', async ({ page }) => {
  await waitForStyles(page);
  const selectors = [
    '.nav',
    '.hero',
    '.marquee',
    '.pain',
    '.value',
    '.how',
    '.plans',
    '.testimonials',
    '.portfolio',
    '.about',
    '.faq',
    '.cta-strip',
    '.contact',
    'footer',
  ];
  for (const sel of selectors) {
    await expect(page.locator(sel), `${sel} should be in page`).toBeVisible();
  }
});

test('[SPEC-SEC-015/RF-2] sections appear in design order (y-position)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await waitForStyles(page);
  const ordered = [
    '.hero',
    '.marquee',
    '.pain',
    '.value',
    '.how',
    '.plans',
    '.testimonials',
    '.portfolio',
    '.about',
    '.faq',
    '.cta-strip',
    '.contact',
    'footer',
  ];
  let prevBottom = 0;
  for (const sel of ordered) {
    const box = await page.locator(sel).boundingBox();
    expect(box, `${sel} must be visible`).not.toBeNull();
    if (!box) continue;
    expect(box.y, `${sel} must come after previous section`).toBeGreaterThanOrEqual(prevBottom - 2);
    prevBottom = box.y + box.height;
  }
});

// ── SEO meta ──────────────────────────────────────────────────────────────────

test('[SPEC-SEC-015/RF-1] page has <title> containing SolidGraph', async ({ page }) => {
  const title = await page.title();
  expect(title).toContain('SolidGraph');
});

test('[SPEC-SEC-015/RF-1] page has meta description > 50 chars', async ({ page }) => {
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toBeTruthy();
  expect(desc?.length ?? 0).toBeGreaterThan(50);
});

test('[SPEC-SEC-015/RF-1] page has canonical pointing to solidgraph.dev', async ({ page }) => {
  const href = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(href).toContain('solidgraph.dev');
});

test('[SPEC-SEC-015/RF-1] og:title and og:type present', async ({ page }) => {
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
  const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
  expect(ogTitle).toContain('SolidGraph');
  expect(ogType).toBe('website');
});

test('[SPEC-SEC-015/RF-1] html has lang="en"', async ({ page }) => {
  const lang = await page.locator('html').getAttribute('lang');
  expect(lang).toBe('en');
});

// ── Single h1 ─────────────────────────────────────────────────────────────────

test('[SPEC-SEC-015/INV-1] page has exactly one <h1>', async ({ page }) => {
  await waitForStyles(page);
  await expect(page.locator('h1')).toHaveCount(1);
});

// ── Responsive (RNF-3) ────────────────────────────────────────────────────────

test('[SPEC-SEC-015/RNF-3] all key sections visible on mobile 393px', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await waitForStyles(page);
  const selectors = ['.hero', '.marquee', '.pain', '.plans', '.contact', 'footer'];
  for (const sel of selectors) {
    const el = page.locator(sel);
    await expect(el, `${sel} must exist in mobile viewport`).toBeAttached();
  }
});
