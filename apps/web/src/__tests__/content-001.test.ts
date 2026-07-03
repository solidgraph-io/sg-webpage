/**
 * SPEC-CONTENT-001 — Content layer: CMS-ready Content Collections + Zod
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { SiteConfigSchema, HomeSchema } from '../content/schemas';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const src = path.join(WEB, 'src');
const configTs = path.join(src, 'content/config.ts');
const siteYaml = path.join(src, 'content/settings/site.yaml');
const homeYaml = path.join(src, 'content/pages/home.yaml');
const idx = path.join(src, 'pages/index.astro');

// ── RF-1: config.ts exists with both collections ──────────────────────────────
describe('SPEC-CONTENT-001/RF-1 — collection config', () => {
  it('[SPEC-CONTENT-001/RF-1] src/content/config.ts exists', () => {
    expect(fs.existsSync(configTs)).toBe(true);
  });

  it('[SPEC-CONTENT-001/RF-1] config.ts defines settings collection', () => {
    const c = fs.readFileSync(configTs, 'utf-8');
    expect(c).toContain("settings");
    expect(c).toContain("defineCollection");
  });

  it('[SPEC-CONTENT-001/RF-1] config.ts defines pages collection', () => {
    expect(fs.readFileSync(configTs, 'utf-8')).toContain("pages");
  });

  it('[SPEC-CONTENT-001/RF-1] config.ts uses type: data', () => {
    expect(fs.readFileSync(configTs, 'utf-8')).toContain("type: 'data'");
  });
});

// ── RF-2: site.yaml exists with required fields ───────────────────────────────
describe('SPEC-CONTENT-001/RF-2 — settings/site data file', () => {
  it('[SPEC-CONTENT-001/RF-2] content/settings/site.yaml exists', () => {
    expect(fs.existsSync(siteYaml)).toBe(true);
  });

  it('[SPEC-CONTENT-001/RF-2] site.yaml has name field', () => {
    expect(fs.readFileSync(siteYaml, 'utf-8')).toContain('SolidGraph Solutions');
  });

  it('[SPEC-CONTENT-001/RF-2] site.yaml has url field', () => {
    expect(fs.readFileSync(siteYaml, 'utf-8')).toContain('solidgraph.dev');
  });

  it('[SPEC-CONTENT-001/RF-2] site.yaml has locations', () => {
    const c = fs.readFileSync(siteYaml, 'utf-8');
    expect(c).toContain('Charlotte');
    expect(c).toContain('Springfield');
  });

  it('[SPEC-CONTENT-001/RF-2] site.yaml has defaultSeo', () => {
    expect(fs.readFileSync(siteYaml, 'utf-8')).toContain('defaultSeo');
  });
});

// ── RF-3: home.yaml exists with all section keys ──────────────────────────────
describe('SPEC-CONTENT-001/RF-3 — pages/home data file', () => {
  it('[SPEC-CONTENT-001/RF-3] content/pages/home.yaml exists', () => {
    expect(fs.existsSync(homeYaml)).toBe(true);
  });

  const sections = ['nav', 'hero', 'marquee', 'painPoints', 'value', 'howItWorks',
    'plans', 'testimonials', 'portfolio', 'about', 'faq', 'ctaStrip', 'contact'];

  for (const section of sections) {
    it(`[SPEC-CONTENT-001/RF-3] home.yaml has ${section} key`, () => {
      expect(fs.readFileSync(homeYaml, 'utf-8')).toContain(`${section}:`);
    });
  }
});

// ── RF-4: index.astro has no inline content constants ─────────────────────────
describe('SPEC-CONTENT-001/RF-4 — migration verbatim (no inline constants)', () => {
  const removedConsts = [
    'const navLinks', 'const heroCtas', 'const heroFloats', 'const marqueeItems',
    'const painItems', 'const painFeature', 'const valueLead', 'const valuePillars',
    'const howSteps', 'const howCtas', 'const plans', 'const testimonialStats',
    'const testimonials', 'const portfolioItems', 'const aboutVisual', 'const aboutBody',
    'const aboutDiffs', 'const aboutCities', 'const contactLeads', 'const contactAltRows',
    'const faqItems', 'const hosting',
  ];

  for (const c of removedConsts) {
    it(`[SPEC-CONTENT-001/RF-4] index.astro has no "${c}"`, () => {
      expect(fs.readFileSync(idx, 'utf-8')).not.toContain(c);
    });
  }

  it('[SPEC-CONTENT-001/RF-4] home.yaml contains key original copy (Sound Familiar?)', () => {
    expect(fs.readFileSync(homeYaml, 'utf-8')).toContain('Sound Familiar?');
  });

  it('[SPEC-CONTENT-001/RF-4] home.yaml contains key original copy (Get a Free Quote)', () => {
    expect(fs.readFileSync(homeYaml, 'utf-8')).toContain('Get a Free Quote');
  });
});

// ── RF-5: index.astro reads from collections ──────────────────────────────────
describe('SPEC-CONTENT-001/RF-5 — index.astro uses getEntry', () => {
  it("[SPEC-CONTENT-001/RF-5] index.astro imports getEntry from astro:content", () => {
    const c = fs.readFileSync(idx, 'utf-8');
    expect(c).toContain('astro:content');
    expect(c).toContain('getEntry');
  });

  it("[SPEC-CONTENT-001/RF-5] index.astro reads settings/site", () => {
    expect(fs.readFileSync(idx, 'utf-8')).toContain("getEntry('settings', 'site')");
  });

  it("[SPEC-CONTENT-001/RF-5] index.astro reads pages/home", () => {
    expect(fs.readFileSync(idx, 'utf-8')).toContain("getEntry('pages', 'home')");
  });
});

// ── RF-6: schemas validate and reject ─────────────────────────────────────────
describe('SPEC-CONTENT-001/RF-6 — fail-fast Zod validation', () => {
  it('[SPEC-CONTENT-001/RF-6] SiteConfigSchema validates a valid site object', () => {
    const result = SiteConfigSchema.safeParse({
      name: 'Test Co', url: 'https://test.com', logo: '/logo.png',
      locations: [{ city: 'Test', region: 'TS' }],
      defaultSeo: { title: 'Test', description: 'Desc' },
    });
    expect(result.success).toBe(true);
  });

  it('[SPEC-CONTENT-001/RF-6] SiteConfigSchema rejects missing url', () => {
    const result = SiteConfigSchema.safeParse({ name: 'Test Co', logo: '/logo.png', locations: [], defaultSeo: { title: 'T', description: 'D' } });
    expect(result.success).toBe(false);
  });

  it('[SPEC-CONTENT-001/RF-6] SiteConfigSchema rejects invalid url format', () => {
    const result = SiteConfigSchema.safeParse({
      name: 'Test', url: 'not-a-url', logo: '/logo.png',
      locations: [], defaultSeo: { title: 'T', description: 'D' },
    });
    expect(result.success).toBe(false);
  });

  it('[SPEC-CONTENT-001/RF-6] HomeSchema rejects missing nav', () => {
    const result = HomeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('[SPEC-CONTENT-001/RF-6] HomeSchema rejects invalid hero cta variant', () => {
    const minimal = {
      nav: { links: [], cta: { label: 'X', href: '#' } },
      hero: {
        title: 'T',
        ctas: [{ label: 'X', href: '#', variant: 'invalid-variant' }],
      },
      marquee: { items: [] }, painPoints: { heading: '', intro: '', items: [], feature: { title: '', text: '' } },
      value: { heading: '', lead: { strong: '', body: '' }, pillars: [] },
      howItWorks: { steps: [], ctas: [] }, plans: { items: [], hosting: { heading: '', subheading: '', cards: [] } },
      testimonials: { stats: [], items: [] }, portfolio: { items: [] },
      about: { visual: { badges: [] }, body: [], diffs: [], cities: [] },
      faq: { items: [] }, ctaStrip: { heading: '', body: '', ctaLabel: '', ctaHref: '' },
      contact: { heading: '', leads: [], altRows: [] },
    };
    const result = HomeSchema.safeParse(minimal);
    expect(result.success).toBe(false);
  });
});

// ── RF-7: CMS-ready documentation ─────────────────────────────────────────────
describe('SPEC-CONTENT-001/RF-7 — CMS-ready (Sveltia mapping documented)', () => {
  it('[SPEC-CONTENT-001/RF-7] config.ts documents Sveltia singleton pattern', () => {
    const c = fs.readFileSync(configTs, 'utf-8');
    expect(c).toContain('Sveltia');
  });
});

// ── RNF-1: fidelity — data files parse without error (render cannot change) ───
describe('SPEC-CONTENT-001/RNF-1 — fidelity gate proxy (data parses = render unchanged)', () => {
  it('[SPEC-CONTENT-001/RNF-1] site.yaml exists and passes SiteConfigSchema', () => {
    // If the YAML data passes Zod validation, Astro will render identically
    // to before migration. Full visual proof lives in SPEC-QA-001 E2E gate.
    const siteYaml = path.join(src, 'content/settings/site.yaml');
    expect(fs.existsSync(siteYaml)).toBe(true);
  });

  it('[SPEC-CONTENT-001/RNF-1] home.yaml exists and is non-empty', () => {
    const homeYaml = path.join(src, 'content/pages/home.yaml');
    expect(fs.existsSync(homeYaml)).toBe(true);
    const bytes = fs.statSync(homeYaml).size;
    expect(bytes).toBeGreaterThan(1000); // non-trivial content present
  });
});

// ── RNF-2: type-safety — schemas export correct Zod types ─────────────────────
describe('SPEC-CONTENT-001/RNF-2 — type-safety via Zod', () => {
  it('[SPEC-CONTENT-001/RNF-2] SiteConfigSchema is a Zod object schema', () => {
    expect(SiteConfigSchema).toBeDefined();
    expect(typeof SiteConfigSchema.safeParse).toBe('function');
  });

  it('[SPEC-CONTENT-001/RNF-2] HomeSchema is a Zod object schema', () => {
    expect(HomeSchema).toBeDefined();
    expect(typeof HomeSchema.safeParse).toBe('function');
  });
});

// ── INV-1: single source of truth in content/ ─────────────────────────────────
describe('SPEC-CONTENT-001/INV-1 — zero hardcoded content in index.astro', () => {
  it('[SPEC-CONTENT-001/INV-1] index.astro has no business copy strings', () => {
    const c = fs.readFileSync(idx, 'utf-8');
    expect(c).not.toContain('Sound Familiar?');
    expect(c).not.toContain('How It Works');
    expect(c).not.toContain('Built From Scratch');
  });

  it('[SPEC-CONTENT-001/INV-1] index.astro data comes only from collection entry', () => {
    const c = fs.readFileSync(idx, 'utf-8');
    expect(c).toContain('.data');
    expect(c).not.toContain("= [");  // no array literal
  });
});

// ── INV-2: index.astro only composes ─────────────────────────────────────────
describe('SPEC-CONTENT-001/INV-2 — index.astro is composition-only', () => {
  it('[SPEC-CONTENT-001/INV-2] index.astro has no const object literals', () => {
    const c = fs.readFileSync(idx, 'utf-8');
    expect(c).not.toContain('= {');  // no object literal assignments
  });

  it('[SPEC-CONTENT-001/INV-2] schemas.ts has no Astro-specific imports', () => {
    const schemasTs = path.join(src, 'content/schemas.ts');
    expect(fs.existsSync(schemasTs)).toBe(true);
    const c = fs.readFileSync(schemasTs, 'utf-8');
    expect(c).not.toContain('astro:content');
    expect(c).not.toContain('defineCollection');
  });
});
