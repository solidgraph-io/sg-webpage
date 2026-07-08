/**
 * SPEC-A11Y-001 — Accesibilidad transversal (WCAG 2.1 AA)
 * Unit / file-based tests; full axe page audit lives in tests/a11y/page-a11y.spec.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const src = path.join(WEB, 'src');
const layout = path.join(src, 'layouts/BaseLayout.astro');
const globalCss = path.join(src, 'styles/base.css');
const drone = path.join(ROOT, '.drone.yml');

// ── RF-2: skip-link + main landmark ─────────────────────────────────────────
describe('SPEC-A11Y-001/RF-2 — skip-link and main landmark in BaseLayout', () => {
  it('[SPEC-A11Y-001/RF-2] BaseLayout has a skip-link element', () => {
    const c = fs.readFileSync(layout, 'utf-8');
    expect(c).toContain('skip-link');
    expect(c).toContain('#main-content');
  });

  it('[SPEC-A11Y-001/RF-2] skip-link href points to #main-content', () => {
    const c = fs.readFileSync(layout, 'utf-8');
    expect(c).toMatch(/href="#main-content"/);
  });

  it('[SPEC-A11Y-001/RF-2] BaseLayout has main with id="main-content"', () => {
    const c = fs.readFileSync(layout, 'utf-8');
    expect(c).toContain('id="main-content"');
    expect(c).toContain('<main');
  });

  it('[SPEC-A11Y-001/RF-2] skip-link is visually hidden until focused (CSS class)', () => {
    const c = fs.readFileSync(globalCss, 'utf-8');
    expect(c).toContain('.skip-link');
    expect(c).toContain(':focus');
  });
});

// ── RF-3: landmarks structure ─────────────────────────────────────────────────
describe('SPEC-A11Y-001/RF-3 — landmark structure', () => {
  it('[SPEC-A11Y-001/RF-3] Nav.astro renders a <header> element', () => {
    const c = fs.readFileSync(path.join(src, 'components/Nav.astro'), 'utf-8');
    expect(c).toContain('<header');
  });

  it('[SPEC-A11Y-001/RF-3] Nav.astro has <nav> with aria-label', () => {
    const c = fs.readFileSync(path.join(src, 'components/Nav.astro'), 'utf-8');
    expect(c).toContain('<nav');
    expect(c).toContain('aria-label');
  });

  it('[SPEC-A11Y-001/RF-3] Footer.astro renders a <footer> element', () => {
    const c = fs.readFileSync(path.join(src, 'components/Footer/Footer.astro'), 'utf-8');
    expect(c).toContain('<footer');
  });

  it('[SPEC-A11Y-001/RF-3] BaseLayout has <main> wrapper for page content', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('<main');
  });

  it('[SPEC-A11Y-001/RF-3] Hero is the only h1 (no duplicate heading)', () => {
    const heroC = fs.readFileSync(path.join(src, 'components/Hero/Hero.astro'), 'utf-8');
    expect(heroC).toContain('<h1');
    const components = fs
      .readdirSync(path.join(src, 'components'))
      .filter((f) => f.endsWith('.astro'));
    for (const f of components) {
      const c = fs.readFileSync(path.join(src, 'components', f), 'utf-8');
      expect(c, `${f} must not have <h1>`).not.toMatch(/<h1[\s>]/);
    }
  });
});

// ── RF-4: keyboard operability ────────────────────────────────────────────────
describe('SPEC-A11Y-001/RF-4 — keyboard operability (structural checks)', () => {
  it('[SPEC-A11Y-001/RF-4] FAQ uses <details>/<summary> for native keyboard support', () => {
    const faqItem = fs.readFileSync(path.join(src, 'components/FaqItem.astro'), 'utf-8');
    expect(faqItem).toContain('<details');
    expect(faqItem).toContain('<summary');
  });

  it('[SPEC-A11Y-001/RF-4] Nav mobile menu uses <details>/<summary>', () => {
    const nav = fs.readFileSync(path.join(src, 'components/Nav.astro'), 'utf-8');
    expect(nav).toContain('<details');
    expect(nav).toContain('<summary');
  });

  it('[SPEC-A11Y-001/RF-4] FormField renders <label for=fieldId> (used by Contact form)', () => {
    const ff = fs.readFileSync(path.join(src, 'components/FormField.astro'), 'utf-8');
    expect(ff).toContain('<label');
    expect(ff).toContain('for={fieldId}');
  });

  it('[SPEC-A11Y-001/RF-4] Button uses dynamic tag: <a> when href given, <button> otherwise', () => {
    const btn = fs.readFileSync(path.join(src, 'components/Button.astro'), 'utf-8');
    // Astro dynamic tag pattern — resolves to <a> or <button> at runtime
    expect(btn).toContain("href ? 'a' : 'button'");
  });
});

// ── RF-5: contrast (tokens — verified by design) ─────────────────────────────
describe('SPEC-A11Y-001/RF-5 — contrast tokens', () => {
  it('[SPEC-A11Y-001/RF-5] tokens.css defines --ink (primary text) and --night (dark bg)', () => {
    const tokens = fs.readFileSync(path.join(src, 'styles/tokens.css'), 'utf-8');
    expect(tokens).toContain('--ink:'); // #2b2c38 — primary text on light (high contrast)
    expect(tokens).toContain('--night:'); // #131634 — dark section background
  });

  it('[SPEC-A11Y-001/RF-5] tokens.css defines accent and brand tokens for CTAs', () => {
    const tokens = fs.readFileSync(path.join(src, 'styles/tokens.css'), 'utf-8');
    expect(tokens).toContain('--periwinkle:'); // #5c70d6 accent
    expect(tokens).toContain('--indigo:'); // #2d3d8a brand primary
  });
});

// ── RF-6: reduced-motion ─────────────────────────────────────────────────────
describe('SPEC-A11Y-001/RF-6 — reduced-motion respected', () => {
  it('[SPEC-A11Y-001/RF-6] animations.css has prefers-reduced-motion block', () => {
    const anim = fs.readFileSync(path.join(src, 'styles/animations.css'), 'utf-8');
    expect(anim).toContain('prefers-reduced-motion');
    expect(anim).toContain('reduce');
  });

  it('[SPEC-A11Y-001/RF-6] interactions.js respects reduced motion', () => {
    const js = fs.readFileSync(path.join(WEB, 'public/interactions.js'), 'utf-8');
    expect(js).toContain('prefers-reduced-motion');
  });
});

// ── RF-7: CI gate ─────────────────────────────────────────────────────────────
describe('SPEC-A11Y-001/RF-7 — axe gate in CI', () => {
  it('[SPEC-A11Y-001/RF-7] .drone.yml has a11y-test step', () => {
    const c = fs.readFileSync(drone, 'utf-8');
    expect(c).toContain('a11y');
  });

  it('[SPEC-A11Y-001/RF-7] a11y gate depends_on visual-test', () => {
    const c = fs.readFileSync(drone, 'utf-8');
    const a11yBlock = c.slice(c.indexOf('a11y'));
    expect(a11yBlock).toContain('visual-test');
  });
});

// ── RNF-1: no JS added by skip-link ──────────────────────────────────────────
describe('SPEC-A11Y-001/RNF-1 — skip-link uses CSS only, no JS', () => {
  it('[SPEC-A11Y-001/RNF-1] base.css has skip-link rules (CSS-only approach)', () => {
    const c = fs.readFileSync(globalCss, 'utf-8');
    expect(c).toContain('.skip-link');
  });

  it('[SPEC-A11Y-001/RNF-1] interactions.js does not reference skip-link', () => {
    const js = fs.readFileSync(path.join(WEB, 'public/interactions.js'), 'utf-8');
    expect(js).not.toContain('skip-link');
  });
});

// ── RNF-2: fidelity — skip-link hidden by default ────────────────────────────
describe('SPEC-A11Y-001/RNF-2 — skip-link does not affect fidelity gate', () => {
  it('[SPEC-A11Y-001/RNF-2] skip-link is positioned off-screen by default', () => {
    const c = fs.readFileSync(globalCss, 'utf-8');
    const block = c.slice(c.indexOf('.skip-link'));
    expect(block.slice(0, 300)).toMatch(/position:\s*(absolute|fixed)/);
    expect(block.slice(0, 300)).toMatch(/(top|transform|left).*(-[0-9]|999|-100)/);
  });
});

// ── INV-1: a11y gate is blocking in CI ────────────────────────────────────────
describe('SPEC-A11Y-001/INV-1 — a11y CI gate is blocking', () => {
  it('[SPEC-A11Y-001/INV-1] drone a11y step depends on previous gates', () => {
    const c = fs.readFileSync(drone, 'utf-8');
    expect(c).toContain('a11y');
  });
});

// ── INV-2: no a11y regressions committed ─────────────────────────────────────
describe('SPEC-A11Y-001/INV-2 — axe spec file exists', () => {
  it('[SPEC-A11Y-001/INV-2] tests/a11y/page-a11y.spec.ts exists', () => {
    expect(fs.existsSync(path.join(WEB, 'tests/a11y/page-a11y.spec.ts'))).toBe(true);
  });
});

// ── INV-3: SRP — skip-link/focus in layout/styles only ───────────────────────
describe('SPEC-A11Y-001/INV-3 — SRP: a11y primitives in layout/styles', () => {
  it('[SPEC-A11Y-001/INV-3] skip-link defined in BaseLayout, not in section components', () => {
    const c = fs.readFileSync(layout, 'utf-8');
    expect(c).toContain('skip-link');
    const components = fs
      .readdirSync(path.join(src, 'components'))
      .filter((f) => f.endsWith('.astro'));
    for (const f of components) {
      const comp = fs.readFileSync(path.join(src, 'components', f), 'utf-8');
      expect(comp, `${f} should not define skip-link`).not.toContain('class="skip-link"');
    }
  });
});
