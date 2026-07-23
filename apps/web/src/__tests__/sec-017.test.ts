/**
 * SPEC-SEC-017 — Endurecimiento de seguridad ronda 2 (2ª auditoría, parte de repo).
 * Un test de regresión por hallazgo: F-007 (headers en todas las respuestas),
 * F-002 (COOP sí, COEP no), F-004 (security.txt + Canonical), F-010 (anti-CSRF
 * por Origin en /api/lead).
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { headersFor, isExemptPath } from '../lib/security-headers';
import { handleLead, resetRateLimitForTesting } from '../pages/api/lead';
import type { LeadPort } from '../lib/lead-port';

const WEB = path.resolve(import.meta.dirname, '../..');
const read = (rel: string): string => fs.readFileSync(path.join(WEB, rel), 'utf-8');

// ── F-007 (RF-1, INV-1): nosniff + Referrer-Policy on EVERY response ─────────

describe('[SPEC-SEC-017/RF-1] nosniff and Referrer-Policy apply to every non-exempt response', () => {
  it('[SPEC-SEC-017/RF-1][SPEC-SEC-017/INV-1] JSON response (e.g. /api/lead) still gets nosniff + Referrer-Policy', () => {
    const headers = headersFor('/api/lead', 'application/json', undefined);
    expect(headers).not.toBeNull();
    expect(headers?.['X-Content-Type-Options']).toBe('nosniff');
    expect(headers?.['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('[SPEC-SEC-017/RF-1] document-only headers do NOT leak onto non-HTML responses', () => {
    const headers = headersFor('/api/lead', 'application/json', undefined);
    expect(headers?.['X-Frame-Options']).toBeUndefined();
    expect(headers?.['Permissions-Policy']).toBeUndefined();
    expect(headers?.['Cross-Origin-Opener-Policy']).toBeUndefined();
  });

  it('[SPEC-SEC-017/RF-1] plain assets / robots.txt / security.txt (text/plain) also get nosniff + Referrer-Policy', () => {
    const headers = headersFor('/robots.txt', 'text/plain; charset=utf-8', undefined);
    expect(headers?.['X-Content-Type-Options']).toBe('nosniff');
    expect(headers?.['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('[SPEC-SEC-017/RF-1] text/html documents still get the full header set (including document-only ones)', () => {
    const headers = headersFor('/', 'text/html; charset=utf-8', undefined);
    expect(headers).toEqual({
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
    });
  });

  it('[SPEC-SEC-017/RF-1] /admin stays fully exempt (no headers at all, not even nosniff)', () => {
    expect(isExemptPath('/admin')).toBe(true);
    expect(headersFor('/admin', 'text/html', undefined)).toBeNull();
    expect(headersFor('/admin/index.html', 'application/octet-stream', undefined)).toBeNull();
  });
});

// ── F-002 (RF-2, INV-2): COOP same-origin, NEVER COEP ─────────────────────────

describe('[SPEC-SEC-017/RF-2] COOP same-origin on documents; COEP never added', () => {
  it('[SPEC-SEC-017/RF-2] document response carries Cross-Origin-Opener-Policy: same-origin', () => {
    const headers = headersFor('/', 'text/html', undefined);
    expect(headers?.['Cross-Origin-Opener-Policy']).toBe('same-origin');
  });

  it('[SPEC-SEC-017/RF-2][SPEC-SEC-017/INV-2] no response ever carries Cross-Origin-Embedder-Policy', () => {
    // require-corp would break the Turnstile iframe (challenges.cloudflare.com)
    // and any cross-origin resource without CORP — deliberately never added.
    const doc = headersFor('/', 'text/html', undefined);
    const json = headersFor('/api/lead', 'application/json', undefined);
    expect(doc?.['Cross-Origin-Embedder-Policy']).toBeUndefined();
    expect(json?.['Cross-Origin-Embedder-Policy']).toBeUndefined();
  });

  it('[SPEC-SEC-017/INV-2] no header object in security-headers.ts sets Cross-Origin-Embedder-Policy', () => {
    // The source DOES mention the name in a comment (explaining why it's
    // deliberately omitted) — check it's never used as an actual header KEY.
    const src = read('src/lib/security-headers.ts');
    expect(src).not.toMatch(/['"]Cross-Origin-Embedder-Policy['"]\s*:/);
  });
});

// ── F-004 (RF-3): security.txt — Canonical resolves the contact-domain mismatch ──

describe('[SPEC-SEC-017/RF-3] security.txt is RFC 9116-complete with Canonical', () => {
  it('[SPEC-SEC-017/RF-3] response includes Canonical pointing at the prod .well-known URL', async () => {
    const mod = (await import('../pages/.well-known/security.txt')) as {
      GET: () => Response | Promise<Response>;
    };
    const res = await mod.GET();
    const body = await res.text();
    expect(body).toMatch(/^Canonical:\s*https:\/\/solidgraph\.io\/\.well-known\/security\.txt$/m);
    expect(body).toMatch(/^Contact:\s*mailto:andys@solidgraph\.io$/m);
    expect(body).toMatch(/^Expires:\s*\d{4}-\d{2}-\d{2}T/m);
  });
});

// ── F-010 (RF-4): /api/lead rejects cross-origin POSTs (cheap anti-CSRF) ──────

describe('[SPEC-SEC-017/RF-4] /api/lead rejects cross-origin requests before processing', () => {
  const validLead = () => ({
    first_name: 'Ana',
    last_name: 'Gomez',
    email: 'ana@example.com',
    business_name: 'Ana Co',
    city: 'Charlotte',
  });

  it('[SPEC-SEC-017/RF-4] mismatched Origin → 403, lead never delivered', async () => {
    resetRateLimitForTesting();
    const deliver = vi.fn().mockResolvedValue(undefined);
    const port: LeadPort = { deliver };
    const req = new Request('http://x.example/api/lead', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        origin: 'https://evil.example',
      },
      body: JSON.stringify(validLead()),
    });
    const res = await handleLead(req, port);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('Cross-origin request rejected');
    expect(deliver).not.toHaveBeenCalled();
  });

  it('[SPEC-SEC-017/RF-4] mismatched Origin + form (non-JSON) → redirect ?contact=error, not 403 JSON', async () => {
    resetRateLimitForTesting();
    const port: LeadPort = { deliver: vi.fn() };
    const req = new Request('http://x.example/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify(validLead()),
    });
    const res = await handleLead(req, port);
    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toContain('contact=error');
  });

  it('[SPEC-SEC-017/RF-4] matching Origin → passes through normally', async () => {
    resetRateLimitForTesting();
    const deliver = vi.fn().mockResolvedValue(undefined);
    const port: LeadPort = { deliver };
    const req = new Request('http://x.example/api/lead', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        origin: 'http://x.example',
      },
      body: JSON.stringify(validLead()),
    });
    const res = await handleLead(req, port);
    expect(res.status).toBe(200);
    expect(deliver).toHaveBeenCalled();
  });

  it('[SPEC-SEC-017/RF-4] no Origin but same-origin Referer → passes through', async () => {
    resetRateLimitForTesting();
    const deliver = vi.fn().mockResolvedValue(undefined);
    const port: LeadPort = { deliver };
    const req = new Request('http://x.example/api/lead', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        referer: 'http://x.example/#contact',
      },
      body: JSON.stringify(validLead()),
    });
    const res = await handleLead(req, port);
    expect(res.status).toBe(200);
    expect(deliver).toHaveBeenCalled();
  });

  it('[SPEC-SEC-017/RF-4] no Origin but cross-origin Referer → 403', async () => {
    resetRateLimitForTesting();
    const port: LeadPort = { deliver: vi.fn() };
    const req = new Request('http://x.example/api/lead', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        referer: 'https://evil.example/attack.html',
      },
      body: JSON.stringify(validLead()),
    });
    const res = await handleLead(req, port);
    expect(res.status).toBe(403);
  });

  it('[SPEC-SEC-017/RF-4] neither Origin nor Referer present → allowed (not the CSRF threat model)', async () => {
    resetRateLimitForTesting();
    const deliver = vi.fn().mockResolvedValue(undefined);
    const port: LeadPort = { deliver };
    const req = new Request('http://x.example/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(validLead()),
    });
    const res = await handleLead(req, port);
    expect(res.status).toBe(200);
    expect(deliver).toHaveBeenCalled();
  });

  it('[SPEC-SEC-017/RF-4] no CSRF token or session STATE introduced (cheap, stateless check only)', () => {
    // The source explains the design choice in a comment (mentioning the
    // words) — check no actual token/session mechanism (a generated value,
    // a store, a cookie) was wired in, not that the words never appear.
    const src = read('src/pages/api/lead.ts');
    expect(src).not.toMatch(/generateToken|csrfToken\s*=|session(Store|Id|Cookie)/i);
  });
});

// ── RNF-2 / INV-3: middleware still does zero per-request body work ──────────
// (prompt 61 lesson — reading/reconstructing the body de-streams SSR and
// blocks the event loop; see ADR-0018.)

describe('[SPEC-SEC-017/RNF-2][SPEC-SEC-017/INV-3] middleware stays header-only', () => {
  it('[SPEC-SEC-017/RNF-2][SPEC-SEC-017/INV-3] middleware.ts never reads or reconstructs the response body', () => {
    const src = read('src/middleware.ts');
    expect(src).not.toContain('.text()');
    expect(src).not.toMatch(/new Response\(/);
  });
});

// ── RNF-3: no secrets introduced ───────────────────────────────────────────────

describe('[SPEC-SEC-017/RNF-3] no secrets introduced', () => {
  it('[SPEC-SEC-017/RNF-3] Canonical URL is a public prod location, not a secret', () => {
    const src = read('src/pages/.well-known/security.txt.ts');
    expect(src).toContain('https://solidgraph.io/.well-known/security.txt');
    expect(src).not.toMatch(/ghp_|github_pat_|sk_live_|AKIA[0-9A-Z]{16}/);
  });

  it('[SPEC-SEC-017/RNF-3] the Origin/CSRF check introduces no new env var or secret', () => {
    // lead.ts already imports astro:env for pre-existing vars (Turnstile,
    // lead delivery) — check the NEW functions specifically read only
    // request headers, nothing env-sourced.
    const src = read('src/pages/api/lead.ts');
    const isCrossOriginFn = /function isCrossOrigin[\s\S]*?\n}/.exec(src)?.[0] ?? '';
    const requestHostFn = /function requestHost[\s\S]*?\n}/.exec(src)?.[0] ?? '';
    expect(isCrossOriginFn).not.toContain('env');
    expect(requestHostFn).not.toContain('env');
  });
});
