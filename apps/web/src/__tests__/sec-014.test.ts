/**
 * SPEC-SEC-014 — Footer (dark + watermark + brandLink)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const file = path.join(WEB, 'src/components/Footer.astro');

// ── RF-1: Structure ───────────────────────────────────────────────────────
describe('SPEC-SEC-014/RF-1 — footer structure', () => {
  it('[SPEC-SEC-014/RF-1] Footer.astro exists', () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it('[SPEC-SEC-014/RF-1] uses <footer> element', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('<footer');
  });

  it('[SPEC-SEC-014/RF-1] has .foot-grid', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('foot-grid');
  });

  it('[SPEC-SEC-014/RF-1] has .foot-big watermark', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('foot-big');
  });

  it('[SPEC-SEC-014/RF-1] has .foot-bottom with copyright', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('foot-bottom');
    expect(c).toContain('2026');
  });
});

// ── RF-2: Brand column ────────────────────────────────────────────────────
describe('SPEC-SEC-014/RF-2 — brand column', () => {
  it('[SPEC-SEC-014/RF-2] has .foot-brand', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('foot-brand');
  });

  it('[SPEC-SEC-014/RF-2] logo links to solidgraph.dev (brandLink)', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('solidgraph.dev');
  });

  it('[SPEC-SEC-014/RF-2] has location pills (.locs)', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('locs');
  });
});

// ── RF-3: Nav columns ─────────────────────────────────────────────────────
describe('SPEC-SEC-014/RF-3 — navigation columns', () => {
  it('[SPEC-SEC-014/RF-3] has 3 .foot-col elements', () => {
    const c = fs.readFileSync(file, 'utf-8');
    const matches = c.match(/foot-col/g);
    expect(matches?.length).toBeGreaterThanOrEqual(3);
  });

  it('[SPEC-SEC-014/RF-3] has .legal links (privacy, terms)', () => {
    const c = fs.readFileSync(file, 'utf-8');
    expect(c).toContain('legal');
    expect(c).toContain('privacy');
  });
});

// ── RNF-1: dark background ────────────────────────────────────────────────
describe('SPEC-SEC-014/RNF-1 — dark', () => {
  it('[SPEC-SEC-014/RNF-1] uses var(--night-2)', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('var(--night-2)');
  });
});

// ── RNF-3: responsive ────────────────────────────────────────────────────
describe('SPEC-SEC-014/RNF-3 — responsive', () => {
  it('[SPEC-SEC-014/RNF-3] has 880px breakpoint', () => {
    expect(fs.readFileSync(file, 'utf-8')).toContain('880px');
  });
});

// ── INV-1: SRP ───────────────────────────────────────────────────────────
describe('SPEC-SEC-014/INV-1 — SRP', () => {
  it('[SPEC-SEC-014/INV-1] Footer.astro ≤ 130 lines', () => {
    expect(fs.readFileSync(file, 'utf-8').split('\n').length).toBeLessThanOrEqual(130);
  });
});

// ── INV-2: composed ──────────────────────────────────────────────────────
describe('SPEC-SEC-014/INV-2 — composed', () => {
  it('[SPEC-SEC-014/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('Footer');
  });
});
