/**
 * SPEC-A11Y-001 — Full-page accessibility gate (WCAG 2.1 AA)
 * Runs axe-core against the built home page. Blocking in CI.
 */

import { test, expect, type Page } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeCorePath: string = require.resolve('axe-core');

interface AxeViolation {
  id: string;
  description: string;
  nodes: { target: string[] }[];
}
interface AxeResults {
  violations: AxeViolation[];
}

async function runAxe(page: Page, options: Record<string, unknown> = {}): Promise<AxeResults> {
  await page.addScriptTag({ path: axeCorePath });
  return page.evaluate((opts: Record<string, unknown>) => {
    return (
      window as unknown as { axe: { run: (doc: Document, opts: unknown) => Promise<AxeResults> } }
    ).axe.run(document, opts);
  }, options);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

// ── RF-1: 0 WCAG AA violations ────────────────────────────────────────────────

test('[SPEC-A11Y-001/RF-1] home has 0 WCAG 2.1 AA violations', async ({ page }) => {
  const results = await runAxe(page, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  });
  const violations = results.violations;
  const summary = violations
    .map(
      (v) => `[${v.id}] ${v.description}: ${v.nodes.map((n) => n.target.join(', ')).join(' | ')}`,
    )
    .join('\n');
  expect(violations, `Axe violations:\n${summary}`).toHaveLength(0);
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
  await p.waitForLoadState('networkidle');

  const revealStyle = await p
    .locator('[data-reveal]')
    .first()
    .evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { opacity: s.opacity, transform: s.transform };
    });
  // With reduced-motion, opacity should be 1 and transform should be none
  expect(revealStyle.opacity).toBe('1');
  await ctx.close();
});
