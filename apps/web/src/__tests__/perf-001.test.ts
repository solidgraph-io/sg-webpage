/**
 * SPEC-PERF-001 — Performance: Lighthouse CI + images + fonts + JS budget
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../../..');
const WEB_ROOT = path.resolve(__dirname, '../..');

describe('SPEC-PERF-001 — Performance gate', () => {
  // ── RF-1: Lighthouse CI config ──────────────────────────────────────────────

  describe('[SPEC-PERF-001/RF-1] Lighthouse CI config exists with budgets', () => {
    it('[SPEC-PERF-001/RF-1] .lighthouserc.js exists at repo root', () => {
      expect(fs.existsSync(path.join(ROOT, '.lighthouserc.js'))).toBe(true);
    });

    it('[SPEC-PERF-001/RF-1] config has LCP budget', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cfg = require(path.join(ROOT, '.lighthouserc.js')) as {
        ci?: { assert?: { assertions?: Record<string, unknown> } };
      };
      const a = cfg.ci?.assert?.assertions ?? {};
      expect(a['largest-contentful-paint']).toBeDefined();
    });

    it('[SPEC-PERF-001/RF-1] config has CLS budget', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cfg = require(path.join(ROOT, '.lighthouserc.js')) as {
        ci?: { assert?: { assertions?: Record<string, unknown> } };
      };
      const a = cfg.ci?.assert?.assertions ?? {};
      expect(a['cumulative-layout-shift']).toBeDefined();
    });

    it('[SPEC-PERF-001/RF-1] config has TBT budget', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cfg = require(path.join(ROOT, '.lighthouserc.js')) as {
        ci?: { assert?: { assertions?: Record<string, unknown> } };
      };
      const a = cfg.ci?.assert?.assertions ?? {};
      expect(a['total-blocking-time']).toBeDefined();
    });

    it('[SPEC-PERF-001/RF-1] LCP budget is realistic (≤ 4000 ms)', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cfg = require(path.join(ROOT, '.lighthouserc.js')) as {
        ci?: { assert?: { assertions?: Record<string, [string, { maxNumericValue: number }]> } };
      };
      const entry = cfg.ci?.assert?.assertions?.['largest-contentful-paint'];
      const budget = Array.isArray(entry) ? entry[1]?.maxNumericValue : undefined;
      expect(typeof budget).toBe('number');
      expect(budget).toBeLessThanOrEqual(4000);
    });

    it('[SPEC-PERF-001/RF-1] CLS budget is ≤ 0.1', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cfg = require(path.join(ROOT, '.lighthouserc.js')) as {
        ci?: { assert?: { assertions?: Record<string, [string, { maxNumericValue: number }]> } };
      };
      const entry = cfg.ci?.assert?.assertions?.['cumulative-layout-shift'];
      const budget = Array.isArray(entry) ? entry[1]?.maxNumericValue : undefined;
      expect(typeof budget).toBe('number');
      expect(budget).toBeLessThanOrEqual(0.1);
    });
  });

  // ── RF-2: raster images via astro:assets ────────────────────────────────────

  describe('[SPEC-PERF-001/RF-2] raster images use astro:assets', () => {
    it('[SPEC-PERF-001/RF-2] src/assets/ directory has PNG images', () => {
      const assetsDir = path.join(WEB_ROOT, 'src/assets');
      expect(fs.existsSync(assetsDir)).toBe(true);
      const files = fs.readdirSync(assetsDir);
      expect(files.some((f) => f.endsWith('.png'))).toBe(true);
    });

    it('[SPEC-PERF-001/RF-2] Logo.astro imports from astro:assets', () => {
      const src = fs.readFileSync(path.join(WEB_ROOT, 'src/components/Logo.astro'), 'utf-8');
      expect(src).toContain('astro:assets');
      expect(src).toContain('<Image');
    });

    it('[SPEC-PERF-001/RF-2] About.astro imports from astro:assets', () => {
      const src = fs.readFileSync(path.join(WEB_ROOT, 'src/components/About.astro'), 'utf-8');
      expect(src).toContain('astro:assets');
      expect(src).toContain('<Image');
    });

    it('[SPEC-PERF-001/RF-2] Footer.astro imports from astro:assets', () => {
      const src = fs.readFileSync(path.join(WEB_ROOT, 'src/components/Footer.astro'), 'utf-8');
      expect(src).toContain('astro:assets');
      expect(src).toContain('<Image');
    });

    it('[SPEC-PERF-001/RF-2] About logo image has empty alt (decorative)', () => {
      const src = fs.readFileSync(path.join(WEB_ROOT, 'src/components/About.astro'), 'utf-8');
      // Decorative image should have alt="" (not missing alt)
      expect(src).toMatch(/alt=""/);
    });
  });

  // ── RF-3: self-hosted font preloads ─────────────────────────────────────────

  describe('[SPEC-PERF-001/RF-3] fonts are self-hosted with preload', () => {
    it('[SPEC-PERF-001/RF-3] BaseLayout has Poppins 400 preload', () => {
      const src = fs.readFileSync(
        path.join(WEB_ROOT, 'src/layouts/BaseLayout.astro'),
        'utf-8',
      );
      expect(src).toContain('poppins-400.woff2');
      expect(src).toContain('rel="preload"');
    });

    it('[SPEC-PERF-001/RF-3] no Google Fonts CDN in source styles', () => {
      const globalCss = fs.readFileSync(
        path.join(WEB_ROOT, 'src/styles/global.css'),
        'utf-8',
      );
      expect(globalCss).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    });

    it('[SPEC-PERF-001/RF-3] woff2 files exist in public/fonts/', () => {
      const fontsDir = path.join(WEB_ROOT, 'public/fonts');
      expect(fs.existsSync(fontsDir)).toBe(true);
      const files = fs.readdirSync(fontsDir);
      expect(files.some((f) => f.includes('poppins') && f.endsWith('.woff2'))).toBe(true);
    });
  });

  // ── RF-4: JS client budget ───────────────────────────────────────────────────

  describe('[SPEC-PERF-001/RF-4] JS client budget', () => {
    it('[SPEC-PERF-001/RF-4] interactions.js exists in public/', () => {
      const js = path.join(WEB_ROOT, 'public/interactions.js');
      expect(fs.existsSync(js)).toBe(true);
    });

    it('[SPEC-PERF-001/RF-4] interactions.js is ≤ 10 KB raw', () => {
      const js = path.join(WEB_ROOT, 'public/interactions.js');
      const bytes = fs.statSync(js).size;
      expect(bytes).toBeLessThanOrEqual(10 * 1024);
    });

    it('[SPEC-PERF-001/RF-4] no client island directives in index.astro', () => {
      const src = fs.readFileSync(path.join(WEB_ROOT, 'src/pages/index.astro'), 'utf-8');
      expect(src).not.toMatch(/client:(load|visible|idle|media|only)/);
    });
  });

  // ── RF-5: CSS budget ─────────────────────────────────────────────────────────

  describe('[SPEC-PERF-001/RF-5] CSS budget', () => {
    it('[SPEC-PERF-001/RF-5] no CDN CSS links in BaseLayout', () => {
      const src = fs.readFileSync(
        path.join(WEB_ROOT, 'src/layouts/BaseLayout.astro'),
        'utf-8',
      );
      expect(src).not.toMatch(/cdn\.\S+\.css|googleapis\.com\/css/);
    });

    it('[SPEC-PERF-001/RF-5] built CSS bundle is ≤ 100 KB (if dist/ exists)', () => {
      const astroDir = path.join(WEB_ROOT, 'dist/client/_astro');
      if (!fs.existsSync(astroDir)) return; // skip if not yet built
      const cssFiles = fs.readdirSync(astroDir).filter((f) => f.endsWith('.css'));
      const totalSize = cssFiles.reduce(
        (sum, f) => sum + fs.statSync(path.join(astroDir, f)).size,
        0,
      );
      expect(totalSize).toBeLessThanOrEqual(100 * 1024);
    });
  });

  // ── INV-1: Lighthouse gate is blocking in CI ────────────────────────────────

  describe('[SPEC-PERF-001/INV-1] Lighthouse gate blocks CI', () => {
    it('[SPEC-PERF-001/INV-1] .drone.yml has perf-test step with lhci', () => {
      const drone = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
      expect(drone).toMatch(/perf-test|lhci|lighthouse/i);
    });

    it('[SPEC-PERF-001/INV-1] perf-test step depends on build (blocks deploy)', () => {
      const drone = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
      const perfIdx = drone.search(/name:\s*perf-test/);
      expect(perfIdx).toBeGreaterThan(-1);
      const perfBlock = drone.slice(perfIdx, perfIdx + 300);
      expect(perfBlock).toContain('depends_on');
    });
  });

  // ── INV-2: no heavy client islands ──────────────────────────────────────────

  describe('[SPEC-PERF-001/INV-2] no framework JS islands', () => {
    it('[SPEC-PERF-001/INV-2] no client: directives in component sources', () => {
      const componentDir = path.join(WEB_ROOT, 'src/components');
      const files = fs.readdirSync(componentDir, { recursive: true }) as string[];
      const astroFiles = files.filter((f) => f.endsWith('.astro'));
      for (const file of astroFiles) {
        const src = fs.readFileSync(path.join(componentDir, file), 'utf-8');
        expect(
          src,
          `${file} has unexpected client island directive`,
        ).not.toMatch(/client:(load|visible|idle|media|only)/);
      }
    });

    it('[SPEC-PERF-001/INV-2] no framework JS chunks in _astro/ (if dist/ exists)', () => {
      const astroDir = path.join(WEB_ROOT, 'dist/client/_astro');
      if (!fs.existsSync(astroDir)) return;
      const jsFiles = fs.readdirSync(astroDir).filter((f) => f.endsWith('.js'));
      expect(jsFiles).toHaveLength(0);
    });
  });

  // ── INV-3: SRP — perf config in dedicated file ──────────────────────────────

  it('[SPEC-PERF-001/INV-3] .lighthouserc.js is dedicated config at repo root', () => {
    expect(fs.existsSync(path.join(ROOT, '.lighthouserc.js'))).toBe(true);
  });
});
