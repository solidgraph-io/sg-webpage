/**
 * SPEC-SEC-006 — How It Works (dark night, sticky left, durations)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const file = path.join(WEB, 'src/components/HowItWorks/HowItWorks.astro');
const scss = path.join(WEB, 'src/components/HowItWorks/HowItWorks.module.scss');

// ── RF-1: estructura/tema ──────────────────────────────────────────────────
describe('SPEC-SEC-006/RF-1 — estructura', () => {
  it('[SPEC-SEC-006/RF-1] HowItWorks.astro exists', () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it('[SPEC-SEC-006/RF-1] has .how section with --night background', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('class="how');
    expect(fs.readFileSync(scss, 'utf-8')).toContain('--night');
  });

  it('[SPEC-SEC-006/RF-1] has .how-grid (2-col) with .how-sticky (sticky left)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('how-grid');
    expect(c).toContain('how-sticky');
  });

  it('[SPEC-SEC-006/RF-1] has .steps column with .step cards', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('steps');
    expect(c).toContain('step');
  });

  it('[SPEC-SEC-006/RF-1] each step has .num (gradient) and .meat (.dur chip)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('class="num"');
    expect(c).toContain('meat');
    expect(c).toContain('dur');
  });

  it('[SPEC-SEC-006/RF-1] uses Aurora primitive', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('Aurora');
  });

  it('[SPEC-SEC-006/RF-1] uses Eyebrow primitive', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('Eyebrow');
  });

  it('[SPEC-SEC-006/RF-1] uses Button primitive for CTAs', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('Button');
  });

  it('[SPEC-SEC-006/RF-1] has .how-progress bars', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('how-progress');
  });
});

// ── RF-2: contenido tipado ─────────────────────────────────────────────────
describe('SPEC-SEC-006/RF-2 — props', () => {
  it('[SPEC-SEC-006/RF-2] has steps prop and renders via .map()', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('steps');
    expect(c).toContain('.map(');
  });

  it('[SPEC-SEC-006/RF-2] step has title, dur, and text fields', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('title');
    expect(c).toContain('dur');
    expect(c).toContain('text');
  });

  it('[SPEC-SEC-006/RF-2] no hardcoded copy ("We Talk" etc.)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).not.toContain('We Talk');
    expect(c).not.toContain('We Build');
  });
});

// ── RF-3: hooks data-reveal ────────────────────────────────────────────────
describe('SPEC-SEC-006/RF-3 — hooks', () => {
  it('[SPEC-SEC-006/RF-3] sticky left has data-reveal="left"', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('data-reveal="left"');
  });

  it('[SPEC-SEC-006/RF-3] steps have data-reveal="right" and staggered --d', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('data-reveal="right"');
    expect(c).toContain('--d');
  });
});

// ── RNF-1: a11y ───────────────────────────────────────────────────────────
describe('SPEC-SEC-006/RNF-1 — a11y', () => {
  it('[SPEC-SEC-006/RNF-1] section has aria-labelledby', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('aria-labelledby');
  });
});

// ── RNF-3: responsive ─────────────────────────────────────────────────────
describe('SPEC-SEC-006/RNF-3 — responsive', () => {
  it('[SPEC-SEC-006/RNF-3] has 980px breakpoint for 1-col + sticky→static', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('980px');
  });
});

// ── INV-1: SRP ────────────────────────────────────────────────────────────
describe('SPEC-SEC-006/INV-1 — SRP', () => {
  it('[SPEC-SEC-006/INV-1] HowItWorks.astro ≤ 150 lines', () => {
    const lines = fs.readFileSync(file, 'utf-8').split('\n').length;
    expect(lines).toBeLessThanOrEqual(150);
  });
});

// ── INV-2: tokens / no hardcode ───────────────────────────────────────────
describe('SPEC-SEC-006/INV-2 — tokens', () => {
  it('[SPEC-SEC-006/INV-2] uses var(--...) tokens for colors', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('var(--');
  });

  it('[SPEC-SEC-006/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('HowItWorks');
  });
});
