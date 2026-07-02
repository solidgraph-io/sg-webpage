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
