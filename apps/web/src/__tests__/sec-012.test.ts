/**
 * SPEC-SEC-012 — CTA Strip (clear container + dark floating card)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const file = path.join(WEB, 'src/components/CtaStrip.astro');

// ── RF-1: Structure — div wrapper, NOT section ────────────────────────────
describe('SPEC-SEC-012/RF-1 — div wrapper + dark card', () => {
  it('[SPEC-SEC-012/RF-1] CtaStrip.astro exists', () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it('[SPEC-SEC-012/RF-1] outer wrapper is .cta-wrap div (NOT section)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('cta-wrap');
    expect(c).not.toMatch(/<section[^>]*cta/);
  });

  it('[SPEC-SEC-012/RF-1] has .cta-strip with has-spot', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('cta-strip');
    expect(c).toContain('has-spot');
  });

  it('[SPEC-SEC-012/RF-1] has .spotlight', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('spotlight');
  });

  it('[SPEC-SEC-012/RF-1] uses Aurora component', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('Aurora');
  });
});

// ── RF-2: Content ─────────────────────────────────────────────────────────
describe('SPEC-SEC-012/RF-2 — typed content', () => {
  it('[SPEC-SEC-012/RF-2] has .cta-strip-content with h3 and p', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('cta-strip-content');
    expect(c).toContain('h3');
    expect(c).toContain('<p>');
  });

  it('[SPEC-SEC-012/RF-2] uses Button variant white', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('Button');
    expect(c).toContain('white');
  });

  it('[SPEC-SEC-012/RF-2] no hardcoded heading in CtaStrip.astro', () => {
    expect(fs.readFileSync(file, 'utf-8')).not.toContain('Ready to Get Started');
  });

  it('[SPEC-SEC-012/RF-2] has typed props (heading, body, ctaLabel, ctaHref)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('heading');
    expect(c).toContain('ctaLabel');
    expect(c).toContain('ctaHref');
  });
});

// ── RF-3: No extra JS ─────────────────────────────────────────────────────
describe('SPEC-SEC-012/RF-3 — no JS', () => {
  it('[SPEC-SEC-012/RF-3] no client-side <script> block', () => {
    expect(fs.readFileSync(file, 'utf-8')).not.toContain('<script');
  });
});

// ── RNF-1: dark background via --night ────────────────────────────────────
describe('SPEC-SEC-012/RNF-1 — dark card', () => {
  it('[SPEC-SEC-012/RNF-1] uses var(--night) for background', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('var(--night)');
  });
});

// ── RNF-3: responsive ────────────────────────────────────────────────────
describe('SPEC-SEC-012/RNF-3 — responsive', () => {
  it('[SPEC-SEC-012/RNF-3] has 720px breakpoint', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('720px');
  });
});

// ── INV-1: SRP ───────────────────────────────────────────────────────────
describe('SPEC-SEC-012/INV-1 — SRP', () => {
  it('[SPEC-SEC-012/INV-1] CtaStrip.astro ≤ 100 lines', () => {
    expect(fs.readFileSync(file, 'utf-8').split('\n').length).toBeLessThanOrEqual(100);
  });
});

// ── INV-2: composed ──────────────────────────────────────────────────────
describe('SPEC-SEC-012/INV-2 — composed', () => {
  it('[SPEC-SEC-012/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('CtaStrip');
  });
});
