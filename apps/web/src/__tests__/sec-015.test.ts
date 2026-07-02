/**
 * SPEC-SEC-015 — Assembly: index.astro (14 sections) + BaseLayout SEO
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const idx = path.join(WEB, 'src/pages/index.astro');
const layout = path.join(WEB, 'src/layouts/BaseLayout.astro');

// ── RF-1: BaseLayout SEO ──────────────────────────────────────────────────
describe('SPEC-SEC-015/RF-1 — BaseLayout SEO', () => {
  it('[SPEC-SEC-015/RF-1] BaseLayout has lang="en"', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('lang="en"');
  });

  it('[SPEC-SEC-015/RF-1] BaseLayout has canonical link prop', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('canonical');
  });

  it('[SPEC-SEC-015/RF-1] BaseLayout has og:type meta', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('og:type');
  });

  it('[SPEC-SEC-015/RF-1] BaseLayout has og:title meta', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('og:title');
  });

  it('[SPEC-SEC-015/RF-1] BaseLayout has og:description meta', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('og:description');
  });

  it('[SPEC-SEC-015/RF-1] BaseLayout has og:url meta', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('og:url');
  });
});

// ── RF-2: All 14 sections in index.astro ─────────────────────────────────
describe('SPEC-SEC-015/RF-2 — 14 sections composed', () => {
  const sections = [
    'Nav', 'Hero', 'Marquee', 'PainPoints', 'Value',
    'HowItWorks', 'Plans', 'Testimonials', 'Portfolio',
    'About', 'Faq', 'CtaStrip', 'Contact', 'Footer',
  ];

  for (const name of sections) {
    it(`[SPEC-SEC-015/RF-2] index.astro imports and uses ${name}`, () => {
      const c = fs.readFileSync(idx, 'utf-8');
      expect(c).toContain(`import ${name}`);
      expect(c).toContain(`<${name}`);
    });
  }
});

// ── RF-3: SEO props passed ────────────────────────────────────────────────
describe('SPEC-SEC-015/RF-3 — SEO props in index.astro', () => {
  it('[SPEC-SEC-015/RF-3] passes title to BaseLayout', () => {
    expect(fs.readFileSync(idx, 'utf-8')).toContain('title=');
  });

  it('[SPEC-SEC-015/RF-3] passes description to BaseLayout', () => {
    expect(fs.readFileSync(idx, 'utf-8')).toContain('description=');
  });

  it('[SPEC-SEC-015/RF-3] passes canonical to BaseLayout', () => {
    expect(fs.readFileSync(idx, 'utf-8')).toContain('canonical=');
  });
});

// ── RF-4: visual gate exists ─────────────────────────────────────────────────
describe('SPEC-SEC-015/RF-4 — above-fold visual gate', () => {
  it('[SPEC-SEC-015/RF-4] design template index.html source exists', () => {
    const designIndex = path.join(ROOT, 'design/template/index.html');
    expect(fs.existsSync(designIndex), 'design/template/index.html must exist as gate source').toBe(true);
  });
});

// ── RF-5: interactions.js on full page ────────────────────────────────────────
describe('SPEC-SEC-015/RF-5 — interactions.js progressive enhancement', () => {
  it('[SPEC-SEC-015/RF-5] BaseLayout loads interactions.js deferred', () => {
    const c = fs.readFileSync(layout, 'utf-8');
    expect(c).toContain('interactions.js');
    expect(c).toContain('defer');
  });

  it('[SPEC-SEC-015/RF-5] BaseLayout adds .js class before first paint', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain("classList.add('js')");
  });
});

// ── RNF-1: page a11y landmarks ────────────────────────────────────────────────
describe('SPEC-SEC-015/RNF-1 — a11y landmarks and lang', () => {
  it('[SPEC-SEC-015/RNF-1] BaseLayout has lang="en" on html element', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('lang="en"');
  });

  it('[SPEC-SEC-015/RNF-1] index.astro uses Nav for header landmark', () => {
    expect(fs.readFileSync(idx, 'utf-8')).toContain('<Nav');
  });

  it('[SPEC-SEC-015/RNF-1] index.astro uses Footer for footer landmark', () => {
    expect(fs.readFileSync(idx, 'utf-8')).toContain('<Footer');
  });
});

// ── RNF-2: no accidental JS in index.astro ────────────────────────────────────
describe('SPEC-SEC-015/RNF-2 — no accidental client JS', () => {
  it('[SPEC-SEC-015/RNF-2] index.astro has no <script> blocks', () => {
    expect(fs.readFileSync(idx, 'utf-8')).not.toContain('<script');
  });
});

// ── RNF-3: responsive ────────────────────────────────────────────────────────
describe('SPEC-SEC-015/RNF-3 — responsive page', () => {
  it('[SPEC-SEC-015/RNF-3] BaseLayout has meta viewport', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('name="viewport"');
  });

  it('[SPEC-SEC-015/RNF-3] index.astro has no fixed-width inline style attributes', () => {
    expect(fs.readFileSync(idx, 'utf-8')).not.toContain('style=');
  });
});

// ── INV-2: index.astro only composes ─────────────────────────────────────────
describe('SPEC-SEC-015/INV-2 — index.astro is composition-only', () => {
  it('[SPEC-SEC-015/INV-2] index.astro has no <style> block', () => {
    expect(fs.readFileSync(idx, 'utf-8')).not.toContain('<style');
  });

  it('[SPEC-SEC-015/INV-2] index.astro has no raw <div> elements', () => {
    expect(fs.readFileSync(idx, 'utf-8')).not.toContain('<div');
  });

  it('[SPEC-SEC-015/INV-2] index.astro has no raw <section> elements', () => {
    expect(fs.readFileSync(idx, 'utf-8')).not.toContain('<section');
  });
});

// ── INV-1: single h1 ─────────────────────────────────────────────────────
describe('SPEC-SEC-015/INV-1 — single h1', () => {
  it('[SPEC-SEC-015/INV-1] Hero.astro uses <h1>', () => {
    const hero = fs.readFileSync(path.join(WEB, 'src/components/Hero.astro'), 'utf-8');
    expect(hero).toContain('<h1');
  });

  it('[SPEC-SEC-015/INV-1] no other section component defines <h1>', () => {
    const comps = ['Nav', 'Marquee', 'PainPoints', 'Value', 'HowItWorks',
      'Plans', 'Testimonials', 'Portfolio', 'About', 'Faq', 'CtaStrip',
      'Contact', 'Footer'];
    for (const name of comps) {
      const c = fs.readFileSync(path.join(WEB, `src/components/${name}.astro`), 'utf-8');
      expect(c, `${name}.astro should not have <h1>`).not.toMatch(/<h1[\s>]/);
    }
  });
});
