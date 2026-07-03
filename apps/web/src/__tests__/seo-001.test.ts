/**
 * SPEC-SEO-001 — SEO de lanzamiento: metadatos, OG, JSON-LD, sitemap, robots
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { buildLocalBusinessJsonLd } from '../lib/seo';
import { SiteConfigSchema } from '../content/schemas';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const src = path.join(WEB, 'src');
const layout = path.join(src, 'layouts/BaseLayout.astro');

// ── RF-1: SiteConfig from Content Collection (not a hardcoded .ts) ──────────
describe('SPEC-SEO-001/RF-1 — SiteConfig from Content Collection', () => {
  it('[SPEC-SEO-001/RF-1] settings/site.yaml exists', () => {
    expect(fs.existsSync(path.join(src, 'content/settings/site.yaml'))).toBe(true);
  });

  it('[SPEC-SEO-001/RF-1] site.yaml has required SiteConfig fields', () => {
    const yaml = fs.readFileSync(path.join(src, 'content/settings/site.yaml'), 'utf-8');
    expect(yaml).toContain('name:');
    expect(yaml).toContain('url:');
    expect(yaml).toContain('logo:');
    expect(yaml).toContain('locations:');
    expect(yaml).toContain('defaultSeo:');
  });

  it('[SPEC-SEO-001/RF-1] SiteConfigSchema validates the site data shape', () => {
    const result = SiteConfigSchema.safeParse({
      name: 'SolidGraph Solutions',
      url: 'https://solidgraph.dev',
      logo: '/assets/logo_avatar.png',
      locations: [{ city: 'Charlotte', region: 'NC' }],
      defaultSeo: { title: 'Title', description: 'Desc' },
    });
    expect(result.success).toBe(true);
  });

  it('[SPEC-SEO-001/RF-1] no hardcoded .ts SiteConfig file (data comes from YAML)', () => {
    const tsFile = path.join(src, 'config/site.ts');
    expect(fs.existsSync(tsFile)).toBe(false);
  });
});

// ── RF-2: JSON-LD LocalBusiness ──────────────────────────────────────────────
describe('SPEC-SEO-001/RF-2 — JSON-LD LocalBusiness', () => {
  const mockSite = SiteConfigSchema.parse({
    name: 'SolidGraph Solutions',
    legalName: 'SolidGraph Solutions LLC',
    url: 'https://solidgraph.dev',
    logo: '/assets/logo_avatar.png',
    locations: [
      { city: 'Charlotte', region: 'NC' },
      { city: 'Springfield-Branson', region: 'MO' },
    ],
    contact: { email: 'hello@solidgraph.com' },
    sameAs: [],
    defaultSeo: { title: 'Test', description: 'Desc' },
  });

  it('[SPEC-SEO-001/RF-2] buildLocalBusinessJsonLd returns valid JSON', () => {
    const json = buildLocalBusinessJsonLd(mockSite);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('[SPEC-SEO-001/RF-2] JSON-LD has @context schema.org', () => {
    const ld = JSON.parse(buildLocalBusinessJsonLd(mockSite));
    expect(ld['@context']).toBe('https://schema.org');
  });

  it('[SPEC-SEO-001/RF-2] JSON-LD @type is LocalBusiness', () => {
    const ld = JSON.parse(buildLocalBusinessJsonLd(mockSite));
    expect(ld['@type']).toBe('LocalBusiness');
  });

  it('[SPEC-SEO-001/RF-2] JSON-LD has name from SiteConfig', () => {
    const ld = JSON.parse(buildLocalBusinessJsonLd(mockSite));
    expect(ld.name).toBe('SolidGraph Solutions');
  });

  it('[SPEC-SEO-001/RF-2] JSON-LD has url from SiteConfig', () => {
    const ld = JSON.parse(buildLocalBusinessJsonLd(mockSite));
    expect(ld.url).toBe('https://solidgraph.dev');
  });

  it('[SPEC-SEO-001/RF-2] JSON-LD has logo as absolute URL', () => {
    const ld = JSON.parse(buildLocalBusinessJsonLd(mockSite));
    expect(ld.logo).toMatch(/^https?:\/\//);
    expect(ld.logo).toContain('logo_avatar');
  });

  it('[SPEC-SEO-001/RF-2] JSON-LD areaServed contains both locations', () => {
    const ld = JSON.parse(buildLocalBusinessJsonLd(mockSite));
    expect(Array.isArray(ld.areaServed)).toBe(true);
    expect(ld.areaServed).toHaveLength(2);
    const names = ld.areaServed.map((a: { name: string }) => a.name);
    expect(names.some((n: string) => n.includes('Charlotte'))).toBe(true);
    expect(names.some((n: string) => n.includes('Springfield'))).toBe(true);
  });

  it('[SPEC-SEO-001/RF-2] BaseLayout injects application/ld+json script', () => {
    const c = fs.readFileSync(layout, 'utf-8');
    expect(c).toContain('application/ld+json');
  });
});

// ── RF-3: Open Graph + Twitter Card ─────────────────────────────────────────
describe('SPEC-SEO-001/RF-3 — OG + Twitter tags in BaseLayout', () => {
  it('[SPEC-SEO-001/RF-3] BaseLayout has og:title', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('og:title');
  });

  it('[SPEC-SEO-001/RF-3] BaseLayout has og:description', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('og:description');
  });

  it('[SPEC-SEO-001/RF-3] BaseLayout has og:image', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('og:image');
  });

  it('[SPEC-SEO-001/RF-3] BaseLayout has og:url', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('og:url');
  });

  it('[SPEC-SEO-001/RF-3] BaseLayout has og:type', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('og:type');
  });

  it('[SPEC-SEO-001/RF-3] BaseLayout has twitter:card', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('twitter:card');
  });

  it('[SPEC-SEO-001/RF-3] BaseLayout has twitter:title', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('twitter:title');
  });

  it('[SPEC-SEO-001/RF-3] BaseLayout has og:site_name', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('og:site_name');
  });
});

// ── RF-4: canonical ──────────────────────────────────────────────────────────
describe('SPEC-SEO-001/RF-4 — canonical in BaseLayout', () => {
  it('[SPEC-SEO-001/RF-4] BaseLayout renders canonical link', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('rel="canonical"');
  });

  it('[SPEC-SEO-001/RF-4] BaseLayout falls back to site.url when no canonical prop', () => {
    const c = fs.readFileSync(layout, 'utf-8');
    expect(c).toContain('sd?.url');
  });
});

// ── RF-5: sitemap.xml endpoint ───────────────────────────────────────────────
describe('SPEC-SEO-001/RF-5 — sitemap.xml endpoint', () => {
  it('[SPEC-SEO-001/RF-5] sitemap.xml.ts endpoint exists', () => {
    expect(fs.existsSync(path.join(src, 'pages/sitemap.xml.ts'))).toBe(true);
  });

  it('[SPEC-SEO-001/RF-5] sitemap endpoint exports GET handler', () => {
    const c = fs.readFileSync(path.join(src, 'pages/sitemap.xml.ts'), 'utf-8');
    expect(c).toContain('export const GET');
  });

  it('[SPEC-SEO-001/RF-5] sitemap includes home URL', () => {
    const c = fs.readFileSync(path.join(src, 'pages/sitemap.xml.ts'), 'utf-8');
    expect(c).toContain('/');
  });

  it('[SPEC-SEO-001/RF-5] sitemap uses sitemaps.org schema', () => {
    const c = fs.readFileSync(path.join(src, 'pages/sitemap.xml.ts'), 'utf-8');
    expect(c).toContain('sitemaps.org');
  });
});

// ── RF-6: robots.txt endpoint ────────────────────────────────────────────────
describe('SPEC-SEO-001/RF-6 — robots.txt endpoint', () => {
  it('[SPEC-SEO-001/RF-6] robots.txt.ts endpoint exists', () => {
    expect(fs.existsSync(path.join(src, 'pages/robots.txt.ts'))).toBe(true);
  });

  it('[SPEC-SEO-001/RF-6] robots endpoint exports GET handler', () => {
    const c = fs.readFileSync(path.join(src, 'pages/robots.txt.ts'), 'utf-8');
    expect(c).toContain('export const GET');
  });

  it('[SPEC-SEO-001/RF-6] robots.txt references the sitemap', () => {
    const c = fs.readFileSync(path.join(src, 'pages/robots.txt.ts'), 'utf-8');
    expect(c).toContain('sitemap');
  });

  it('[SPEC-SEO-001/RF-6] robots.txt has noindex branch for staging', () => {
    const c = fs.readFileSync(path.join(src, 'pages/robots.txt.ts'), 'utf-8');
    expect(c.toLowerCase()).toContain('noindex');
  });
});

// ── RF-7: single h1 + heading outline ────────────────────────────────────────
describe('SPEC-SEO-001/RF-7 — single h1 and heading outline', () => {
  it('[SPEC-SEO-001/RF-7] Hero is the only component with <h1>', () => {
    const heroFile = path.join(src, 'components/Hero.astro');
    expect(fs.readFileSync(heroFile, 'utf-8')).toContain('<h1');
  });

  it('[SPEC-SEO-001/RF-7] no other section component has <h1>', () => {
    const files = fs.readdirSync(path.join(src, 'components'))
      .filter((f) => f.endsWith('.astro') && f !== 'Hero.astro');
    for (const f of files) {
      const c = fs.readFileSync(path.join(src, 'components', f), 'utf-8');
      expect(c, `${f} should not have <h1>`).not.toMatch(/<h1[\s>]/);
    }
  });
});

// ── RNF-1: no client JS in SEO code ─────────────────────────────────────────
describe('SPEC-SEO-001/RNF-1 — SEO code does not add client JS', () => {
  it('[SPEC-SEO-001/RNF-1] lib/seo.ts has no import.meta reference', () => {
    const c = fs.readFileSync(path.join(src, 'lib/seo.ts'), 'utf-8');
    expect(c).not.toContain('import.meta.env');
  });

  it('[SPEC-SEO-001/RNF-1] lib/seo.ts has no window or document references', () => {
    const c = fs.readFileSync(path.join(src, 'lib/seo.ts'), 'utf-8');
    expect(c).not.toContain('window.');
    expect(c).not.toContain('document.');
  });
});

// ── RNF-2: fidelity — BaseLayout still intact ────────────────────────────────
describe('SPEC-SEO-001/RNF-2 — BaseLayout SEO additions do not break layout', () => {
  it('[SPEC-SEO-001/RNF-2] BaseLayout has lang="en"', () => {
    expect(fs.readFileSync(layout, 'utf-8')).toContain('lang="en"');
  });

  it('[SPEC-SEO-001/RNF-2] BaseLayout has font preloads', () => {
    const c = fs.readFileSync(layout, 'utf-8');
    expect(c).toContain('poppins-400.woff2');
    expect(c).toContain('poppins-700.woff2');
  });
});

// ── INV-1: no hardcoded business data ────────────────────────────────────────
describe('SPEC-SEO-001/INV-1 — no hardcoded business data', () => {
  it('[SPEC-SEO-001/INV-1] lib/seo.ts has no "SolidGraph" literal', () => {
    const c = fs.readFileSync(path.join(src, 'lib/seo.ts'), 'utf-8');
    expect(c).not.toContain('SolidGraph');
    expect(c).not.toContain('solidgraph.dev');
  });

  it('[SPEC-SEO-001/INV-1] lib/seo.ts takes SiteConfig parameter', () => {
    const c = fs.readFileSync(path.join(src, 'lib/seo.ts'), 'utf-8');
    expect(c).toContain('SiteConfig');
    expect(c).toContain('(site:');
  });
});

// ── INV-2: JSON-LD required fields present ────────────────────────────────────
describe('SPEC-SEO-001/INV-2 — JSON-LD required fields', () => {
  it('[SPEC-SEO-001/INV-2] buildLocalBusinessJsonLd output has all required LocalBusiness fields', () => {
    const ld = JSON.parse(buildLocalBusinessJsonLd(SiteConfigSchema.parse({
      name: 'Test Biz', url: 'https://example.com', logo: '/logo.png',
      locations: [{ city: 'Charlotte', region: 'NC' }],
      defaultSeo: { title: 'T', description: 'D' },
    })));
    expect(ld['@context']).toBeTruthy();
    expect(ld['@type']).toBeTruthy();
    expect(ld.name).toBeTruthy();
    expect(ld.url).toBeTruthy();
    expect(ld.logo).toBeTruthy();
    expect(ld.areaServed).toBeTruthy();
  });
});

// ── INV-3: SEO logic in lib/seo.ts ───────────────────────────────────────────
describe('SPEC-SEO-001/INV-3 — SEO logic centralised in lib/seo.ts', () => {
  it('[SPEC-SEO-001/INV-3] lib/seo.ts exists', () => {
    expect(fs.existsSync(path.join(src, 'lib/seo.ts'))).toBe(true);
  });

  it('[SPEC-SEO-001/INV-3] BaseLayout imports from lib/seo', () => {
    const c = fs.readFileSync(layout, 'utf-8');
    expect(c).toContain('lib/seo');
  });
});
