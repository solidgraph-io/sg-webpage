/**
 * SPEC-QA-001 — Visual Gate: unit-level assertions
 *
 * RF-1/RF-2/RF-3/INV-1/INV-2 are covered by the Playwright specs in
 * tests/visual/{nav,hero,marquee}.spec.ts. This file covers the remaining
 * requirements that are verifiable at unit level.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '../../../..');
const WEB_ROOT = path.resolve(__dirname, '../..');

describe('SPEC-QA-001 — visual gate', () => {
  // ── RF-4: baselines regenerated only after gate passes ─────────────────────
  describe('[SPEC-QA-001/RF-4] helpers expose compareWithDesign as the primary gate', () => {
    it('[SPEC-QA-001/RF-4] helpers.ts exports compareWithDesign', async () => {
      const helpersPath = path.join(WEB_ROOT, 'tests/visual/helpers.ts');
      const src = fs.readFileSync(helpersPath, 'utf-8');
      expect(src).toContain('export async function compareWithDesign');
    });

    it('[SPEC-QA-001/RF-4] compareWithDesign uses pixelmatch for diff calculation', () => {
      const helpersPath = path.join(WEB_ROOT, 'tests/visual/helpers.ts');
      const src = fs.readFileSync(helpersPath, 'utf-8');
      expect(src).toContain("import pixelmatch from 'pixelmatch'");
      expect(src).toContain('pixelmatch(');
    });

    it('[SPEC-QA-001/RF-4] anti-regression toHaveScreenshot only in tests that also run the gate', () => {
      const specs = ['nav', 'hero', 'marquee'].map((s) =>
        fs.readFileSync(path.join(WEB_ROOT, `tests/visual/${s}.spec.ts`), 'utf-8'),
      );
      for (const src of specs) {
        expect(src).toContain('compareWithDesign');
        expect(src).toContain('toHaveScreenshot');
      }
    });
  });

  // ── RF-5: CI pipeline includes visual gate as blocker ──────────────────────
  describe('[SPEC-QA-001/RF-5] drone pipeline includes visual-test step', () => {
    it('[SPEC-QA-001/RF-5] .drone.yml has a visual-test step', () => {
      const drone = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
      expect(drone).toContain('name: visual-test');
    });

    it('[SPEC-QA-001/RF-5] visual-test depends on test (order enforced)', () => {
      const drone = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
      const vtBlock = drone.slice(drone.indexOf('name: visual-test'));
      expect(vtBlock).toContain('depends_on: [test]');
    });

    it('[SPEC-QA-001/RF-5] build step depends on visual-test (blocks deploy)', () => {
      const drone = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
      const buildBlock = drone.slice(drone.indexOf('name: build'));
      // depends_on may include additional gates (a11y-test etc.) after visual-test
      expect(buildBlock).toContain('visual-test');
      expect(buildBlock.slice(0, 100)).toContain('depends_on');
    });
  });

  // ── RNF-1: thresholds catch gross errors without being fragile ─────────────
  describe('[SPEC-QA-001/RNF-1] pixelmatch thresholds', () => {
    it('[SPEC-QA-001/RNF-1] desktop threshold is 0.08 in helpers and specs', () => {
      const src = fs.readFileSync(path.join(WEB_ROOT, 'tests/visual/helpers.ts'), 'utf-8');
      // Default threshold
      expect(src).toContain('0.08');
    });

    it('[SPEC-QA-001/RNF-1] mobile threshold is ~0.10 in nav/hero/marquee specs', () => {
      const specs = ['nav', 'hero', 'marquee'].map((s) =>
        fs.readFileSync(path.join(WEB_ROOT, `tests/visual/${s}.spec.ts`), 'utf-8'),
      );
      for (const src of specs) {
        const match = /threshold:\s*([\d.]+)/.exec(src.split('threshold: 0.08')[1] ?? src);
        const value = match ? parseFloat(match[1] ?? '') : NaN;
        expect(value).toBeCloseTo(0.1, 1);
      }
    });
  });

  // ── RNF-2: report attaches design + impl + diff ────────────────────────────
  describe('[SPEC-QA-001/RNF-2] diff report attachments', () => {
    it('[SPEC-QA-001/RNF-2] compareWithDesign attaches 3 images (design, impl, diff)', () => {
      const src = fs.readFileSync(path.join(WEB_ROOT, 'tests/visual/helpers.ts'), 'utf-8');
      const attachCalls = (src.match(/testInfo\.attach\(/g) ?? []).length;
      expect(attachCalls).toBeGreaterThanOrEqual(3);
    });

    it('[SPEC-QA-001/RNF-2] attachments include ratio in the diff label', () => {
      const src = fs.readFileSync(path.join(WEB_ROOT, 'tests/visual/helpers.ts'), 'utf-8');
      expect(src).toContain('ratio=');
    });
  });

  // ── INV-1: section only Verified if diff < threshold (process check) ────────
  it('[SPEC-QA-001/INV-1] SPEC-SEC-001/002/003 specs are marked Verified or Implemented', () => {
    for (const id of ['SPEC-SEC-001', 'SPEC-SEC-002', 'SPEC-SEC-003']) {
      const specPath = path.join(ROOT, `docs/specs/${id}.md`);
      const content = fs.readFileSync(specPath, 'utf-8');
      const statusMatch = /(?:\*{0,2}Estado:\*{0,2}|Status:)\s*([A-Za-z]+)/i.exec(content);
      const status = statusMatch?.[1] ?? '';
      expect(['Verified', 'Implemented']).toContain(status);
    }
  });

  // ── INV-2: devToolbar disabled in astro config (prevents toolbar in shots) ──
  it('[SPEC-QA-001/INV-2] devToolbar is disabled in astro.config.ts', () => {
    const config = fs.readFileSync(path.join(WEB_ROOT, 'astro.config.ts'), 'utf-8');
    expect(config).toContain('devToolbar');
    expect(config).toContain('enabled: false');
  });
});
