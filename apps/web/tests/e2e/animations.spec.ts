/**
 * SPEC-DS-001/RF-4 — shared @keyframes actually apply at runtime.
 *
 * Regression guard: CSS Modules localizes the *value* of animation-name, so a
 * module rule like `animation: bob …` compiles to a hashed name (`_bob_xxxx`)
 * that doesn't exist in the global animations.css — the animation dies
 * silently while markup and keyframes both look fine to static tests. Only
 * the *computed* animation-name catches it.
 */

import { test, expect, type Page } from '@playwright/test';

// selector → keyframe name expected from the global animations.css
const ANIMATED: ReadonlyArray<[selector: string, keyframe: string]> = [
  ['.f1', 'bob'],
  ['.f2', 'bob'],
  ['.b1', 'bob'],
  ['.b2', 'bob'],
  ['.b3', 'bob'],
  ['.orbit', 'spin'],
];

function computedAnimation(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const s = window.getComputedStyle(el);
      return {
        name: s.animationName,
        duration: s.animationDuration,
        direction: s.animationDirection,
      };
    });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
});

for (const [selector, keyframe] of ANIMATED) {
  test(`[SPEC-DS-001/RF-4] computed animation-name of ${selector} is the global "${keyframe}" (not a hash, not none)`, async ({
    page,
  }) => {
    const { name } = await computedAnimation(page, selector);
    expect(name).toBe(keyframe);
  });
}

test('[SPEC-DS-001/RF-4] .o2 keeps its duration/direction overrides on the global spin', async ({
  page,
}) => {
  const o2 = await computedAnimation(page, '.orbit.o2');
  expect(o2.name).toBe('spin');
  expect(o2.duration).toBe('28s');
  expect(o2.direction).toBe('reverse');
});
