/**
 * SPEC-SEC-002 — Hero
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const heroPath = path.join(WEB, 'src/components/Hero.astro');

// ── RF-1: estructura/estilo ─────────────────────────────────────────────────
describe('SPEC-SEC-002/RF-1 — estructura', () => {
  it('[SPEC-SEC-002/RF-1] Hero.astro exists', () => {
    expect(fs.existsSync(heroPath)).toBe(true);
  });

  it('[SPEC-SEC-002/RF-1] Hero has dark section with .hero has-spot', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain('hero');
    expect(c).toContain('has-spot');
  });

  it('[SPEC-SEC-002/RF-1] Hero imports Aurora and Pill primitives', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain("Aurora.astro'");
    expect(c).toContain("Pill.astro'");
  });

  it('[SPEC-SEC-002/RF-1] Hero has hero-grid-mesh decorative element', () => {
    expect(fs.readFileSync(heroPath, 'utf-8')).toContain('hero-grid-mesh');
  });

  it('[SPEC-SEC-002/RF-1] Hero has .display class h1 (single heading)', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain('display');
    expect(c).toContain('<h1');
  });

  it('[SPEC-SEC-002/RF-1] Hero has hero-ctas section with Button imports', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain('hero-ctas');
    expect(c).toContain("Button.astro'");
  });
});

// ── RF-2: preview 3D ───────────────────────────────────────────────────────
describe('SPEC-SEC-002/RF-2 — preview 3D', () => {
  it('[SPEC-SEC-002/RF-2] Hero has hero-stage with hero-screen', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain('hero-stage');
    expect(c).toContain('hero-screen');
  });

  it('[SPEC-SEC-002/RF-2] Hero has browser bar simulation (hs-bar)', () => {
    expect(fs.readFileSync(heroPath, 'utf-8')).toContain('hs-bar');
  });

  it('[SPEC-SEC-002/RF-2] Hero uses FloatingCard for floating badges', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain("FloatingCard.astro'");
  });

  it('[SPEC-SEC-002/RF-2] Hero has hs-right with orbital rings', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain('hs-right');
    expect(c).toContain('ring');
  });
});

// ── RF-3: props tipadas ────────────────────────────────────────────────────
describe('SPEC-SEC-002/RF-3 — props', () => {
  it('[SPEC-SEC-002/RF-3] Hero has title, subtitle, ctas props', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain('title');
    expect(c).toContain('subtitle');
    expect(c).toContain('ctas');
  });

  it('[SPEC-SEC-002/RF-3] Hero has pill, snippet, preview, floats props', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain('pill');
    expect(c).toContain('snippet');
    expect(c).toContain('preview');
    expect(c).toContain('floats');
  });

  it('[SPEC-SEC-002/RF-3] Hero title renders via set:html (no hardcoded copy)', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain('set:html');
    expect(c).not.toContain('Your Business Deserves');
  });
});

// ── RF-4: hooks data-reveal / magnetic ────────────────────────────────────
describe('SPEC-SEC-002/RF-4 — hooks', () => {
  it('[SPEC-SEC-002/RF-4] Hero has data-reveal attributes', () => {
    expect(fs.readFileSync(heroPath, 'utf-8')).toContain('data-reveal');
  });

  it('[SPEC-SEC-002/RF-4] Hero has staggered --d delay values', () => {
    expect(fs.readFileSync(heroPath, 'utf-8')).toContain('--d:');
  });

  it('[SPEC-SEC-002/RF-4] Hero CTAs have .magnetic modifier', () => {
    expect(fs.readFileSync(heroPath, 'utf-8')).toContain('magnetic');
  });
});

// ── RNF-1: a11y ────────────────────────────────────────────────────────────
describe('SPEC-SEC-002/RNF-1 — a11y', () => {
  it('[SPEC-SEC-002/RNF-1] Hero has single h1 (aria heading hierarchy)', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    const h1Count = (c.match(/<h1/g) ?? []).length;
    expect(h1Count).toBe(1);
  });

  it('[SPEC-SEC-002/RNF-1] Hero section has aria-label or aria-labelledby', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toMatch(/aria-label(ledby)?=/);
  });

  it('[SPEC-SEC-002/RNF-1] Aurora has aria-hidden (decorative)', () => {
    const aurora = fs.readFileSync(path.join(WEB, 'src/components/Aurora.astro'), 'utf-8');
    expect(aurora).toContain('aria-hidden');
  });
});

// ── RNF-2: perf ────────────────────────────────────────────────────────────
describe('SPEC-SEC-002/RNF-2 — perf', () => {
  it('[SPEC-SEC-002/RNF-2] Hero has no own <script> (uses global)', () => {
    expect(fs.readFileSync(heroPath, 'utf-8')).not.toContain('<script');
  });
});

// ── RNF-3: responsive ─────────────────────────────────────────────────────
describe('SPEC-SEC-002/RNF-3 — responsive', () => {
  it('[SPEC-SEC-002/RNF-3] Hero hides floats on mobile via CSS media query', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain('max-width');
    expect(c).toContain('display: none');
  });
});

// ── RNF-4: fidelidad visual ────────────────────────────────────────────────
describe('SPEC-SEC-002/RNF-4 — fidelidad', () => {
  it('[SPEC-SEC-002/RNF-4] design source 02-hero.html exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'design/template/sections/02-hero.html'))).toBe(true);
  });

  it('[SPEC-SEC-002/RNF-4] Hero key CSS classes match source design', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    const source = fs.readFileSync(
      path.join(ROOT, 'design/template/sections/02-hero.html'),
      'utf-8',
    );
    for (const cls of ['hero-stage', 'hero-screen', 'hero-ctas', 'hero-float']) {
      expect(source, `${cls} not in source`).toContain(cls);
      expect(c, `${cls} missing from Hero.astro`).toContain(cls);
    }
  });
});

// ── INV-1: SRP ─────────────────────────────────────────────────────────────
describe('SPEC-SEC-002/INV-1 — SRP', () => {
  it('[SPEC-SEC-002/INV-1] Hero.astro is under 200 lines', () => {
    const lines = fs.readFileSync(heroPath, 'utf-8').split('\n').length;
    expect(lines).toBeLessThan(200);
  });
});

// ── INV-2: tokens + primitivas ─────────────────────────────────────────────
describe('SPEC-SEC-002/INV-2 — tokens y primitivas', () => {
  it('[SPEC-SEC-002/INV-2] Hero uses Aurora, Pill, Button, FloatingCard primitives', () => {
    const c = fs.readFileSync(heroPath, 'utf-8');
    expect(c).toContain("Aurora.astro'");
    expect(c).toContain("Pill.astro'");
    expect(c).toContain("Button.astro'");
    expect(c).toContain("FloatingCard.astro'");
  });
});
