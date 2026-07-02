/**
 * SPEC-SEC-009 — Portfolio
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const file = path.join(WEB, 'src/components/Portfolio.astro');
const pCard = path.join(WEB, 'src/components/PortfolioCard.astro');

// ── RF-1: Structure ────────────────────────────────────────────────────────
describe('SPEC-SEC-009/RF-1 — structure', () => {
  it('[SPEC-SEC-009/RF-1] Portfolio.astro exists', () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it('[SPEC-SEC-009/RF-1] has .portfolio section (white bg)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('class="portfolio"');
    expect(c).toContain('#fff');
  });

  it('[SPEC-SEC-009/RF-1] has .p-grid', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('p-grid');
  });

  it('[SPEC-SEC-009/RF-1] renders PortfolioCard', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('PortfolioCard');
  });

  it('[SPEC-SEC-009/RF-1] has .center-cta with Button', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('center-cta');
    expect(c).toContain('Button');
  });
});

// ── RF-2: Molecule ─────────────────────────────────────────────────────────
describe('SPEC-SEC-009/RF-2 — PortfolioCard molecule', () => {
  it('[SPEC-SEC-009/RF-2] PortfolioCard.astro exists', () => {
    expect(fs.existsSync(pCard)).toBe(true);
  });

  it('[SPEC-SEC-009/RF-2] has .p-thumb with .p-tag', () => {
    const c = fs.readFileSync(pCard, 'utf-8');
    expect(c).toContain('p-thumb');
    expect(c).toContain('p-tag');
  });

  it('[SPEC-SEC-009/RF-2] has .p-meat with category/title/location/desc', () => {
    const c = fs.readFileSync(pCard, 'utf-8');
    expect(c).toContain('p-meat');
    expect(c).toContain('cat');
    expect(c).toContain('loc');
  });
});

// ── RF-3: Typed content ────────────────────────────────────────────────────
describe('SPEC-SEC-009/RF-3 — typed props', () => {
  it('[SPEC-SEC-009/RF-3] Portfolio has items prop with .map()', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('items');
    expect(c).toContain('.map(');
  });

  it('[SPEC-SEC-009/RF-3] no hardcoded copy ("HVAC Company")', () => {
    expect(fs.readFileSync(file, 'utf-8')).not.toContain('HVAC');
  });
});

// ── RF-4: hooks ───────────────────────────────────────────────────────────
describe('SPEC-SEC-009/RF-4 — reveal hooks', () => {
  it('[SPEC-SEC-009/RF-4] has data-reveal and staggered delay', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('data-reveal');
    expect(fs.readFileSync(file, 'utf-8')).toContain('delay');
  });
});

// ── RNF-1: a11y ───────────────────────────────────────────────────────────
describe('SPEC-SEC-009/RNF-1 — a11y', () => {
  it('[SPEC-SEC-009/RNF-1] cards use <article> semantic element', () => {
    expect(fs.readFileSync(pCard, 'utf-8')).toContain('<article');
  });

  it('[SPEC-SEC-009/RNF-1] thumb SVG is aria-hidden', () => {
    expect(fs.readFileSync(pCard, 'utf-8')).toContain('aria-hidden');
  });
});

// ── RNF-3: responsive ────────────────────────────────────────────────────
describe('SPEC-SEC-009/RNF-3 — responsive', () => {
  it('[SPEC-SEC-009/RNF-3] has 880px breakpoint for 1-col', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('880px');
  });
});

// ── INV-1: SRP ────────────────────────────────────────────────────────────
describe('SPEC-SEC-009/INV-1 — SRP', () => {
  it('[SPEC-SEC-009/INV-1] Portfolio.astro ≤ 150 lines', () => {
    const lines = fs.readFileSync(file, 'utf-8').split('\n').length;
    expect(lines).toBeLessThanOrEqual(150);
  });
});

// ── INV-2: tokens ─────────────────────────────────────────────────────────
describe('SPEC-SEC-009/INV-2 — tokens', () => {
  it('[SPEC-SEC-009/INV-2] PortfolioCard uses var(--...) tokens', () => {
    expect(fs.readFileSync(pCard, 'utf-8')).toContain('var(--');
  });

  it('[SPEC-SEC-009/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('Portfolio');
  });
});
