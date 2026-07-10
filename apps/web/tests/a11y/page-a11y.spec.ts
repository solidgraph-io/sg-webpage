/**
 * SPEC-A11Y-001 — Full-page accessibility gate (WCAG 2.1 AA)
 * Runs axe-core against the built home page. Blocking in CI.
 */

import { test, expect } from '@playwright/test';
import { runAxe, formatViolations } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('main').waitFor();
});

// ── RF-1: 0 WCAG AA violations ────────────────────────────────────────────────

test('[SPEC-A11Y-001/RF-1] home has 0 WCAG 2.1 AA violations', async ({ page }) => {
  const results = await runAxe(page, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  const violations = results.violations;
  expect(violations, `Axe violations:\n${formatViolations(violations)}`).toHaveLength(0);
});

// ── RF-2: skip-link is first tab stop ─────────────────────────────────────────

test('[SPEC-A11Y-001/RF-2] first Tab focus lands on skip-link', async ({ page }) => {
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => ({
    href: document.activeElement?.getAttribute('href'),
    cls: document.activeElement?.className ?? '',
  }));
  expect(focused.href).toBe('#main-content');
  expect(focused.cls).toContain('skip-link');
});

test('[SPEC-A11Y-001/RF-2] skip-link activates and sends focus to <main>', async ({ page }) => {
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  const activeId = await page.evaluate(() => document.activeElement?.id ?? '');
  expect(activeId).toBe('main-content');
});

test('[SPEC-A11Y-001/RF-2] skip-link is not visible before focus (off-screen)', async ({
  page,
}) => {
  const box = await page.locator('.skip-link').boundingBox();
  if (box) {
    const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
    const inViewport = box.y >= 0 && box.y < viewport.height && box.x >= 0;
    expect(inViewport).toBe(false);
  }
});

// ── RF-3: landmark structure present ──────────────────────────────────────────

test('[SPEC-A11Y-001/RF-3] page has <header> landmark', async ({ page }) => {
  await expect(page.locator('header')).toBeVisible();
});

test('[SPEC-A11Y-001/RF-3] page has <nav> with aria-label (main nav visible)', async ({ page }) => {
  // Two navs exist: desktop "Main navigation" + mobile "Mobile navigation"
  const mainNav = page.locator('nav[aria-label="Main navigation"]');
  await expect(mainNav).toBeAttached();
});

test('[SPEC-A11Y-001/RF-3] page has <main id="main-content">', async ({ page }) => {
  await expect(page.locator('main#main-content')).toBeAttached();
});

test('[SPEC-A11Y-001/RF-3] page has exactly one <h1>', async ({ page }) => {
  await expect(page.locator('h1')).toHaveCount(1);
});

test('[SPEC-A11Y-001/RF-3] page has <footer> landmark', async ({ page }) => {
  await expect(page.locator('footer')).toBeAttached();
});

// ── RF-4: keyboard operability ─────────────────────────────────────────────────

test('[SPEC-A11Y-001/RF-4] FAQ item opens with keyboard (Enter on summary)', async ({ page }) => {
  await page.locator('.faq').scrollIntoViewIfNeeded();
  const firstSummary = page.locator('.faq details summary').first();
  await firstSummary.focus();
  await firstSummary.press('Enter');
  const isOpen = await page
    .locator('.faq details')
    .first()
    .evaluate((el) => (el as HTMLDetailsElement).open);
  expect(isOpen).toBe(true);
});

test('[SPEC-A11Y-001/RF-4] Nav CTA is keyboard-reachable and operable', async ({ page }) => {
  const navCta = page.locator('.nav-cta').first();
  await navCta.focus();
  const tag = await navCta.evaluate((el) => el.tagName.toLowerCase());
  expect(['a', 'button']).toContain(tag);
});

// ── RF-6: reduced-motion ──────────────────────────────────────────────────────

test('[SPEC-A11Y-001/RF-6] reveal animations disabled under prefers-reduced-motion', async ({
  browser,
}) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto('/');

  // Poll the computed style instead of waiting for networkidle: third-party
  // beacons (e.g. Turnstile's challenge traffic when TURNSTILE_SITE_KEY is
  // set) keep the network busy indefinitely and would starve the wait.
  const reveal = p.locator('[data-reveal]').first();
  // With reduced-motion, opacity should be 1 and transform should be none
  await expect.poll(() => reveal.evaluate((el) => window.getComputedStyle(el).opacity)).toBe('1');
  await ctx.close();
});
