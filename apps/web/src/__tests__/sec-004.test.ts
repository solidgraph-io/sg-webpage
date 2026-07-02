/**
 * SPEC-SEC-004 — Pain Points (bento)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const file = path.join(WEB, 'src/components/PainPoints.astro');

// ── RF-1: estructura/estilo ────────────────────────────────────────────────
describe('SPEC-SEC-004/RF-1 — estructura', () => {
  it('[SPEC-SEC-004/RF-1] PainPoints.astro exists', () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it('[SPEC-SEC-004/RF-1] has .pain section with --lilac-2 background', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('class="pain');
    expect(c).toContain('--lilac-2');
  });

  it('[SPEC-SEC-004/RF-1] has .bento grid container', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('bento');
  });

  it('[SPEC-SEC-004/RF-1] has .bento-feature (dark indigo highlight card)', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('bento-feature');
  });

  it('[SPEC-SEC-004/RF-1] uses SectionHead primitive', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('SectionHead');
  });

  it('[SPEC-SEC-004/RF-1] uses IconBox primitive', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('IconBox');
  });

  it('[SPEC-SEC-004/RF-1] bento-card CSS includes hover lift and halo', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('bento-card');
    expect(c).toContain('translateY');
  });
});

// ── RF-2: contenido tipado ─────────────────────────────────────────────────
describe('SPEC-SEC-004/RF-2 — props', () => {
  it('[SPEC-SEC-004/RF-2] has heading prop', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('heading');
  });

  it('[SPEC-SEC-004/RF-2] has items prop and renders via .map()', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('items');
    expect(c).toContain('.map(');
  });

  it('[SPEC-SEC-004/RF-2] has feature prop for dark highlight card', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('feature');
  });

  it('[SPEC-SEC-004/RF-2] no hardcoded copy ("Sound Familiar" etc.)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).not.toContain('Sound Familiar');
    expect(c).not.toContain("I'm losing customers");
  });
});

// ── RF-3: hooks data-reveal ────────────────────────────────────────────────
describe('SPEC-SEC-004/RF-3 — hooks', () => {
  it('[SPEC-SEC-004/RF-3] section-head has data-reveal', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('data-reveal');
  });

  it('[SPEC-SEC-004/RF-3] items have staggered --d delay', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('--d');
  });
});

// ── RNF-1: a11y ───────────────────────────────────────────────────────────
describe('SPEC-SEC-004/RNF-1 — a11y', () => {
  it('[SPEC-SEC-004/RNF-1] icons are aria-hidden (via IconBox)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('aria-hidden');
  });
});

// ── RNF-3: responsive ─────────────────────────────────────────────────────
describe('SPEC-SEC-004/RNF-3 — responsive', () => {
  it('[SPEC-SEC-004/RNF-3] bento grid has 4-col template', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('repeat(4, 1fr)');
  });

  it('[SPEC-SEC-004/RNF-3] has media query for 2-col fallback', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('@media');
  });
});

// ── INV-1: SRP ────────────────────────────────────────────────────────────
describe('SPEC-SEC-004/INV-1 — SRP', () => {
  it('[SPEC-SEC-004/INV-1] PainPoints.astro ≤ 150 lines', () => {
    const lines = fs.readFileSync(file, 'utf-8').split('\n').length;
    expect(lines).toBeLessThanOrEqual(150);
  });
});

// ── INV-2: tokens / no hardcode ───────────────────────────────────────────
describe('SPEC-SEC-004/INV-2 — tokens', () => {
  it('[SPEC-SEC-004/INV-2] uses var(--...) tokens for colors', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('var(--');
  });

  it('[SPEC-SEC-004/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('PainPoints');
  });
});
