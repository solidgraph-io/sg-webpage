/**
 * SPEC-SEC-001 — Nav
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const navPath = path.join(WEB, 'src/components/Nav.astro');

// ── RF-1: estructura/estilo ─────────────────────────────────────────────────
describe('SPEC-SEC-001/RF-1 — estructura', () => {
  it('[SPEC-SEC-001/RF-1] Nav.astro exists', () => {
    expect(fs.existsSync(navPath)).toBe(true);
  });

  it('[SPEC-SEC-001/RF-1] Nav has .nav-inner with glass/blur style', () => {
    const c = fs.readFileSync(navPath, 'utf-8');
    expect(c).toContain('nav-inner');
    expect(c).toContain('backdrop-filter');
  });

  it('[SPEC-SEC-001/RF-1] Nav imports Logo and Button primitives', () => {
    const c = fs.readFileSync(navPath, 'utf-8');
    expect(c).toContain("Logo.astro'");
    expect(c).toContain("Button.astro'");
  });

  it('[SPEC-SEC-001/RF-1] Nav has .nav-links desktop link list', () => {
    expect(fs.readFileSync(navPath, 'utf-8')).toContain('nav-links');
  });

  it('[SPEC-SEC-001/RF-1] Nav has id="nav" for interactions.js hook', () => {
    expect(fs.readFileSync(navPath, 'utf-8')).toContain('id="nav"');
  });
});

// ── RF-2: contenido tipado ─────────────────────────────────────────────────
describe('SPEC-SEC-001/RF-2 — props', () => {
  it('[SPEC-SEC-001/RF-2] Nav has links and cta props', () => {
    const c = fs.readFileSync(navPath, 'utf-8');
    expect(c).toContain('links');
    expect(c).toContain('cta');
  });

  it('[SPEC-SEC-001/RF-2] Nav renders links via .map() — no hardcoded copy', () => {
    const c = fs.readFileSync(navPath, 'utf-8');
    expect(c).toContain('links.map');
    expect(c).not.toContain('>How It Works<');
    expect(c).not.toContain('>Our Plans<');
  });
});

// ── RF-3: móvil details/summary ────────────────────────────────────────────
describe('SPEC-SEC-001/RF-3 — móvil accesible', () => {
  it('[SPEC-SEC-001/RF-3] Nav has <details> for mobile toggle', () => {
    expect(fs.readFileSync(navPath, 'utf-8')).toContain('<details');
  });

  it('[SPEC-SEC-001/RF-3] Nav has <summary> inside details', () => {
    expect(fs.readFileSync(navPath, 'utf-8')).toContain('<summary');
  });
});

// ── RF-4: hooks ────────────────────────────────────────────────────────────
describe('SPEC-SEC-001/RF-4 — hooks', () => {
  it('[SPEC-SEC-001/RF-4] Nav CTA has magnetic modifier', () => {
    expect(fs.readFileSync(navPath, 'utf-8')).toContain('magnetic');
  });
});

// ── RNF-1: a11y ────────────────────────────────────────────────────────────
describe('SPEC-SEC-001/RNF-1 — a11y', () => {
  it('[SPEC-SEC-001/RNF-1] nav element has aria-label', () => {
    expect(fs.readFileSync(navPath, 'utf-8')).toContain('aria-label');
  });

  it('[SPEC-SEC-001/RNF-1] active link renders aria-current', () => {
    expect(fs.readFileSync(navPath, 'utf-8')).toContain('aria-current');
  });
});

// ── RNF-2: sin JS propio ───────────────────────────────────────────────────
describe('SPEC-SEC-001/RNF-2 — perf', () => {
  it('[SPEC-SEC-001/RNF-2] Nav has no <script> (uses global interactions.js)', () => {
    expect(fs.readFileSync(navPath, 'utf-8')).not.toContain('<script');
  });
});

// ── RNF-3: fidelidad visual ────────────────────────────────────────────────
describe('SPEC-SEC-001/RNF-3 — fidelidad', () => {
  it('[SPEC-SEC-001/RNF-3] design source 01-nav.html exists', () => {
    expect(
      fs.existsSync(path.join(ROOT, 'design/template/sections/01-nav.html')),
    ).toBe(true);
  });

  it('[SPEC-SEC-001/RNF-3] Nav key CSS classes match source design', () => {
    const c = fs.readFileSync(navPath, 'utf-8');
    const source = fs.readFileSync(
      path.join(ROOT, 'design/template/sections/01-nav.html'), 'utf-8',
    );
    for (const cls of ['nav-inner', 'nav-links', 'nav-cta']) {
      expect(source, `${cls} not in source`).toContain(cls);
      expect(c, `${cls} missing from Nav.astro`).toContain(cls);
    }
  });
});

// ── INV-1: SRP ─────────────────────────────────────────────────────────────
describe('SPEC-SEC-001/INV-1 — SRP', () => {
  it('[SPEC-SEC-001/INV-1] Nav.astro is under 200 lines', () => {
    const lines = fs.readFileSync(navPath, 'utf-8').split('\n').length;
    expect(lines).toBeLessThan(200);
  });
});

// ── INV-2: tokens + props ──────────────────────────────────────────────────
describe('SPEC-SEC-001/INV-2 — tokens y props', () => {
  it('[SPEC-SEC-001/INV-2] Nav <style> uses no bare 6-digit hex colors', () => {
    const c = fs.readFileSync(navPath, 'utf-8');
    const m = c.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (m) expect(m[1]).not.toMatch(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/);
  });
});
