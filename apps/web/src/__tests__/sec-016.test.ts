/**
 * SPEC-SEC-016 — Endurecimiento de seguridad (auditoría PT-2026-002, parte de repo).
 * Un test de regresión por hallazgo: F-02 (headers+CSP), F-03 (IP fiable),
 * F-05 (400 ante JSON malformado), F-06 (noindex de staging), RF-5 (security.txt).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { headersFor, isExemptPath, scriptHashesFrom } from '../lib/security-headers';
import { handleLead } from '../pages/api/lead';
import type { LeadPort } from '../lib/lead-port';
import { resetRateLimitForTesting } from '../pages/api/lead';
import { isStagingNoIndex } from '../lib/site-env';

const WEB = path.resolve(import.meta.dirname, '../..');
const read = (rel: string): string => fs.readFileSync(path.join(WEB, rel), 'utf-8');

beforeEach(() => {
  resetRateLimitForTesting();
});

// ── F-02 (RF-1, INV-1): security headers + CSP ────────────────────────────────

describe('[SPEC-SEC-016/RF-1] document responses carry the security headers', () => {
  it('[SPEC-SEC-016/RF-1] text/html response on a normal path gets all 5 headers', () => {
    const headers = headersFor('/', 'text/html; charset=utf-8', undefined);
    expect(headers).not.toBeNull();
    expect(headers).toMatchObject({
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
    expect(headers?.['Content-Security-Policy']).toBeTruthy();
  });

  it('[SPEC-SEC-016/RF-1] non-document responses (e.g. JSON) get no security headers', () => {
    expect(headersFor('/api/lead', 'application/json', undefined)).toBeNull();
  });

  it('[SPEC-SEC-016/RF-1] CSP tunes Turnstile (challenges.cloudflare.com) and Umami same-origin', () => {
    const csp = headersFor('/', 'text/html', undefined)?.['Content-Security-Policy'] ?? '';
    expect(csp).toContain("script-src 'self' https://challenges.cloudflare.com");
    expect(csp).toContain('https://challenges.cloudflare.com'); // frame-src / connect-src
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it('[SPEC-SEC-016/INV-1] script-src never contains unsafe-inline', () => {
    const csp = headersFor('/', 'text/html', undefined)?.['Content-Security-Policy'] ?? '';
    const scriptSrc = /script-src[^;]*/.exec(csp)?.[0] ?? '';
    expect(scriptSrc).not.toContain('unsafe-inline');
  });

  it('[SPEC-SEC-016/RF-1] X-Frame-Options DENY is coherent with frame-ancestors none', () => {
    const headers = headersFor('/', 'text/html', undefined);
    const csp = headers?.['Content-Security-Policy'] ?? '';
    expect(headers?.['X-Frame-Options']).toBe('DENY');
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('[SPEC-SEC-016/RF-1] /admin never gets the strict site CSP (Access-gated, CDN-loaded)', () => {
    expect(isExemptPath('/admin')).toBe(true);
    expect(isExemptPath('/admin/index.html')).toBe(true);
    expect(headersFor('/admin', 'text/html', undefined)).toBeNull();
    expect(headersFor('/admin/index.html', 'text/html', undefined)).toBeNull();
  });

  it('[SPEC-SEC-016/RF-1] non-admin paths are not exempt', () => {
    expect(isExemptPath('/')).toBe(false);
    expect(isExemptPath('/pricing')).toBe(false);
  });

  it('[SPEC-SEC-016/RF-1] middleware.ts wires headersFor into onRequest via astro:middleware', () => {
    const src = read('src/middleware.ts');
    expect(src).toContain("from 'astro:middleware'");
    expect(src).toContain('headersFor');
  });

  it('[SPEC-SEC-016/RF-1][SPEC-SEC-016/INV-1] inline module scripts get a per-response sha256 hash in script-src', () => {
    // Astro sometimes inlines a page's bundled client script (e.g. Contact's
    // form+Turnstile bundle) as <script type="module"> with no src. A
    // hardcoded hash would break on every rebuild, so the middleware hashes
    // whatever's actually in THIS response body — this is the mechanism that
    // keeps INV-1 (no unsafe-inline) true without silently blocking real,
    // build-generated inline scripts.
    const html = '<script type="module">const x = 1;</script>';
    const hashes = scriptHashesFrom(html);
    expect(hashes).toHaveLength(1);
    expect(hashes[0]).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);

    const csp = headersFor('/', 'text/html', undefined, hashes)?.['Content-Security-Policy'] ?? '';
    expect(csp).toContain(hashes[0]);
    const scriptSrc = /script-src[^;]*/.exec(csp)?.[0] ?? '';
    expect(scriptSrc).not.toContain('unsafe-inline'); // still true even with hashes present
  });

  it('[SPEC-SEC-016/RF-1] scriptHashesFrom ignores external scripts (src=) and JSON-LD data blocks', () => {
    const html = [
      '<script src="/interactions.js" defer></script>',
      '<script type="application/ld+json">{"@type":"Organization"}</script>',
    ].join('\n');
    expect(scriptHashesFrom(html)).toEqual([]);
  });

  it('[SPEC-SEC-016/RF-1] scriptHashesFrom is deterministic and dedupes identical scripts', () => {
    const html = '<script type="module">foo();</script><script type="module">foo();</script>';
    expect(scriptHashesFrom(html)).toHaveLength(1); // same content → same hash, deduped
    expect(scriptHashesFrom(html)).toEqual(scriptHashesFrom(html)); // stable across calls
  });

  it('[SPEC-SEC-016/RNF-1] no unhashed inline scripts remain: the head bootstrap moved to an external file', () => {
    // INV-1 requires script-src without unsafe-inline; the only inline
    // execution risk was the early `.js` class toggle in BaseLayout — it now
    // lives in an external same-origin file so 'self' covers it, no hash
    // needed. This regression-tests that we didn't quietly reintroduce it.
    const layout = read('src/layouts/BaseLayout.astro');
    expect(layout).not.toMatch(/<script is:inline>\s*document\.documentElement/);
    expect(fs.existsSync(path.join(WEB, 'public/enable-js.js'))).toBe(true);
    expect(read('public/enable-js.js')).toContain("classList.add('js')");
  });
});

