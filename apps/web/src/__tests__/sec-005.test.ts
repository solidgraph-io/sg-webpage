/**
 * SPEC-SEC-005 — Value Proposition (pillars, white, hover-fill)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const file = path.join(WEB, 'src/components/Value/Value.astro');
const scss = path.join(WEB, 'src/components/Value/Value.module.scss');

// ── RF-1: estructura/tema ──────────────────────────────────────────────────
describe('SPEC-SEC-005/RF-1 — estructura', () => {
  it('[SPEC-SEC-005/RF-1] Value.astro exists', () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it('[SPEC-SEC-005/RF-1] has .value section (white bg, no colored token)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('class="value');
  });

  it('[SPEC-SEC-005/RF-1] has .value-head 2-column grid', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('value-head');
  });

  it('[SPEC-SEC-005/RF-1] has .pillars grid', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('pillars');
  });

  it('[SPEC-SEC-005/RF-1] has .pillar elements with hover-fill (::before gradient)', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('pillar');
    expect(fs.readFileSync(scss, 'utf-8')).toContain('linear-gradient');
  });

  it('[SPEC-SEC-005/RF-1] uses Eyebrow primitive', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('Eyebrow');
  });

  it('[SPEC-SEC-005/RF-1] uses IconBox primitive', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('IconBox');
  });
});

// ── RF-2: contenido tipado ─────────────────────────────────────────────────
describe('SPEC-SEC-005/RF-2 — props', () => {
  it('[SPEC-SEC-005/RF-2] has heading prop', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('heading');
  });

  it('[SPEC-SEC-005/RF-2] has lead prop (right-column text)', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('lead');
  });

  it('[SPEC-SEC-005/RF-2] has pillars prop and renders via .map()', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('pillars');
    expect(c).toContain('.map(');
  });

  it('[SPEC-SEC-005/RF-2] no hardcoded copy ("Built From Scratch" etc.)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).not.toContain('Built From Scratch');
    expect(c).not.toContain('You Own Everything');
  });
});

// ── RF-3: hooks data-reveal ────────────────────────────────────────────────
describe('SPEC-SEC-005/RF-3 — hooks', () => {
  it('[SPEC-SEC-005/RF-3] value-head halves have data-reveal left/right', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('data-reveal');
  });

  it('[SPEC-SEC-005/RF-3] pillars have staggered --d delay', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('--d');
  });
});

// ── RNF-1: a11y ───────────────────────────────────────────────────────────
describe('SPEC-SEC-005/RNF-1 — a11y', () => {
  it('[SPEC-SEC-005/RNF-1] icons are aria-hidden', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('aria-hidden');
  });

  it('[SPEC-SEC-005/RNF-1] section has aria-labelledby', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('aria-labelledby');
  });
});

// ── RNF-3: responsive ─────────────────────────────────────────────────────
describe('SPEC-SEC-005/RNF-3 — responsive', () => {
  it('[SPEC-SEC-005/RNF-3] pillars has 4-col template', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('repeat(4, 1fr)');
  });

  it('[SPEC-SEC-005/RNF-3] has 980px breakpoint for pillar 2-col + head 1-col', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('980px');
  });

  it('[SPEC-SEC-005/RNF-3] has 540px breakpoint for pillar 1-col', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('540px');
  });
});

// ── INV-1: SRP ────────────────────────────────────────────────────────────
describe('SPEC-SEC-005/INV-1 — SRP', () => {
  it('[SPEC-SEC-005/INV-1] Value.astro ≤ 150 lines', () => {
    const lines = fs.readFileSync(file, 'utf-8').split('\n').length;
    expect(lines).toBeLessThanOrEqual(150);
  });
});

// ── INV-2: tokens / no hardcode ───────────────────────────────────────────
describe('SPEC-SEC-005/INV-2 — tokens', () => {
  it('[SPEC-SEC-005/INV-2] uses var(--...) tokens for colors', () => {
    expect(fs.readFileSync(scss, 'utf-8')).toContain('var(--');
  });

  it('[SPEC-SEC-005/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('Value');
  });
});
