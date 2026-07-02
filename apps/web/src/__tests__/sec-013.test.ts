/**
 * SPEC-SEC-013 — Contact (form UI; submission wired in EPIC-06)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const contactFile = path.join(WEB, 'src/components/Contact.astro');
const formField = path.join(WEB, 'src/components/FormField.astro');

// ── RF-1: FormField molecule ──────────────────────────────────────────────
describe('SPEC-SEC-013/RF-1 — FormField molecule', () => {
  it('[SPEC-SEC-013/RF-1] FormField.astro exists', () => {
    expect(fs.existsSync(formField)).toBe(true);
  });

  it('[SPEC-SEC-013/RF-1] FormField has .field wrapper', () => {
    expect(fs.readFileSync(formField, 'utf-8')).toContain('field');
  });

  it('[SPEC-SEC-013/RF-1] FormField has accessible label with for attribute', () => {
    const c = fs.readFileSync(formField, 'utf-8');
    expect(c).toContain('for=');
    expect(c).toContain('label');
  });

  it('[SPEC-SEC-013/RF-1] FormField supports .full class', () => {
    expect(fs.readFileSync(formField, 'utf-8')).toContain('full');
  });

  it('[SPEC-SEC-013/RF-1] FormField has required (.req) indicator', () => {
    expect(fs.readFileSync(formField, 'utf-8')).toContain('req');
  });
});

// ── RF-2: Contact section structure ──────────────────────────────────────
describe('SPEC-SEC-013/RF-2 — Contact structure', () => {
  it('[SPEC-SEC-013/RF-2] Contact.astro exists', () => {
    expect(fs.existsSync(contactFile)).toBe(true);
  });

  it('[SPEC-SEC-013/RF-2] has .contact-grid two columns', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).toContain('contact-grid');
  });

  it('[SPEC-SEC-013/RF-2] has .contact-left with eyebrow', () => {
    const c = fs.readFileSync(contactFile, 'utf-8');
    expect(c).toContain('contact-left');
    expect(c).toContain('Eyebrow');
  });

  it('[SPEC-SEC-013/RF-2] has .contact-alt lilac card', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).toContain('contact-alt');
  });

  it('[SPEC-SEC-013/RF-2] has .contact-form', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).toContain('contact-form');
  });

  it('[SPEC-SEC-013/RF-2] uses FormField', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).toContain('FormField');
  });
});

// ── RF-3: Form fields ─────────────────────────────────────────────────────
describe('SPEC-SEC-013/RF-3 — Form fields', () => {
  it('[SPEC-SEC-013/RF-3] has .field-grid', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).toContain('field-grid');
  });

  it('[SPEC-SEC-013/RF-3] has textarea for message', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).toContain('textarea');
  });

  it('[SPEC-SEC-013/RF-3] has city and plan select fields', () => {
    const c = fs.readFileSync(contactFile, 'utf-8');
    expect(c).toContain('select');
    expect(c).toContain('city');
  });

  it('[SPEC-SEC-013/RF-3] success-msg is rendered but hidden by default', () => {
    const c = fs.readFileSync(contactFile, 'utf-8');
    expect(c).toContain('success-msg');
    expect(c).not.toContain('success-msg show');
  });

  it('[SPEC-SEC-013/RF-3] no onsubmit JS handler (EPIC-06 territory)', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).not.toContain('onsubmit');
  });
});

// ── RF-4: Typed props ─────────────────────────────────────────────────────
describe('SPEC-SEC-013/RF-4 — typed props', () => {
  it('[SPEC-SEC-013/RF-4] no hardcoded heading in Contact.astro', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).not.toContain("Let's Talk About");
  });

  it('[SPEC-SEC-013/RF-4] altRows as typed prop', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).toContain('altRows');
  });
});

// ── RNF-1: a11y ──────────────────────────────────────────────────────────
describe('SPEC-SEC-013/RNF-1 — a11y', () => {
  it('[SPEC-SEC-013/RNF-1] section has id="contact"', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).toContain('id="contact"');
  });

  it('[SPEC-SEC-013/RNF-1] submit button is type="submit"', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).toContain('type="submit"');
  });
});

// ── RNF-3: responsive ────────────────────────────────────────────────────
describe('SPEC-SEC-013/RNF-3 — responsive', () => {
  it('[SPEC-SEC-013/RNF-3] has 880px breakpoint', () => {
    expect(fs.readFileSync(contactFile, 'utf-8')).toContain('880px');
  });
});

// ── INV-1: SRP ───────────────────────────────────────────────────────────
describe('SPEC-SEC-013/INV-1 — SRP', () => {
  it('[SPEC-SEC-013/INV-1] Contact.astro ≤ 160 lines', () => {
    expect(fs.readFileSync(contactFile, 'utf-8').split('\n').length).toBeLessThanOrEqual(160);
  });

  it('[SPEC-SEC-013/INV-1] FormField.astro ≤ 50 lines', () => {
    expect(fs.readFileSync(formField, 'utf-8').split('\n').length).toBeLessThanOrEqual(50);
  });
});

// ── INV-2: composed ──────────────────────────────────────────────────────
describe('SPEC-SEC-013/INV-2 — composed', () => {
  it('[SPEC-SEC-013/INV-2] composed in index.astro', () => {
    const idx = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(idx).toContain('Contact');
  });
});