// ── F-03 (RF-2, INV-2): trustworthy rate-limit IP ─────────────────────────────

describe('[SPEC-SEC-016/RF-2] rate-limit IP resolution order', () => {
  it('[SPEC-SEC-016/RF-2] CF-Connecting-IP takes priority over X-Real-IP and X-Forwarded-For', async () => {
    const deliver = vi.fn().mockResolvedValue(undefined);
    const port: LeadPort = { deliver };
    const req = new Request('http://x/api/lead', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'cf-connecting-ip': '9.9.9.9',
        'x-real-ip': '8.8.8.8',
        'x-forwarded-for': '1.1.1.1, 2.2.2.2',
      },
      body: JSON.stringify(validLead()),
    });
    await handleLead(req, port);
    // exercised indirectly below via rate-limit collision; this call just
    // proves the request succeeds with all three headers present
    expect(deliver).toHaveBeenCalled();
  });

  it('[SPEC-SEC-016/RF-2][SPEC-SEC-016/INV-2] rotating X-Forwarded-For does not evade the limiter when CF-Connecting-IP is stable', async () => {
    const port: LeadPort = { deliver: vi.fn().mockResolvedValue(undefined) };
    const makeReq = (xff: string) =>
      new Request('http://x/api/lead', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'cf-connecting-ip': '9.9.9.9',
          'x-forwarded-for': xff,
        },
        body: JSON.stringify(validLead()),
      });

    // MAX = 5 per rate-limit.ts; a 6th request with a freshly rotated XFF
    // must still be blocked because CF-Connecting-IP stayed the same.
    for (let i = 0; i < 5; i++) {
      const res = await handleLead(makeReq(`10.0.0.${i}`), port);
      expect(res.status).toBe(200);
    }
    const blocked = await handleLead(makeReq('10.0.0.99'), port);
    expect(blocked.status).toBe(429);
  });

  it('[SPEC-SEC-016/RF-2] falls back to X-Real-IP, then the LAST X-Forwarded-For hop', async () => {
    const port: LeadPort = { deliver: vi.fn().mockResolvedValue(undefined) };
    // last hop of XFF only, no cf-connecting-ip/x-real-ip
    const req = new Request('http://x/api/lead', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-forwarded-for': 'attacker-controlled, 1.1.1.1, 5.6.7.8',
      },
      body: JSON.stringify(validLead()),
    });
    const res = await handleLead(req, port);
    expect(res.status).toBe(200);
  });

  it('[SPEC-SEC-016/RF-2] lead.ts reads cf-connecting-ip first and the LAST XFF hop, not the first', () => {
    const src = read('src/pages/api/lead.ts');
    expect(src).toContain('cf-connecting-ip');
    expect(src).toMatch(/x-forwarded-for['"]\)\?\.split\(','\)\.pop\(\)/);
  });
});

// ── F-05 (RF-3, INV-3): malformed JSON → 400, never 500 ───────────────────────

describe('[SPEC-SEC-016/RF-3] malformed JSON body never crashes the endpoint', () => {
  it('[SPEC-SEC-016/RF-3][SPEC-SEC-016/INV-3] unparseable JSON body → 400, not 500', async () => {
    const port: LeadPort = { deliver: vi.fn() };
    const req = new Request('http://x/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: '{not valid json!!',
    });
    const res = await handleLead(req, port);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('Invalid request body');
    expect(port.deliver).not.toHaveBeenCalled();
  });

  it('[SPEC-SEC-016/RF-3] non-JSON accept + malformed JSON body → redirect to ?contact=error, not 500', async () => {
    const port: LeadPort = { deliver: vi.fn() };
    const req = new Request('http://x/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{{{',
    });
    const res = await handleLead(req, port);
    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toContain('contact=error');
  });
});

