/**
 * SPEC-CMS-001 — Sveltia CMS at /admin: structure, config, parity, no site impact
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { SiteConfigSchema, HomeSchema } from '../content/schemas';

const WEB_ROOT = path.resolve(__dirname, '../..');
const ADMIN_DIR = path.join(WEB_ROOT, 'public/admin');
const CONTENT_DIR = path.join(WEB_ROOT, 'src/content');

// ── RF-1: static admin at /admin ──────────────────────────────────────────────

describe('[SPEC-CMS-001/RF-1] /admin is a static admin page (no site impact)', () => {
  it('[SPEC-CMS-001/RF-1] public/admin/index.html exists', () => {
    expect(fs.existsSync(path.join(ADMIN_DIR, 'index.html'))).toBe(true);
  });

  it('[SPEC-CMS-001/RF-1] index.html loads Sveltia CMS from CDN', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'index.html'), 'utf-8');
    expect(src).toMatch(/@sveltia\/cms/);
  });

  it('[SPEC-CMS-001/RF-1] index.html has noindex meta (not indexed by search engines)', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'index.html'), 'utf-8');
    expect(src).toContain('noindex');
  });

  it('[SPEC-CMS-001/RF-1] index.html does NOT import site JS bundles', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'index.html'), 'utf-8');
    expect(src).not.toContain('interactions.js');
    expect(src).not.toContain('/_astro/');
  });
});

// ── RF-2: config → GitHub backend + collections ───────────────────────────────

describe('[SPEC-CMS-001/RF-2] config.yml maps GitHub backend + file collections', () => {
  it('[SPEC-CMS-001/RF-2] public/admin/config.yml exists', () => {
    expect(fs.existsSync(path.join(ADMIN_DIR, 'config.yml'))).toBe(true);
  });

  it('[SPEC-CMS-001/RF-2] backend is github', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: github');
  });

  it('[SPEC-CMS-001/RF-2] backend repo is solidgraph-io/sg-webpage', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('solidgraph-io/sg-webpage');
  });

  it('[SPEC-CMS-001/RF-2] backend branch is main', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('branch: main');
  });

  it('[SPEC-CMS-001/RF-2] media_folder is defined', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('media_folder');
  });

  it('[SPEC-CMS-001/RF-2] collections include site settings file', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('settings/site.yaml');
  });

  it('[SPEC-CMS-001/RF-2] collections include home page file', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('pages/home.yaml');
  });
});

// ── RF-3: field parity with Zod schemas ──────────────────────────────────────

describe('[SPEC-CMS-001/RF-3] config.yml fields reflect SiteConfig and HomeData schemas', () => {
  it('[SPEC-CMS-001/RF-3] SiteConfig key "name" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: name');
  });

  it('[SPEC-CMS-001/RF-3] SiteConfig key "url" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: url');
  });

  it('[SPEC-CMS-001/RF-3] SiteConfig key "defaultSeo" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: defaultSeo');
  });

  it('[SPEC-CMS-001/RF-3] SiteConfig key "locations" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: locations');
  });

  it('[SPEC-CMS-001/RF-3] HomeData top-level section "nav" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: nav');
  });

  it('[SPEC-CMS-001/RF-3] HomeData top-level section "hero" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: hero');
  });

  it('[SPEC-CMS-001/RF-3] HomeData top-level section "plans" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: plans');
  });

  it('[SPEC-CMS-001/RF-3] HomeData top-level section "testimonials" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: testimonials');
  });

  it('[SPEC-CMS-001/RF-3] HomeData top-level section "portfolio" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: portfolio');
  });

  it('[SPEC-CMS-001/RF-3] HomeData top-level section "faq" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: faq');
  });

  it('[SPEC-CMS-001/RF-3] HomeData top-level section "footer" appears in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: footer');
  });
});

// ── RF-4: git-based flow (config proves commits target the right branch/repo) ──

describe('[SPEC-CMS-001/RF-4] saving in Sveltia commits to the git repo (git-based flow)', () => {
  it('[SPEC-CMS-001/RF-4] config.yml backend targets branch main (commits land on main)', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('branch: main');
  });

  it('[SPEC-CMS-001/RF-4] config.yml backend targets the correct repo (commits go to sg-webpage)', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('solidgraph-io/sg-webpage');
  });

  it('[SPEC-CMS-001/RF-4] config.yml uses github backend (git API for commits)', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('name: github');
  });
});

// ── RF-5: local_backend for dev without OAuth ─────────────────────────────────

describe('[SPEC-CMS-001/RF-5] local_backend enables dev without OAuth', () => {
  it('[SPEC-CMS-001/RF-5] config.yml has local_backend: true', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('local_backend: true');
  });
});

// ── RF-6: OAuth relay documented/parametrized (no secrets in repo) ────────────

describe('[SPEC-CMS-001/RF-6] production auth is parametrized, no secrets in repo', () => {
  it('[SPEC-CMS-001/RF-6] config.yml has base_url placeholder for OAuth relay', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).toContain('base_url');
  });

  it('[SPEC-CMS-001/RF-6] no client_secret in config.yml', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
    expect(src).not.toMatch(/client_secret\s*:/);
  });

  it('[SPEC-CMS-001/RF-6] no hardcoded OAuth credentials in index.html', () => {
    const src = fs.readFileSync(path.join(ADMIN_DIR, 'index.html'), 'utf-8');
    expect(src).not.toMatch(/client_secret|access_token/);
  });
});

// ── RNF-1: /admin does not impact site render or bundle ───────────────────────

describe('[SPEC-CMS-001/RNF-1] /admin is isolated — no site impact', () => {
  it('[SPEC-CMS-001/RNF-1] index.astro does not reference /admin/', () => {
    const src = fs.readFileSync(path.join(WEB_ROOT, 'src/pages/index.astro'), 'utf-8');
    expect(src).not.toContain('/admin/');
  });

  it('[SPEC-CMS-001/RNF-1] BaseLayout does not load Sveltia', () => {
    const src = fs.readFileSync(path.join(WEB_ROOT, 'src/layouts/BaseLayout.astro'), 'utf-8');
    expect(src).not.toContain('sveltia');
  });

  it('[SPEC-CMS-001/RNF-1] no Astro page route for /admin (it is static from public/)', () => {
    const pagesDir = path.join(WEB_ROOT, 'src/pages');
    const entries = fs.readdirSync(pagesDir, { recursive: true }) as string[];
    const adminPage = entries.find((e) => e.startsWith('admin'));
    expect(adminPage).toBeUndefined();
  });
});

// ── RNF-2: no secrets in repo ─────────────────────────────────────────────────

it('[SPEC-CMS-001/RNF-2] no client_secret or access_token committed in admin files', () => {
  const configSrc = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
  expect(configSrc).not.toMatch(/client_secret|access_token/);
});

// ── RNF-3: a11y is Sveltia's own — not part of site audit ────────────────────

describe('[SPEC-CMS-001/RNF-3] /admin a11y is Sveltia-native; excluded from site audit', () => {
  it('[SPEC-CMS-001/RNF-3] site a11y test does not audit /admin', () => {
    const a11yTestPath = path.join(WEB_ROOT, 'tests/a11y/page-a11y.spec.ts');
    if (!fs.existsSync(a11yTestPath)) return;
    const src = fs.readFileSync(a11yTestPath, 'utf-8');
    expect(src).not.toContain("'/admin'");
    expect(src).not.toContain('"/admin"');
  });

  it('[SPEC-CMS-001/RNF-3] /admin is not listed in any site page url list for axe testing', () => {
    const testDir = path.join(WEB_ROOT, 'tests');
    if (!fs.existsSync(testDir)) return;
    const files = fs.readdirSync(testDir, { recursive: true }) as string[];
    const axeFiles = files.filter((f) => f.endsWith('.spec.ts') || f.endsWith('.test.ts'));
    for (const file of axeFiles) {
      const content = fs.readFileSync(path.join(testDir, file), 'utf-8');
      // /admin routes must not appear as a URL target in site tests
      expect(content).not.toMatch(/goto.*['"`]\/admin['"`]/);
    }
  });
});

// ── INV-1: content still validates against Zod schemas ───────────────────────

describe('[SPEC-CMS-001/INV-1] existing YAML content still validates against Zod schemas', () => {
  it('[SPEC-CMS-001/INV-1] settings/site.yaml parses with SiteConfigSchema', () => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, 'settings/site.yaml'), 'utf-8');
    const data = yaml.parse(raw);
    expect(() => SiteConfigSchema.parse(data)).not.toThrow();
  });

  it('[SPEC-CMS-001/INV-1] pages/home.yaml parses with HomeSchema', () => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, 'pages/home.yaml'), 'utf-8');
    const data = yaml.parse(raw);
    expect(() => HomeSchema.parse(data)).not.toThrow();
  });
});

// ── INV-2: config.yml parity — all HomeSchema top-level keys present ──────────

describe('[SPEC-CMS-001/INV-2] config.yml covers all HomeSchema top-level sections', () => {
  const HOME_SECTIONS = [
    'nav', 'hero', 'marquee', 'painPoints', 'value', 'howItWorks',
    'plans', 'testimonials', 'portfolio', 'about', 'faq',
    'ctaStrip', 'contact', 'footer',
  ] as const;

  for (const section of HOME_SECTIONS) {
    it(`[SPEC-CMS-001/INV-2] config.yml has field entry for HomeData.${section}`, () => {
      const src = fs.readFileSync(path.join(ADMIN_DIR, 'config.yml'), 'utf-8');
      expect(src).toContain(`name: ${section}`);
    });
  }
});

// ── INV-3: /admin does not impact the site bundle ────────────────────────────

describe('[SPEC-CMS-001/INV-3] admin does not affect site bundle (if dist/ exists)', () => {
  it('[SPEC-CMS-001/INV-3] dist/client does not contain sveltia JS', () => {
    const clientDir = path.join(WEB_ROOT, 'dist/client');
    if (!fs.existsSync(clientDir)) return;
    const files = fs.readdirSync(clientDir, { recursive: true }) as string[];
    const sveltiaFile = files.find((f) => f.includes('sveltia'));
    expect(sveltiaFile).toBeUndefined();
  });

  it('[SPEC-CMS-001/INV-3] dist/client/admin/ is not Astro-generated (served from public/)', () => {
    const clientDir = path.join(WEB_ROOT, 'dist/client');
    if (!fs.existsSync(clientDir)) return;
    const adminPath = path.join(clientDir, 'admin/index.html');
    if (!fs.existsSync(adminPath)) return; // not copied yet — just static
    const content = fs.readFileSync(adminPath, 'utf-8');
    // Astro-generated pages have astro:scripts; the admin page must NOT
    expect(content).not.toContain('astro:scripts');
  });
});
