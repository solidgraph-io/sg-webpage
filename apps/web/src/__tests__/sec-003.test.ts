/**
 * SPEC-SEC-003 — Marquee
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const marqueePath = path.join(WEB, 'src/components/Marquee.astro');

// ── RF-1: estructura/estilo ─────────────────────────────────────────────────
describe('SPEC-SEC-003/RF-1 — estructura', () => {
  it('[SPEC-SEC-003/RF-1] Marquee.astro exists', () => {
    expect(fs.existsSync(marqueePath)).toBe(true);
  });

  it('[SPEC-SEC-003/RF-1] Marquee has .marquee wrapper and .marquee-track', () => {
    const c = fs.readFileSync(marqueePath, 'utf-8');
    expect(c).toContain('marquee');
    expect(c).toContain('marquee-track');
  });

  it('[SPEC-SEC-003/RF-1] Marquee has .dot separator element', () => {
    expect(fs.readFileSync(marqueePath, 'utf-8')).toContain('dot');
  });

  it('[SPEC-SEC-003/RF-1] Marquee track items are duplicated for seamless loop', () => {
    const c = fs.readFileSync(marqueePath, 'utf-8');
    // Should render items twice (two map/forEach calls or duplicate slot)
    const mapCount = (c.match(/items\.map/g) ?? []).length;
    expect(mapCount).toBeGreaterThanOrEqual(2);
  });

  it('[SPEC-SEC-003/RF-1] Marquee pauses on hover (.marquee:hover .marquee-track)', () => {
    const c = fs.readFileSync(marqueePath, 'utf-8');
    expect(c).toContain('animation-play-state: paused');
  });

  it('[SPEC-SEC-003/RF-1] Marquee uses scroll-x animation', () => {
    expect(fs.readFileSync(marqueePath, 'utf-8')).toContain('scroll-x');
  });
});

// ── RF-2: contenido tipado ─────────────────────────────────────────────────
describe('SPEC-SEC-003/RF-2 — props', () => {
  it('[SPEC-SEC-003/RF-2] Marquee has items prop', () => {
    expect(fs.readFileSync(marqueePath, 'utf-8')).toContain('items');
  });

  it('[SPEC-SEC-003/RF-2] Marquee renders item labels via .map (no hardcoded copy)', () => {
    const c = fs.readFileSync(marqueePath, 'utf-8');
    expect(c).toContain('items.map');
    expect(c).not.toContain('>Built From Scratch<');
  });
});

// ── RNF-1: a11y ────────────────────────────────────────────────────────────
describe('SPEC-SEC-003/RNF-1 — a11y', () => {
  it('[SPEC-SEC-003/RNF-1] Marquee respects prefers-reduced-motion', () => {
    const c = fs.readFileSync(marqueePath, 'utf-8');
    expect(c).toContain('prefers-reduced-motion');
  });

  it('[SPEC-SEC-003/RNF-1] Marquee duplicate track section is aria-hidden', () => {
    expect(fs.readFileSync(marqueePath, 'utf-8')).toContain('aria-hidden');
  });
});

// ── RNF-2: CSS pura, sin JS ────────────────────────────────────────────────
describe('SPEC-SEC-003/RNF-2 — perf', () => {
  it('[SPEC-SEC-003/RNF-2] Marquee has no <script> element', () => {
    expect(fs.readFileSync(marqueePath, 'utf-8')).not.toContain('<script');
  });
});

// ── RNF-3: fidelidad visual ────────────────────────────────────────────────
describe('SPEC-SEC-003/RNF-3 — fidelidad', () => {
  it('[SPEC-SEC-003/RNF-3] design source 03-marquee.html exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'design/template/sections/03-marquee.html'))).toBe(true);
  });

  it('[SPEC-SEC-003/RNF-3] Marquee CSS classes match source design', () => {
    const c = fs.readFileSync(marqueePath, 'utf-8');
    const source = fs.readFileSync(
      path.join(ROOT, 'design/template/sections/03-marquee.html'),
      'utf-8',
    );
    for (const cls of ['marquee', 'marquee-track', 'item', 'dot']) {
      expect(source, `${cls} not in source`).toContain(cls);
      expect(c, `${cls} missing from Marquee.astro`).toContain(cls);
    }
  });
});

// ── INV-1: SRP ─────────────────────────────────────────────────────────────
describe('SPEC-SEC-003/INV-1 — SRP', () => {
  it('[SPEC-SEC-003/INV-1] Marquee.astro is under 100 lines', () => {
    const lines = fs.readFileSync(marqueePath, 'utf-8').split('\n').length;
    expect(lines).toBeLessThan(100);
  });
});

// ── INV-2: tokens y props ──────────────────────────────────────────────────
describe('SPEC-SEC-003/INV-2 — tokens y props', () => {
  it('[SPEC-SEC-003/INV-2] Marquee <style> uses no bare #fff hex', () => {
    const c = fs.readFileSync(marqueePath, 'utf-8');
    const m = c.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (m) expect(m[1]).not.toContain('#fff');
  });
});
