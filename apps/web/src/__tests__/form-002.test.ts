/**
 * SPEC-FORM-002 — form UX: real-time validation + state machine + confirmation card
 * Static checks (markup, mirror rules, SRP); behavior is covered by tests/e2e/form-ux.spec.ts.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const WEB = path.resolve(import.meta.dirname, '../..');

const read = (rel: string): string => fs.readFileSync(path.join(WEB, rel), 'utf-8');

const CONTACT = 'src/components/Contact/Contact.astro';
const CARD = 'src/components/ConfirmCard.astro';
const VALIDATE = 'src/scripts/contact-form/validate.ts';
const STATE = 'src/scripts/contact-form/state.ts';
const ENTRY = 'src/scripts/contact-form/index.ts';

// ── RF-5: autocomplete tokens ─────────────────────────────────────────────────

describe('[SPEC-FORM-002/RF-5] identity fields carry autocomplete tokens', () => {
  const tokens: [string, string][] = [
    ['first_name', 'given-name'],
    ['last_name', 'family-name'],
    ['email', 'email'],
    ['phone', 'tel'],
    ['business_name', 'organization'],
    ['city', 'address-level2'],
  ];

  for (const [field, token] of tokens) {
    it(`[SPEC-FORM-002/RF-5] ${field} → autocomplete="${token}"`, () => {
      const src = read(CONTACT);
      const fieldTag = new RegExp(`<(input|select)[^>]*id="${field}"[^>]*>`).exec(src)?.[0];
      expect(fieldTag, `field ${field} not found`).toBeDefined();
      expect(fieldTag).toContain(`autocomplete="${token}"`);
    });
  }

  it('[SPEC-FORM-002/INV-3] no autocomplete on plan_interest / message; honeypot keeps off', () => {
    const src = read(CONTACT);
    const plan = /<select[^>]*id="plan_interest"[^>]*>/.exec(src)?.[0] ?? '';
    const message = /<textarea[^>]*id="message"[^>]*>/.exec(src)?.[0] ?? '';
    const gotcha = /<input[^>]*id="_gotcha"[^>]*>/.exec(src)?.[0] ?? '';
    expect(plan).not.toContain('autocomplete');
    expect(message).not.toContain('autocomplete');
    expect(gotcha).toContain('autocomplete="off"');
  });
});

// ── RF-4: confirmation card ───────────────────────────────────────────────────

describe('[SPEC-FORM-002/RF-4] confirmation card replaces the banner+inert pattern', () => {
  it('[SPEC-FORM-002/RF-4] ConfirmCard has status role, aria-live and focus target', () => {
    const src = read(CARD);
    expect(src).toContain('role="status"');
    expect(src).toContain('aria-live="polite"');
    expect(src).toContain('tabindex="-1"');
  });

  it('[SPEC-FORM-002/RF-4] ConfirmCard uses the check icon from icons.svg', () => {
    expect(read(CARD)).toContain('icons.svg#i-check');
    expect(read('public/icons.svg')).toContain('id="i-check"');
  });

  it('[SPEC-FORM-002/RF-4] card copy comes from props, not hardcoded (SPEC-CONTENT-001)', () => {
    const card = read(CARD);
    expect(card).toContain('{title}');
    expect(card).toContain('{message}');
    const contact = read(CONTACT);
    expect(contact).toContain('confirmTitle');
    expect(contact).toContain('successMsg');
  });

  it('[SPEC-FORM-002/RF-4] contact schema exposes optional confirmation copy (SPEC-CONTENT-001)', () => {
    const schema = read('src/content/schemas.ts');
    expect(schema).toContain('confirmTitle');
  });

  it('[SPEC-FORM-002/RF-4] the old JS banner+inert success pattern is gone', () => {
    expect(read(ENTRY)).not.toContain('inert');
    expect(read(STATE)).not.toContain('inert');
  });
});

// ── RNF-4: fidelity — default (idle) render unchanged ─────────────────────────

describe('[SPEC-FORM-002/RNF-4] idle state renders exactly as before (QA-001 stays green)', () => {
  it('[SPEC-FORM-002/RNF-4] card markup is hidden by default', () => {
    const tag = /<div[^>]*class="confirm-card"[^>]*>/.exec(read(CARD))?.[0] ?? '';
    expect(tag).toContain('hidden');
  });

  it('[SPEC-FORM-002/RNF-4] new styles use design tokens (var(--…)), no raw hex beyond existing', () => {
    expect(read(CARD)).toContain('var(--');
  });
});

// ── RF-1 / INV-1: client rules mirror the server Zod schema ──────────────────

describe('[SPEC-FORM-002/RF-1][SPEC-FORM-002/INV-1] client validation mirrors LeadSchema', () => {
  it('[SPEC-FORM-002/INV-1] messages match the server Zod messages verbatim', () => {
    const validate = read(VALIDATE);
    const schema = read('src/lib/lead-schema.ts');
    for (const msg of [
      'First name is required',
      'Last name is required',
      'Valid email required',
      'Business name is required',
      'City is required',
    ]) {
      expect(schema).toContain(msg);
      expect(validate).toContain(msg);
    }
  });

  it('[SPEC-FORM-002/RF-1] uses native constraint validation (validity), own messages', () => {
    const validate = read(VALIDATE);
    expect(validate).toContain('validity');
    expect(validate).not.toContain('validationMessage'); // browser copy is not used
  });

  it('[SPEC-FORM-002/INV-1] client does not import zod (server re-validates; island stays light)', () => {
    expect(read(VALIDATE)).not.toContain("from 'zod'");
    expect(read(ENTRY)).not.toContain("from 'zod'");
  });
});

// ── RF-2: accessible errors ───────────────────────────────────────────────────

describe('[SPEC-FORM-002/RF-2] field errors are announced via aria', () => {
  it('[SPEC-FORM-002/RF-2] validate module sets aria-invalid + aria-describedby → #<id>_err', () => {
    const validate = read(VALIDATE);
    expect(validate).toContain('aria-invalid');
    expect(validate).toContain('aria-describedby');
    expect(validate).toContain('_err');
  });
});

// ── RF-3 / RF-6: state machine + submit gating ────────────────────────────────

describe('[SPEC-FORM-002/RF-3] vanilla state machine idle|submitting|success|error', () => {
  it('[SPEC-FORM-002/RF-3] state module declares the four states', () => {
    const state = read(STATE);
    for (const s of ["'idle'", "'submitting'", "'success'", "'error'"]) {
      expect(state).toContain(s);
    }
  });

  it('[SPEC-FORM-002/RF-6] submitting disables the button (anti double-submit)', () => {
    expect(read(STATE)).toContain('disabled');
  });

  it('[SPEC-FORM-002/RF-3] submitting label comes from markup data, not hardcoded in JS', () => {
    expect(read(CONTACT)).toContain('data-submitting-label');
    expect(read(STATE)).toContain('submitting-label');
    expect(read(STATE)).not.toContain("'Sending");
  });

  it('[SPEC-FORM-002/RF-3] entry keeps fetch to /api/lead (server stays source of truth)', () => {
    const entry = read(ENTRY);
    expect(entry).toContain("addEventListener('submit'");
    expect(entry).toContain('/api/lead');
  });
});

// ── RNF-1: progressive enhancement intact ────────────────────────────────────

describe('[SPEC-FORM-002/RNF-1] no-JS path untouched', () => {
  it('[SPEC-FORM-002/RNF-1] form keeps action/method for the server fallback', () => {
    const src = read(CONTACT);
    expect(src).toContain('action={formAction}');
    expect(src).toContain('method="post"');
  });

  it('[SPEC-FORM-002/RNF-1] novalidate is applied by JS, not baked into the markup', () => {
    expect(read(CONTACT)).not.toContain('novalidate');
    expect(read(ENTRY)).toContain('noValidate');
  });

  it('[SPEC-FORM-002/RNF-1] server-rendered success banner (contactState) still exists', () => {
    expect(read(CONTACT)).toContain("contactState === 'success'");
  });
});

// ── RNF-3: perf — no new dependencies ─────────────────────────────────────────

describe('[SPEC-FORM-002/RNF-3] island stays dependency-free', () => {
  it('[SPEC-FORM-002/RNF-3] contact-form modules only use relative imports', () => {
    for (const rel of [VALIDATE, STATE, ENTRY]) {
      const bare = /from\s+['"](?![.\/])/.exec(read(rel));
      expect(bare, `${rel} imports a bare module`).toBeNull();
    }
  });
});

// ── INV-2: SRP — small, separate pieces ───────────────────────────────────────

describe('[SPEC-FORM-002/INV-2] validation, state and wiring live in separate small files', () => {
  for (const rel of [VALIDATE, STATE, ENTRY]) {
    it(`[SPEC-FORM-002/INV-2] ${rel} exists and stays ≤ 150 lines`, () => {
      expect(fs.existsSync(path.join(WEB, rel)), `${rel} missing`).toBe(true);
      expect(read(rel).split('\n').length).toBeLessThanOrEqual(150);
    });
  }

  it('[SPEC-FORM-002/INV-2] the old monolithic contact-form.ts is gone', () => {
    expect(fs.existsSync(path.join(WEB, 'src/scripts/contact-form.ts'))).toBe(false);
  });
});
