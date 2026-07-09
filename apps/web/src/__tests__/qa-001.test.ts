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
  // ── RF-4: compareWithDesign is the sole visual regression gate (ADR-0014) ───
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

    it('[SPEC-QA-001/RF-4] compareWithDesign is sole visual gate — no self-baselines (ADR-0014)', () => {
      // Self-baselines (toHaveScreenshot) retired: environment drift causes 1px false failures.
      // compareWithDesign (design HTML as reference) is the only visual regression mechanism.
      const sectionSpecs = [
        'nav', 'hero', 'marquee', 'pain-points', 'value', 'how-it-works', 'plans',
        'testimonials', 'portfolio', 'about', 'faq', 'cta', 'contact', 'footer',
      ];
      for (const s of sectionSpecs) {
        const src = fs.readFileSync(path.join(WEB_ROOT, `tests/visual/${s}.spec.ts`), 'utf-8');
        expect(src, `${s}.spec.ts should still have compareWithDesign`).toContain('compareWithDesign');
        // Check for actual call (parenthesis) to avoid false positives from doc comments.
        expect(src, `${s}.spec.ts must not call toHaveScreenshot (ADR-0014)`).not.toContain('toHaveScreenshot(');
      }
      // page.spec.ts has no compareWithDesign (full-page assembly, no section reference HTML)
      const pageSrc = fs.readFileSync(path.join(WEB_ROOT, 'tests/visual/page.spec.ts'), 'utf-8');
      expect(pageSrc, 'page.spec.ts must not call toHaveScreenshot (ADR-0014)').not.toContain('toHaveScreenshot(');
    });
  });

  // ── RF-5: CI pipeline includes visual gate as blocker ──────────────────────
  describe('[SPEC-QA-001/RF-5] drone pipeline includes visual-test step', () => {
    it('[SPEC-QA-001/RF-5] .drone.yml has a visual-test step', () => {
      const drone = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
      expect(drone).toContain('name: visual-test');
    });

    it('[SPEC-QA-001/RF-5] visual-test depends on install-glibc (order enforced after build-once)', () => {
      const drone = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
      const vtBlock = drone.slice(drone.indexOf('name: visual-test'));
      // build-once: visual-test depends on install-glibc (which depends on build → test).
      // build-push-web-dev/prod depend on visual-test, enforcing the gate-blocks-deploy invariant.
      expect(vtBlock).toContain('depends_on: [install-glibc]');
    });

    it('[SPEC-QA-001/RF-5] build-push-web-dev depends on visual-test (gate blocks deploy)', () => {
      const drone = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
      const idx = drone.indexOf('- name: build-push-web-dev');
      const pushDevBlock = drone.slice(idx, idx + 400);
      // build-push-web-dev must wait for all three gates (visual ∥ a11y ∥ perf).
      expect(pushDevBlock).toContain('visual-test');
      expect(pushDevBlock).toContain('a11y-test');
      expect(pushDevBlock.slice(0, 150)).toContain('depends_on');
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
