/**
 * SPEC-SEC-008 — Testimonials + Stats
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const file = path.join(WEB, 'src/components/Testimonials.astro');
const tCard = path.join(WEB, 'src/components/TestimonialCard.astro');

// ── RF-1: Stats ────────────────────────────────────────────────────────────
describe('SPEC-SEC-008/RF-1 — stats', () => {
  it('[SPEC-SEC-008/RF-1] Testimonials.astro exists', () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it('[SPEC-SEC-008/RF-1] has .stats grid', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('stats');
  });

  it('[SPEC-SEC-008/RF-1] stat value uses gradient (indigo→periwinkle)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('gradient');
    expect(c).toContain('.v');
  });

  it('[SPEC-SEC-008/RF-1] stat has .v (value) and .l (label)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('.v');
    expect(c).toContain('.l');
  });
});

// ── RF-2: Testimonials ─────────────────────────────────────────────────────
describe('SPEC-SEC-008/RF-2 — testimonial cards', () => {
  it('[SPEC-SEC-008/RF-2] has .t-grid', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('t-grid');
  });

  it('[SPEC-SEC-008/RF-2] renders TestimonialCard', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('TestimonialCard');
  });
});

// ── RF-3: Molecules ────────────────────────────────────────────────────────
describe('SPEC-SEC-008/RF-3 — molecules extracted', () => {
  it('[SPEC-SEC-008/RF-3] TestimonialCard.astro exists', () => {
    expect(fs.existsSync(tCard)).toBe(true);
  });

  it('[SPEC-SEC-008/RF-3] TestimonialCard has .stars', () => {
    expect(fs.readFileSync(tCard, 'utf-8')).toContain('stars');
  });

  it('[SPEC-SEC-008/RF-3] TestimonialCard has .t-author with .avatar (initials)', () => {
    const c = fs.readFileSync(tCard, 'utf-8');
    expect(c).toContain('t-author');
    expect(c).toContain('avatar');
  });

  it('[SPEC-SEC-008/RF-3] TestimonialCard has .quote', () => {
    expect(fs.readFileSync(tCard, 'utf-8')).toContain('quote');
  });
});

// ── RF-4: Typed content ────────────────────────────────────────────────────
describe('SPEC-SEC-008/RF-4 — typed props', () => {
  it('[SPEC-SEC-008/RF-4] Testimonials has stats prop', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('stats');
  });

  it('[SPEC-SEC-008/RF-4] Testimonials has items prop with .map()', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('items');
    expect(c).toContain('.map(');
  });

  it('[SPEC-SEC-008/RF-4] no hardcoded testimonial copy ("Maria G.")', () => {
    expect(fs.readFileSync(file, 'utf-8')).not.toContain('Maria G');
  });
});

// ── RF-5: hooks ───────────────────────────────────────────────────────────
describe('SPEC-SEC-008/RF-5 — reveal hooks', () => {
  it('[SPEC-SEC-008/RF-5] has data-reveal and staggered delay', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('data-reveal');
    expect(fs.readFileSync(file, 'utf-8')).toContain('delay');
  });
});

// ── RNF-1: a11y ───────────────────────────────────────────────────────────
describe('SPEC-SEC-008/RNF-1 — a11y', () => {
  it('[SPEC-SEC-008/RNF-1] stars are aria-hidden with accessible label', () => {
    const c = fs.readFileSync(tCard, 'utf-8');
    expect(c).toContain('aria-');
  });
});

// ── RNF-3: responsive ────────────────────────────────────────────────────
describe('SPEC-SEC-008/RNF-3 — responsive', () => {
  it('[SPEC-SEC-008/RNF-3] has 880px breakpoint for 1-col', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('880px');
  });
});

// ── INV-1: SRP ────────────────────────────────────────────────────────────
describe('SPEC-SEC-008/INV-1 — SRP', () => {
  it('[SPEC-SEC-008/INV-1] Testimonials.astro ≤ 150 lines', () => {
    const lines = fs.readFileSync(file, 'utf-8').split('\n').length;
    expect(lines).toBeLessThanOrEqual(150);
  });
});

// ── INV-2: tokens ─────────────────────────────────────────────────────────
describe('SPEC-SEC-008/INV-2 — tokens', () => {
  it('[SPEC-SEC-008/INV-2] uses var(--lilac-2) background token', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('var(--lilac-2)');
  });

  it('[SPEC-SEC-008/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('Testimonials');
  });
});
