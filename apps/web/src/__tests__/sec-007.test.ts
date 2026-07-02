/**
 * SPEC-SEC-007 — Plans + Hosting
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const file = path.join(WEB, 'src/components/Plans.astro');
const planCard = path.join(WEB, 'src/components/PlanCard.astro');
const hostingCard = path.join(WEB, 'src/components/HostingCard.astro');

// ── RF-1: Plans structure ──────────────────────────────────────────────────
describe('SPEC-SEC-007/RF-1 — plans structure', () => {
  it('[SPEC-SEC-007/RF-1] Plans.astro exists', () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it('[SPEC-SEC-007/RF-1] has .plans section (white bg)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('class="plans"');
    expect(c).toContain('#fff');
  });

  it('[SPEC-SEC-007/RF-1] has .plan-grid', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('plan-grid');
  });

  it('[SPEC-SEC-007/RF-1] renders PlanCard for each plan', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('PlanCard');
  });

  it('[SPEC-SEC-007/RF-1] has note-bar', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('note-bar');
  });
});

// ── RF-2: Hosting ──────────────────────────────────────────────────────────
describe('SPEC-SEC-007/RF-2 — hosting sub-block', () => {
  it('[SPEC-SEC-007/RF-2] has .hosting section', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('hosting');
  });

  it('[SPEC-SEC-007/RF-2] has .hosting-head', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('hosting-head');
  });

  it('[SPEC-SEC-007/RF-2] renders HostingCard', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('HostingCard');
  });
});

// ── RF-3: Molecules ────────────────────────────────────────────────────────
describe('SPEC-SEC-007/RF-3 — molecules extracted', () => {
  it('[SPEC-SEC-007/RF-3] PlanCard.astro exists', () => {
    expect(fs.existsSync(planCard)).toBe(true);
  });

  it('[SPEC-SEC-007/RF-3] HostingCard.astro exists', () => {
    expect(fs.existsSync(hostingCard)).toBe(true);
  });

  it('[SPEC-SEC-007/RF-3] PlanCard has popular variant with Badge', () => {
    const c = fs.readFileSync(planCard, 'utf-8');
    expect(c).toContain('popular');
    expect(c).toContain('Badge');
  });

  it('[SPEC-SEC-007/RF-3] PlanCard has includes and excludes lists', () => {
    const c = fs.readFileSync(planCard, 'utf-8');
    expect(c).toContain('includes');
    expect(c).toContain('excludes');
  });

  it('[SPEC-SEC-007/RF-3] PlanCard has plan-cta link', () => {
    expect(fs.readFileSync(planCard, 'utf-8')).toContain('plan-cta');
  });

  it('[SPEC-SEC-007/RF-3] HostingCard has name/price/desc/items', () => {
    const c = fs.readFileSync(hostingCard, 'utf-8');
    expect(c).toContain('name');
    expect(c).toContain('price');
    expect(c).toContain('desc');
  });
});

// ── RF-4: Typed content ────────────────────────────────────────────────────
describe('SPEC-SEC-007/RF-4 — typed props', () => {
  it('[SPEC-SEC-007/RF-4] Plans.astro has plans prop with .map()', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('plans');
    expect(c).toContain('.map(');
  });

  it('[SPEC-SEC-007/RF-4] Plans.astro has hosting prop', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('hosting');
  });

  it('[SPEC-SEC-007/RF-4] no hardcoded copy ("Nano" or "Micro")', () => {
    expect(fs.readFileSync(file, 'utf-8')).not.toContain('Nano');
    expect(fs.readFileSync(file, 'utf-8')).not.toContain('Micro');
  });
});

// ── RF-5: hooks ───────────────────────────────────────────────────────────
describe('SPEC-SEC-007/RF-5 — reveal hooks', () => {
  it('[SPEC-SEC-007/RF-5] has data-reveal and staggered delay prop', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('data-reveal');
    expect(c).toContain('delay');
  });

  it('[SPEC-SEC-007/RF-5] PlanCard converts delay to CSS --d var', () => {
    expect(fs.readFileSync(planCard, 'utf-8')).toContain('--d');
  });
});

// ── RNF-1: a11y ───────────────────────────────────────────────────────────
describe('SPEC-SEC-007/RNF-1 — a11y', () => {
  it('[SPEC-SEC-007/RNF-1] section has id="plans"', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('id="plans"');
  });

  it('[SPEC-SEC-007/RNF-1] popular plan uses Badge (not just color)', () => {
    expect(fs.readFileSync(planCard, 'utf-8')).toContain('Badge');
  });
});

// ── RNF-3: responsive ────────────────────────────────────────────────────
describe('SPEC-SEC-007/RNF-3 — responsive', () => {
  it('[SPEC-SEC-007/RNF-3] plan-grid has 1100px and 600px breakpoints', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('1100px');
    expect(c).toContain('600px');
  });

  it('[SPEC-SEC-007/RNF-3] hosting-grid has 980px and 540px breakpoints', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('980px');
    expect(c).toContain('540px');
  });
});

// ── INV-1: SRP ────────────────────────────────────────────────────────────
describe('SPEC-SEC-007/INV-1 — SRP', () => {
  it('[SPEC-SEC-007/INV-1] Plans.astro ≤ 150 lines', () => {
    const lines = fs.readFileSync(file, 'utf-8').split('\n').length;
    expect(lines).toBeLessThanOrEqual(150);
  });

  it('[SPEC-SEC-007/INV-1] PlanCard.astro ≤ 150 lines', () => {
    const lines = fs.readFileSync(planCard, 'utf-8').split('\n').length;
    expect(lines).toBeLessThanOrEqual(150);
  });
});

// ── INV-2: tokens ─────────────────────────────────────────────────────────
describe('SPEC-SEC-007/INV-2 — tokens', () => {
  it('[SPEC-SEC-007/INV-2] PlanCard uses var(--...) tokens', () => {
    expect(fs.readFileSync(planCard, 'utf-8')).toContain('var(--');
  });

  it('[SPEC-SEC-007/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('Plans');
  });
});
