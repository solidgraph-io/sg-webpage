/**
 * SPEC-SEC-010 — About (orbit + cities)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const file = path.join(WEB, 'src/components/About/About.astro');
const scss = path.join(WEB, 'src/components/About/About.module.scss');
const diffItem = path.join(WEB, 'src/components/DiffItem.astro');

// ── RF-1: Visual / orbit ─────────────────────────────────────────────────
describe('SPEC-SEC-010/RF-1 — orbit visual', () => {
  it('[SPEC-SEC-010/RF-1] About.astro exists', () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it('[SPEC-SEC-010/RF-1] has .about-visual with orbit rings', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('about-visual');
    expect(c).toContain('orbit');
  });

  it('[SPEC-SEC-010/RF-1] has center-logo with img', () => {
    const c = fs.readFileSync(file, 'utf-8') + fs.readFileSync(scss, 'utf-8');
    expect(c).toContain('center-logo');
    expect(c).toContain('img');
  });

  it('[SPEC-SEC-010/RF-1] uses FloatingCard (badge-card) for orbiting badges', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('FloatingCard');
  });

  it('[SPEC-SEC-010/RF-1] orbit has spin animation', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('spin');
  });

  it('[SPEC-SEC-010/RF-1] badges have bob animation', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('bob');
  });
});

// ── RF-2: Content ────────────────────────────────────────────────────────
describe('SPEC-SEC-010/RF-2 — content block', () => {
  it('[SPEC-SEC-010/RF-2] has Eyebrow', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('Eyebrow');
  });

  it('[SPEC-SEC-010/RF-2] has .diff-list', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('diff-list');
  });

  it('[SPEC-SEC-010/RF-2] has .about-cities with city items', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('about-cities');
    expect(c).toContain('cities');
  });
});

// ── RF-3: DiffItem molecule ───────────────────────────────────────────────
describe('SPEC-SEC-010/RF-3 — DiffItem molecule', () => {
  it('[SPEC-SEC-010/RF-3] DiffItem.astro exists', () => {
    expect(fs.existsSync(diffItem)).toBe(true);
  });

  it('[SPEC-SEC-010/RF-3] DiffItem has .ic icon + h4 + p', () => {
    const c = fs.readFileSync(diffItem, 'utf-8');
    expect(c).toContain('ic');
    expect(c).toContain('h4');
  });
});

// ── RF-4: Typed content ──────────────────────────────────────────────────
describe('SPEC-SEC-010/RF-4 — typed props', () => {
  it('[SPEC-SEC-010/RF-4] has diffs and cities props with .map()', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('diffs');
    expect(c).toContain('cities');
    expect(c).toContain('.map(');
  });

  it('[SPEC-SEC-010/RF-4] no hardcoded copy ("Charlotte")', () => {
    expect(fs.readFileSync(file, 'utf-8')).not.toContain('Charlotte');
  });
});

// ── RF-5: Hooks + reduced-motion ─────────────────────────────────────────
describe('SPEC-SEC-010/RF-5 — hooks', () => {
  it('[SPEC-SEC-010/RF-5] has data-reveal with left/right', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('data-reveal');
  });

  it('[SPEC-SEC-010/RF-5] orbit respects prefers-reduced-motion', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('reduced-motion');
  });
});

// ── RNF-1: a11y ─────────────────────────────────────────────────────────
describe('SPEC-SEC-010/RNF-1 — a11y', () => {
  it('[SPEC-SEC-010/RNF-1] section has id="about"', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('id="about"');
  });

  it('[SPEC-SEC-010/RNF-1] orbit visual is aria-hidden', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('aria-hidden');
  });
});

// ── RNF-3: responsive ────────────────────────────────────────────────────
describe('SPEC-SEC-010/RNF-3 — responsive', () => {
  it('[SPEC-SEC-010/RNF-3] has 980px breakpoint for 1-col', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('980px');
  });
});

// ── INV-1: SRP ──────────────────────────────────────────────────────────
describe('SPEC-SEC-010/INV-1 — SRP', () => {
  it('[SPEC-SEC-010/INV-1] About.astro ≤ 150 lines', () => {
    const lines = fs.readFileSync(file, 'utf-8').split('\n').length;
    expect(lines).toBeLessThanOrEqual(150);
  });
});

// ── INV-2: tokens ────────────────────────────────────────────────────────
describe('SPEC-SEC-010/INV-2 — tokens', () => {
  it('[SPEC-SEC-010/INV-2] uses var(--lilac-2) background', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('var(--lilac-2)');
  });

  it('[SPEC-SEC-010/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('About');
  });
});
