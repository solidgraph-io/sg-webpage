/**
 * SPEC-SEC-011 — FAQ (<details> native disclosure)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const faqFile = path.join(WEB, 'src/components/Faq.astro');
const faqItem = path.join(WEB, 'src/components/FaqItem.astro');

// ── RF-1: Native <details> structure ─────────────────────────────────────
describe('SPEC-SEC-011/RF-1 — native details', () => {
  it('[SPEC-SEC-011/RF-1] FaqItem.astro exists', () => {
    expect(fs.existsSync(faqItem)).toBe(true);
  });

  it('[SPEC-SEC-011/RF-1] FaqItem renders <details class="faq-item">', () => {
    const c = fs.readFileSync(faqItem, 'utf-8');
    expect(c).toContain('details');
    expect(c).toContain('faq-item');
  });

  it('[SPEC-SEC-011/RF-1] FaqItem has <summary> with .plus', () => {
    const c = fs.readFileSync(faqItem, 'utf-8');
    expect(c).toContain('summary');
    expect(c).toContain('plus');
  });

  it('[SPEC-SEC-011/RF-1] FaqItem has .answer div', () => {
    expect(fs.readFileSync(faqItem, 'utf-8')).toContain('answer');
  });

  it('[SPEC-SEC-011/RF-1] Faq.astro exists', () => {
    expect(fs.existsSync(faqFile)).toBe(true);
  });

  it('[SPEC-SEC-011/RF-1] Faq has .faq-list with FaqItem', () => {
    const c = fs.readFileSync(faqFile, 'utf-8');
    expect(c).toContain('faq-list');
    expect(c).toContain('FaqItem');
  });
});

// ── RF-2: Content ─────────────────────────────────────────────────────────
describe('SPEC-SEC-011/RF-2 — content', () => {
  it('[SPEC-SEC-011/RF-2] Faq uses SectionHead', () => {
    expect(fs.readFileSync(faqFile, 'utf-8')).toContain('SectionHead');
  });

  it('[SPEC-SEC-011/RF-2] Faq has items prop with .map()', () => {
    const c = fs.readFileSync(faqFile, 'utf-8');
    expect(c).toContain('items');
    expect(c).toContain('.map(');
  });

  it('[SPEC-SEC-011/RF-2] no hardcoded questions in Faq.astro', () => {
    expect(fs.readFileSync(faqFile, 'utf-8')).not.toContain('Do I need any technical');
  });
});

// ── RF-3: No-JS, closed by default ───────────────────────────────────────
describe('SPEC-SEC-011/RF-3 — no JS', () => {
  it('[SPEC-SEC-011/RF-3] FaqItem has no <script> block', () => {
    const c = fs.readFileSync(faqItem, 'utf-8');
    expect(c).not.toContain('<script');
  });

  it('[SPEC-SEC-011/RF-3] FaqItem details has no open attribute by default', () => {
    const c = fs.readFileSync(faqItem, 'utf-8');
    expect(c).not.toMatch(/<details[^>]+open/);
  });
});

// ── RF-4: Typed props ─────────────────────────────────────────────────────
describe('SPEC-SEC-011/RF-4 — typed props', () => {
  it('[SPEC-SEC-011/RF-4] FaqItem has question and answer props', () => {
    const c = fs.readFileSync(faqItem, 'utf-8');
    expect(c).toContain('question');
    expect(c).toContain('answer');
  });

  it('[SPEC-SEC-011/RF-4] Faq items prop is array', () => {
    expect(fs.readFileSync(faqFile, 'utf-8')).toContain('items');
  });
});

// ── RNF-1: a11y ──────────────────────────────────────────────────────────
describe('SPEC-SEC-011/RNF-1 — a11y', () => {
  it('[SPEC-SEC-011/RNF-1] section has id="faq"', () => {
    expect(fs.readFileSync(faqFile, 'utf-8')).toContain('id="faq"');
  });
});

// ── RNF-3: responsive ────────────────────────────────────────────────────
describe('SPEC-SEC-011/RNF-3 — responsive', () => {
  it('[SPEC-SEC-011/RNF-3] Faq has 720px breakpoint', () => {
    expect(fs.readFileSync(faqFile, 'utf-8')).toContain('720px');
  });
});

// ── INV-1: SRP ───────────────────────────────────────────────────────────
describe('SPEC-SEC-011/INV-1 — SRP', () => {
  it('[SPEC-SEC-011/INV-1] Faq.astro ≤ 150 lines', () => {
    expect(fs.readFileSync(faqFile, 'utf-8').split('\n').length).toBeLessThanOrEqual(150);
  });

  it('[SPEC-SEC-011/INV-1] FaqItem.astro ≤ 80 lines', () => {
    expect(fs.readFileSync(faqItem, 'utf-8').split('\n').length).toBeLessThanOrEqual(80);
  });
});

// ── INV-2: tokens ────────────────────────────────────────────────────────
describe('SPEC-SEC-011/INV-2 — tokens', () => {
  it('[SPEC-SEC-011/INV-2] uses var(--lilac-2) for faq-item bg', () => {
    expect(fs.readFileSync(faqItem, 'utf-8')).toContain('var(--lilac-2)');
  });

  it('[SPEC-SEC-011/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('Faq');
  });
});