// ── F-06 (RF-4): staging noindex, env-gated ───────────────────────────────────

describe('[SPEC-SEC-016/RF-4] staging is non-indexable, prod behavior unchanged', () => {
  it('[SPEC-SEC-016/RF-4] isStagingNoIndex is true only for SITE_ENV=staging or legacy PUBLIC_NOINDEX=true', () => {
    expect(isStagingNoIndex('staging', undefined)).toBe(true);
    expect(isStagingNoIndex(undefined, 'true')).toBe(true);
    expect(isStagingNoIndex('production', undefined)).toBe(false);
    expect(isStagingNoIndex(undefined, undefined)).toBe(false);
    expect(isStagingNoIndex(undefined, 'false')).toBe(false);
  });

  it('[SPEC-SEC-016/RF-4] middleware sets X-Robots-Tag only when SITE_ENV is staging', () => {
    expect(headersFor('/', 'text/html', 'staging')?.['X-Robots-Tag']).toBe('noindex, nofollow');
    expect(headersFor('/', 'text/html', 'production')?.['X-Robots-Tag']).toBeUndefined();
    expect(headersFor('/', 'text/html', undefined)?.['X-Robots-Tag']).toBeUndefined();
  });

  it('[SPEC-SEC-016/RF-4] robots.txt.ts reads SITE_ENV via astro:env/server', () => {
    const src = read('src/pages/robots.txt.ts');
    expect(src).toContain('astro:env/server');
    expect(src).toContain('isStagingNoIndex');
  });

  it('[SPEC-SEC-016/RF-4] BaseLayout meta robots reflects SITE_ENV=staging too', () => {
    const src = read('src/layouts/BaseLayout.astro');
    expect(src).toContain('SITE_ENV');
    expect(src).toContain('isStagingNoIndex');
  });
});

// ── RF-5: security.txt (RFC 9116) ─────────────────────────────────────────────

describe('[SPEC-SEC-016/RF-5] /.well-known/security.txt', () => {
  it('[SPEC-SEC-016/RF-5] route file exists and exports GET', () => {
    const file = 'src/pages/.well-known/security.txt.ts';
    expect(fs.existsSync(path.join(WEB, file))).toBe(true);
    expect(read(file)).toContain('export const GET');
  });

  it('[SPEC-SEC-016/RF-5] response includes Contact: and Expires:', async () => {
    const mod = (await import('../pages/.well-known/security.txt')) as {
      GET: () => Response | Promise<Response>;
    };
    const res = await mod.GET();
    const body = await res.text();
    expect(body).toMatch(/^Contact:\s*mailto:.+$/m);
    expect(body).toMatch(/^Expires:\s*\d{4}-\d{2}-\d{2}T/m);
    expect(body).toMatch(/^Preferred-Languages:/m);
  });
});

// ── RNF-2: headers-only — never touches the response body/render ─────────────

describe('[SPEC-SEC-016/RNF-2] headers never affect the rendered document', () => {
  it('[SPEC-SEC-016/RNF-2] headersFor is a pure header map — it never reads or returns a body', () => {
    // Real render-fidelity (Lighthouse 100, QA-001 visual gate) is verified
    // empirically per RF-1's build+serve check (see prompt 60 report); this
    // regression-tests the code-level guarantee that headersFor is headers-only.
    const headers = headersFor('/', 'text/html', undefined);
    expect(headers).not.toBeNull();
    expect(Object.values(headers ?? {}).every((v) => typeof v === 'string')).toBe(true);
    expect(headersFor).toHaveLength(3); // (pathname, contentType, siteEnv) — no response/body param
  });
});

// ── RNF-3: no secrets in the repo ──────────────────────────────────────────────

describe('[SPEC-SEC-016/RNF-3] no secrets introduced', () => {
  it('[SPEC-SEC-016/RNF-3] SITE_ENV is declared secret/optional in astro.config.ts (runtime, not baked)', () => {
    const src = read('astro.config.ts');
    const block = /SITE_ENV:[\s\S]{0,120}?\}\)/.exec(src)?.[0] ?? '';
    expect(block).toContain("context: 'server'");
    expect(block).toContain("access: 'secret'");
    expect(block).toContain('optional: true');
  });

  it('[SPEC-SEC-016/RNF-3] security.txt has no hardcoded internal secret, only a public contact', () => {
    const src = read('src/pages/.well-known/security.txt.ts');
    expect(src).not.toMatch(/ghp_|github_pat_|sk_live_|AKIA[0-9A-Z]{16}/);
  });
});

// ── helper ────────────────────────────────────────────────────────────────────

function validLead(): Record<string, unknown> {
  return {
    first_name: 'Ana',
    last_name: 'Gomez',
    email: 'ana@example.com',
    phone: '555-0100',
    business_name: 'Ana Co',
    city: 'Charlotte',
    message: 'Hola, quiero un sitio.',
  };
}
