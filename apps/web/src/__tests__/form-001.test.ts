/**
 * SPEC-FORM-001 — /api/lead endpoint, LeadPort, anti-spam, progressive enhancement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const WEB = path.resolve(import.meta.dirname, '../..');

// ── Imports under test (will be RED until files exist) ────────────────────────

import { LeadSchema } from '../lib/lead-schema';
import type { LeadPort, LeadPayload } from '../lib/lead-port';
import { handleLead, resetRateLimitForTesting } from '../pages/api/lead';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeJsonRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Request {
  return new Request('http://localhost/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function makeFormRequest(data: Record<string, string>, ip = '10.0.0.99'): Request {
  const form = new URLSearchParams(data);
  return new Request('http://localhost/api/lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html',
      'x-forwarded-for': ip,
    },
    body: form.toString(),
  });
}

function omit<T extends Record<string, unknown>>(obj: T, key: keyof T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));
}

const VALID_LEAD: Record<string, string> = {
  first_name: 'Alice',
  last_name: 'Smith',
  email: 'alice@example.com',
  business_name: 'Acme LLC',
  city: 'Charlotte, NC',
  message: 'Hello there',
};

// ── RF-1: endpoint validates payload ─────────────────────────────────────────

describe('[SPEC-FORM-001/RF-1] POST /api/lead validates payload with Zod', () => {
  beforeEach(() => resetRateLimitForTesting());

  it('[SPEC-FORM-001/RF-1] valid payload + mock port → 200 JSON ok:true', async () => {
    const port: LeadPort = { deliver: vi.fn().mockResolvedValue(undefined) };
    const res = await handleLead(makeJsonRequest(VALID_LEAD), port);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('[SPEC-FORM-001/RF-1] missing email → 400 with field error', async () => {
    const port: LeadPort = { deliver: vi.fn() };
    const res = await handleLead(makeJsonRequest(omit(VALID_LEAD, 'email')), port);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors).toBeDefined();
    expect(body.errors.email).toBeDefined();
  });

  it('[SPEC-FORM-001/RF-1] invalid email format → 400 with email error', async () => {
    const port: LeadPort = { deliver: vi.fn() };
    const res = await handleLead(makeJsonRequest({ ...VALID_LEAD, email: 'not-an-email' }), port);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors.email).toBeDefined();
  });

  it('[SPEC-FORM-001/RF-1] missing first_name → 400 with first_name error', async () => {
    const port: LeadPort = { deliver: vi.fn() };
    const res = await handleLead(makeJsonRequest(omit(VALID_LEAD, 'first_name')), port);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.errors.first_name).toBeDefined();
  });

  it('[SPEC-FORM-001/RF-1] missing business_name → 400', async () => {
    const port: LeadPort = { deliver: vi.fn() };
    const res = await handleLead(makeJsonRequest(omit(VALID_LEAD, 'business_name')), port);
    expect(res.status).toBe(400);
  });

  it('[SPEC-FORM-001/RF-1] POST without JS (form body) with valid data → redirect 3xx', async () => {
    const port: LeadPort = { deliver: vi.fn().mockResolvedValue(undefined) };
    const res = await handleLead(makeFormRequest(VALID_LEAD), port);
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toContain('contact=success');
  });

  it('[SPEC-FORM-001/RF-1] POST without JS with invalid data → redirect with error', async () => {
    const port: LeadPort = { deliver: vi.fn() };
    const res = await handleLead(
      makeFormRequest(omit(VALID_LEAD, 'email') as Record<string, string>),
      port,
    );
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toContain('contact=error');
  });
});

// ── RF-2: LeadPort — interface + injectable adapter ───────────────────────────

describe('[SPEC-FORM-001/RF-2] LeadPort delivers the lead via the injected adapter', () => {
  beforeEach(() => resetRateLimitForTesting());

  it('[SPEC-FORM-001/RF-2] port.deliver is called with the validated payload', async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const port: LeadPort = { deliver };
    await handleLead(makeJsonRequest(VALID_LEAD), port);
    expect(deliver).toHaveBeenCalledOnce();
    expect(deliver).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'alice@example.com', first_name: 'Alice' }),
    );
  });

  it('[SPEC-FORM-001/RF-2] port.deliver is NOT called when payload is invalid', async () => {
    const deliver = vi.fn();
    const port: LeadPort = { deliver };
    await handleLead(makeJsonRequest(omit(VALID_LEAD, 'email')), port);
    expect(deliver).not.toHaveBeenCalled();
  });

  it('[SPEC-FORM-001/RF-2] LeadPayload type has required fields', () => {
    const sample: LeadPayload = {
      first_name: 'A',
      last_name: 'B',
      email: 'a@b.com',
      business_name: 'C',
      city: 'D',
    };
    expect(sample.email).toBe('a@b.com');
  });
});

// ── RF-3: anti-spam (honeypot + rate limit) ───────────────────────────────────

describe('[SPEC-FORM-001/RF-3] honeypot discards spam silently', () => {
  beforeEach(() => resetRateLimitForTesting());

  it('[SPEC-FORM-001/RF-3] honeypot field filled → 200 but port NOT called', async () => {
    const deliver = vi.fn();
    const port: LeadPort = { deliver };
    const res = await handleLead(makeJsonRequest({ ...VALID_LEAD, _gotcha: 'bot was here' }), port);
    expect(res.status).toBe(200);
    expect(deliver).not.toHaveBeenCalled();
  });

  it('[SPEC-FORM-001/RF-3] honeypot empty string → treated as empty (valid)', async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const port: LeadPort = { deliver };
    const res = await handleLead(makeJsonRequest({ ...VALID_LEAD, _gotcha: '' }), port);
    expect(deliver).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
  });
});

describe('[SPEC-FORM-001/RF-3] rate limit blocks after threshold', () => {
  it('[SPEC-FORM-001/RF-3] 5 requests from same IP succeed; 6th returns 429', async () => {
    resetRateLimitForTesting();
    const port: LeadPort = { deliver: vi.fn().mockResolvedValue(undefined) };
    const ip = '192.168.1.100';
    for (let i = 0; i < 5; i++) {
      const res = await handleLead(
        new Request('http://localhost/api/lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-forwarded-for': ip,
          },
          body: JSON.stringify(VALID_LEAD),
        }),
        port,
      );
      expect(res.status).toBe(200);
    }
    const blocked = await handleLead(
      new Request('http://localhost/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-forwarded-for': ip,
        },
        body: JSON.stringify(VALID_LEAD),
      }),
      port,
    );
    expect(blocked.status).toBe(429);
  });

  it('[SPEC-FORM-001/RF-3] different IPs get independent limits', async () => {
    resetRateLimitForTesting();
    const port: LeadPort = { deliver: vi.fn().mockResolvedValue(undefined) };
    for (let i = 0; i < 5; i++) {
      await handleLead(makeFormRequest(VALID_LEAD, `10.0.${i}.1`), port);
    }
    // A fresh IP should still succeed
    const res = await handleLead(makeFormRequest(VALID_LEAD, '10.0.99.1'), port);
    expect(res.status).not.toBe(429);
  });
});

// ── RF-3: Turnstile (server-side token verification) ─────────────────────────

describe('[SPEC-FORM-001/RF-3] Turnstile blocks invalid/missing tokens', () => {
  beforeEach(() => resetRateLimitForTesting());

  it('[SPEC-FORM-001/RF-3] invalid Turnstile token (JSON) → 400, port NOT called', async () => {
    const deliver = vi.fn();
    const port: LeadPort = { deliver };
    const res = await handleLead(makeJsonRequest(VALID_LEAD), port, () => Promise.resolve(false));
    expect(res.status).toBe(400);
    expect(deliver).not.toHaveBeenCalled();
  });

  it('[SPEC-FORM-001/RF-3] invalid Turnstile on form POST → redirect with error', async () => {
    const deliver = vi.fn();
    const port: LeadPort = { deliver };
    const res = await handleLead(makeFormRequest(VALID_LEAD), port, () => Promise.resolve(false));
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toContain('contact=error');
    expect(deliver).not.toHaveBeenCalled();
  });

  it('[SPEC-FORM-001/RF-3] valid Turnstile token (injected) → port called', async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const port: LeadPort = { deliver };
    const res = await handleLead(makeJsonRequest(VALID_LEAD), port, () => Promise.resolve(true));
    expect(res.status).toBe(200);
    expect(deliver).toHaveBeenCalledOnce();
  });

  it('[SPEC-FORM-001/RF-3] Contact.astro renders Turnstile widget (cf-turnstile class)', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8');
    expect(src).toContain('cf-turnstile');
  });

  it('[SPEC-FORM-001/RF-3] Turnstile widget uses flexible size to match the form width', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8');
    const widget = src.match(/<div[^>]*class="cf-turnstile"[\s\S]*?\/>/)?.[0] ?? '';
    expect(widget).toContain('data-size="flexible"');
    expect(widget).toContain('data-theme="light"');
  });

  it('[SPEC-FORM-001/RF-3] Turnstile container gets spacing from the form styles', () => {
    // the widget is a branded Cloudflare iframe — we only control container
    // spacing (margin), data-theme and data-size; never its inner styles
    const scss = fs.readFileSync(
      path.join(WEB, 'src/components/Contact/Contact.module.scss'),
      'utf-8',
    );
    const rule = scss.match(/:global\(\.cf-turnstile\)\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toContain('margin-top');
  });
});

// ── RF-2: env var naming (LEAD_PROVIDER / LEAD_TO_EMAIL / LEAD_FROM_EMAIL) ────

describe('[SPEC-FORM-001/RF-2] adapter env vars use LEAD_ prefix per spec', () => {
  it('[SPEC-FORM-001/RF-2] lead-email-adapter uses LEAD_PROVIDER', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/lib/lead-email-adapter.ts'), 'utf-8');
    expect(src).toContain('LEAD_PROVIDER');
  });

  it('[SPEC-FORM-001/RF-2] lead-email-adapter uses LEAD_TO_EMAIL', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/lib/lead-email-adapter.ts'), 'utf-8');
    expect(src).toContain('LEAD_TO_EMAIL');
  });

  it('[SPEC-FORM-001/RF-2] lead-email-adapter uses LEAD_FROM_EMAIL', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/lib/lead-email-adapter.ts'), 'utf-8');
    expect(src).toContain('LEAD_FROM_EMAIL');
  });

  it('[SPEC-FORM-001/RF-2] .env.example documents Turnstile keys', () => {
    const envExample = fs.readFileSync(path.join(WEB, '../../.env.example'), 'utf-8');
    expect(envExample).toContain('TURNSTILE_SITE_KEY');
    expect(envExample).toContain('TURNSTILE_SECRET_KEY');
  });
});

// ── RF-7: astro:env — runtime env reading ────────────────────────────────────

describe('[SPEC-FORM-001/RF-7] env vars read via astro:env at runtime, not baked at build', () => {
  it('[SPEC-FORM-001/RF-7] astro.config.ts defines env.schema with envField', () => {
    const src = fs.readFileSync(path.join(WEB, 'astro.config.ts'), 'utf-8');
    expect(src).toContain('envField');
    expect(src).toContain('TURNSTILE_SITE_KEY');
    expect(src).toContain('LEAD_TO_EMAIL');
  });

  it('[SPEC-FORM-001/RF-7] lead.ts POST handler reads from astro:env/server', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/pages/api/lead.ts'), 'utf-8');
    expect(src).toContain('astro:env');
  });

  it('[SPEC-FORM-001/RF-7] lead.ts does not use process.env directly', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/pages/api/lead.ts'), 'utf-8');
    expect(src).not.toContain('process.env');
  });

  it('[SPEC-FORM-001/RF-7] index.astro reads TURNSTILE_SITE_KEY from astro:env/server', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(src).toContain('astro:env/server');
    expect(src).not.toContain('import.meta.env.TURNSTILE_SITE_KEY');
  });

  it("[SPEC-FORM-001/RF-7] every env var is access: 'secret' (public gets inlined at build)", () => {
    // server+public vars are baked into the build, but the container only gets
    // its env from Dokploy at runtime — a public TURNSTILE_SITE_KEY bakes in
    // empty and the widget never renders (prompt 45). 'secret' = runtime read;
    // it does NOT hide the site key from the HTML (data-sitekey still emits).
    const src = fs.readFileSync(path.join(WEB, 'astro.config.ts'), 'utf-8');
    const fields = src.match(/envField\.string\(\{[^}]*\}/g) ?? [];
    expect(fields.length).toBeGreaterThanOrEqual(6);
    for (const field of fields) {
      expect(field).toContain("context: 'server'");
      expect(field).toContain("access: 'secret'");
    }
    expect(src).not.toContain("access: 'public'");
  });
});

// ── RF-4 & RNF-3: progressive enhancement + fidelity ─────────────────────────

describe('[SPEC-FORM-001/RF-4] form has PE structure (action + method for no-JS fallback)', () => {
  it('[SPEC-FORM-001/RF-4] Contact.astro form action="/api/lead"', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8');
    expect(src).toContain('action={formAction}');
    expect(src).toContain("'/api/lead'");
  });

  it('[SPEC-FORM-001/RF-4] Contact.astro form method="post"', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8');
    expect(src).toContain('method="post"');
  });

  it('[SPEC-FORM-001/RF-4] Contact.astro has honeypot field (_gotcha)', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8');
    expect(src).toContain('_gotcha');
  });

  it('[SPEC-FORM-001/RF-4] contact-form entry has addEventListener submit (not onsubmit attr)', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/scripts/contact-form/index.ts'), 'utf-8');
    expect(src).toContain("addEventListener('submit'");
    expect(
      fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8'),
    ).not.toContain('onsubmit=');
  });

  it('[SPEC-FORM-001/RF-4] index.astro reads contactState from URL params', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/pages/index.astro'), 'utf-8');
    expect(src).toContain('contactState');
  });
});

describe('[SPEC-FORM-001/RNF-3] fidelity — default form state unchanged for QA-001 gate', () => {
  it('[SPEC-FORM-001/RNF-3] success-msg has display:none in default CSS state', () => {
    const scss = fs.readFileSync(
      path.join(WEB, 'src/components/Contact/Contact.module.scss'),
      'utf-8',
    );
    expect(scss).toMatch(/\.success-msg\s*\{[^}]*display:\s*none/);
  });

  it('[SPEC-FORM-001/RNF-3] Contact.astro does not hardcode success-msg as visible', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8');
    const scss = fs.readFileSync(
      path.join(WEB, 'src/components/Contact/Contact.module.scss'),
      'utf-8',
    );
    expect(src).not.toContain('success-msg show');
    expect(scss).not.toMatch(/\.success-msg\s*\{[^}]*display:\s*block/);
  });
});

// ── RF-5: UX success/error ────────────────────────────────────────────────────

describe('[SPEC-FORM-001/RF-5] UX — success-msg and error display', () => {
  it('[SPEC-FORM-001/RF-5] Contact.astro has success-msg element', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8');
    expect(src).toContain('success-msg');
    expect(src).toContain('successMsg');
  });

  it('[SPEC-FORM-001/RF-5] Contact.astro shows success-msg when contactState=success (no-JS)', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8');
    expect(src).toContain("contactState === 'success'");
  });

  it('[SPEC-FORM-001/RF-5] contact-form sets aria-describedby on errored fields', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/scripts/contact-form/validate.ts'), 'utf-8');
    expect(src).toContain('aria-describedby');
  });

  it('[SPEC-FORM-001/RF-5] JS success handler focuses the confirmation (a11y; card per SPEC-FORM-002/RF-4)', () => {
    const script = fs.readFileSync(path.join(WEB, 'src/scripts/contact-form/state.ts'), 'utf-8');
    expect(script).toContain('confirmCard');
    expect(script).toContain('.focus()');
  });
});

// ── RF-6: security ────────────────────────────────────────────────────────────

describe('[SPEC-FORM-001/RF-6] security — no secrets in repo, no info leak', () => {
  it('[SPEC-FORM-001/RF-6] lead-email-adapter.ts has no hardcoded API keys', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/lib/lead-email-adapter.ts'), 'utf-8');
    expect(src).not.toMatch(/sk_live_|re_live_|Bearer [a-zA-Z0-9_-]{20,}/);
    expect(src).not.toMatch(/client_secret\s*=\s*['"]/);
  });

  it('[SPEC-FORM-001/RF-6] endpoint returns no stack trace on 500', async () => {
    resetRateLimitForTesting();
    const port: LeadPort = {
      deliver: vi.fn().mockRejectedValue(new Error('SMTP timeout at 192.168.1.1')),
    };
    const res = await handleLead(makeJsonRequest(VALID_LEAD), port);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('192.168.1.1');
  });
});

// ── RNF-1: a11y ───────────────────────────────────────────────────────────────

describe('[SPEC-FORM-001/RNF-1] a11y — errors announced, keyboard operable', () => {
  it('[SPEC-FORM-001/RNF-1] success-msg has tabindex for focus management', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8');
    expect(src).toContain('tabindex');
  });

  it('[SPEC-FORM-001/RNF-1] JS handler sets aria-invalid on errored fields', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/scripts/contact-form/validate.ts'), 'utf-8');
    expect(src).toContain('aria-invalid');
  });
});

// ── RNF-2: perf — small island ────────────────────────────────────────────────

describe('[SPEC-FORM-001/RNF-2] perf — no heavy client-side dependencies', () => {
  it('[SPEC-FORM-001/RNF-2] contact-form modules do not import heavyweight libs', () => {
    const dir = path.join(WEB, 'src/scripts/contact-form');
    for (const f of fs.readdirSync(dir)) {
      const src = fs.readFileSync(path.join(dir, f), 'utf-8');
      expect(src).not.toContain("import 'react'");
      expect(src).not.toContain('import React');
      expect(src).not.toContain('import axios');
    }
  });

  it('[SPEC-FORM-001/RNF-2] Turnstile api.js is not loaded eagerly from Contact.astro', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/components/Contact/Contact.astro'), 'utf-8');
    // no <script src="…turnstile…"> in the rendered HTML — the lazy loader
    // injects it when the contact section nears the viewport
    expect(src).not.toContain('src="https://challenges.cloudflare.com');
    expect(src).toContain('turnstile-lazy');
    expect(src).toContain('cf-turnstile'); // the widget div itself stays
  });

  it('[SPEC-FORM-001/RNF-2] turnstile-lazy defers api.js to viewport, injecting it once', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/scripts/turnstile-lazy.ts'), 'utf-8');
    expect(src).toContain('IntersectionObserver');
    expect(src).toContain('https://challenges.cloudflare.com/turnstile/v0/api.js');
    expect(src).toContain('.cf-turnstile');
    expect(src).toContain('rootMargin');
    expect(src.split('\n').length).toBeLessThanOrEqual(150); // SRP, FORM-002/INV-2
  });

  it('[SPEC-FORM-001/RNF-2] critical CSS is inlined (no render-blocking stylesheet link)', () => {
    const src = fs.readFileSync(path.join(WEB, 'astro.config.ts'), 'utf-8');
    expect(src).toContain("inlineStylesheets: 'always'");
  });
});

// ── RNF-4: reliability ────────────────────────────────────────────────────────

describe('[SPEC-FORM-001/RNF-4] port failure returns 500 (not silent)', () => {
  it('[SPEC-FORM-001/RNF-4] port.deliver throws → response is 500 JSON', async () => {
    resetRateLimitForTesting();
    const port: LeadPort = { deliver: vi.fn().mockRejectedValue(new Error('provider down')) };
    const res = await handleLead(makeJsonRequest(VALID_LEAD), port);
    expect(res.status).toBe(500);
  });

  it('[SPEC-FORM-001/RNF-4] port.deliver throws on form POST → redirect to deliveryfail', async () => {
    resetRateLimitForTesting();
    const port: LeadPort = { deliver: vi.fn().mockRejectedValue(new Error('timeout')) };
    const res = await handleLead(makeFormRequest(VALID_LEAD), port);
    expect(res.headers.get('location')).toContain('deliveryfail');
  });
});

// ── INV-1: endpoint uses LeadPort abstraction ─────────────────────────────────

describe('[SPEC-FORM-001/INV-1] endpoint uses LeadPort (provider-agnostic)', () => {
  it('[SPEC-FORM-001/INV-1] lead.ts imports from lead-port not directly from adapter', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/pages/api/lead.ts'), 'utf-8');
    expect(src).toContain('lead-port');
  });

  it('[SPEC-FORM-001/INV-1] endpoint conditionally uses adapter only when no port injected', () => {
    const src = fs.readFileSync(path.join(WEB, 'src/pages/api/lead.ts'), 'utf-8');
    // Port is injectable for testing
    expect(src).toContain('LeadPort');
  });
});

// ── INV-2: no secrets in repo ─────────────────────────────────────────────────

it('[SPEC-FORM-001/INV-2] lead-email-adapter.ts reads credentials from env, not hardcoded', () => {
  const src = fs.readFileSync(path.join(WEB, 'src/lib/lead-email-adapter.ts'), 'utf-8');
  expect(src).toContain('env.');
  expect(src).not.toMatch(/RESEND_API_KEY\s*=\s*['"]/);
  expect(src).not.toMatch(/POSTMARK_SERVER_TOKEN\s*=\s*['"]/);
});

// ── INV-3: spam doesn't reach the port ───────────────────────────────────────

it('[SPEC-FORM-001/INV-3] honeypot filled → port.deliver NOT invoked', async () => {
  resetRateLimitForTesting();
  const deliver = vi.fn();
  const port: LeadPort = { deliver };
  await handleLead(makeJsonRequest({ ...VALID_LEAD, _gotcha: 'spam' }), port);
  expect(deliver).not.toHaveBeenCalled();
});

// ── INV-4: SRP — separate files ───────────────────────────────────────────────

describe('[SPEC-FORM-001/INV-4] SRP — schema, port, adapter, endpoint in separate files', () => {
  it('[SPEC-FORM-001/INV-4] src/lib/lead-schema.ts exists', () => {
    expect(fs.existsSync(path.join(WEB, 'src/lib/lead-schema.ts'))).toBe(true);
  });

  it('[SPEC-FORM-001/INV-4] src/lib/lead-port.ts exists', () => {
    expect(fs.existsSync(path.join(WEB, 'src/lib/lead-port.ts'))).toBe(true);
  });

  it('[SPEC-FORM-001/INV-4] src/lib/lead-email-adapter.ts exists', () => {
    expect(fs.existsSync(path.join(WEB, 'src/lib/lead-email-adapter.ts'))).toBe(true);
  });

  it('[SPEC-FORM-001/INV-4] src/pages/api/lead.ts exists', () => {
    expect(fs.existsSync(path.join(WEB, 'src/pages/api/lead.ts'))).toBe(true);
  });
});

// ── LeadSchema unit tests ─────────────────────────────────────────────────────

describe('[SPEC-FORM-001/RF-1] LeadSchema (Zod) unit validation', () => {
  it('[SPEC-FORM-001/RF-1] valid lead passes schema', () => {
    expect(() => LeadSchema.parse(VALID_LEAD)).not.toThrow();
  });

  it('[SPEC-FORM-001/RF-1] phone is optional', () => {
    expect(() => LeadSchema.parse(omit(VALID_LEAD, 'phone'))).not.toThrow();
  });

  it('[SPEC-FORM-001/RF-1] empty email fails', () => {
    expect(() => LeadSchema.parse({ ...VALID_LEAD, email: '' })).toThrow();
  });

  it('[SPEC-FORM-001/RF-1] honeypot non-empty fails schema', () => {
    expect(() => LeadSchema.parse({ ...VALID_LEAD, _gotcha: 'bot' })).toThrow();
  });

  it('[SPEC-FORM-001/RF-1] honeypot empty string passes', () => {
    expect(() => LeadSchema.parse({ ...VALID_LEAD, _gotcha: '' })).not.toThrow();
  });
});
