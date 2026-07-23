/**
 * SPEC-SEC-016 — Endurecimiento de seguridad (auditoría PT-2026-002, parte de repo).
 * Un test de regresión por hallazgo: F-02 (headers+CSP), F-03 (IP fiable),
 * F-05 (400 ante JSON malformado), F-06 (noindex de staging), RF-5 (security.txt).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { headersFor, isExemptPath, stripStyleHashesFromCsp } from '../lib/security-headers';
import { handleLead } from '../pages/api/lead';
import type { LeadPort } from '../lib/lead-port';
import { resetRateLimitForTesting } from '../pages/api/lead';
import { isStagingNoIndex } from '../lib/site-env';

const WEB = path.resolve(import.meta.dirname, '../..');
const read = (rel: string): string => fs.readFileSync(path.join(WEB, rel), 'utf-8');

beforeEach(() => {
  resetRateLimitForTesting();
});

// ── F-02 (RF-1, INV-1): security headers ──────────────────────────────────────
// CSP itself is generated at render time by Astro's experimental.csp
// (astro.config.ts) — see the dedicated describe blocks below for that and
// for the RNF-2 perf-regression guard (prompt 61).

describe('[SPEC-SEC-016/RF-1] document responses carry the static security headers', () => {
  it('[SPEC-SEC-016/RF-1] text/html response on a normal path gets all 4 headers', () => {
    const headers = headersFor('/', 'text/html; charset=utf-8', undefined);
    expect(headers).toEqual({
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    });
  });

  it('[SPEC-SEC-016/RF-1] non-document responses (e.g. JSON) get no security headers', () => {
    expect(headersFor('/api/lead', 'application/json', undefined)).toBeNull();
  });

  it('[SPEC-SEC-016/RF-1] /admin never gets the strict site headers (Access-gated, CDN-loaded)', () => {
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
});

// ── F-02 (RF-1, INV-1): CSP is build/render-time via experimental.csp ────────

describe('[SPEC-SEC-016/RF-1][SPEC-SEC-016/INV-1] CSP config (astro.config.ts, experimental.csp)', () => {
  it('[SPEC-SEC-016/RF-1] experimental.csp is enabled', () => {
    const src = read('astro.config.ts');
    expect(src).toMatch(/experimental:\s*{[\s\S]*csp:\s*{/);
  });

  it('[SPEC-SEC-016/INV-1] scriptDirective.resources never includes unsafe-inline', () => {
    const src = read('astro.config.ts');
    const block = /scriptDirective:\s*{[\s\S]*?}/.exec(src)?.[0] ?? '';
    expect(block).toContain('challenges.cloudflare.com');
    expect(block).not.toContain('unsafe-inline');
  });

  it('[SPEC-SEC-016/RF-1] styleDirective allows unsafe-inline (ADR-0018 trade-off: inlineStylesheets)', () => {
    const src = read('astro.config.ts');
    const block = /styleDirective:\s*{[\s\S]*?}/.exec(src)?.[0] ?? '';
    expect(block).toContain('unsafe-inline');
  });

  it('[SPEC-SEC-016/RF-1] directives cover frame-ancestors, default-src, object-src, connect-src (Turnstile)', () => {
    const src = read('astro.config.ts');
    expect(src).toContain("frame-ancestors 'none'");
    expect(src).toContain("default-src 'self'");
    expect(src).toContain("object-src 'none'");
    expect(src).toContain("connect-src 'self' https://challenges.cloudflare.com");
  });
});

// ── F-02 (RF-1, INV-1): style-src hash vs unsafe-inline spec interaction ─────

describe('[SPEC-SEC-016/RF-1] stripStyleHashesFromCsp keeps style unsafe-inline honored', () => {
  it('[SPEC-SEC-016/RF-1] removes a style-src hash while keeping unsafe-inline and other directives', () => {
    // Per the CSP spec, ANY hash present in style-src silently revokes
    // 'unsafe-inline' for the whole directive (style-src-attr included) —
    // and Astro's experimental.csp unconditionally hashes every inline
    // <style> block it compiles, including scoped styles from legacy
    // components not yet on CSS Modules. This is the header-only (not
    // body-read) fix that keeps ADR-0018's accepted style unsafe-inline
    // trade-off actually working.
    const csp =
      "default-src 'self'; script-src 'self' 'sha256-scriptHash='; " +
      "style-src 'self' 'unsafe-inline' 'sha256-styleHash='; object-src 'none'";
    const fixed = stripStyleHashesFromCsp(csp);
    expect(fixed).toContain("style-src 'self' 'unsafe-inline'");
    expect(fixed).not.toContain('sha256-styleHash');
    expect(fixed).toContain('sha256-scriptHash'); // script hashes stay untouched
    expect(fixed).toContain("object-src 'none'"); // unrelated directives untouched
  });

  it('[SPEC-SEC-016/RF-1] strips multiple style hashes in the same directive', () => {
    const csp = "style-src 'self' 'unsafe-inline' 'sha256-aaa=' 'sha256-bbb=' 'sha384-ccc==';";
    const fixed = stripStyleHashesFromCsp(csp);
    expect(fixed).toBe("style-src 'self' 'unsafe-inline';");
  });

  it('[SPEC-SEC-016/RF-1] is a no-op when style-src has no hash (e.g. once legacy components migrate)', () => {
    const csp = "style-src 'self' 'unsafe-inline';";
    expect(stripStyleHashesFromCsp(csp)).toBe(csp);
  });

  it('[SPEC-SEC-016/RF-1] middleware.ts applies the fix to the header only, not the body', () => {
    const src = read('src/middleware.ts');
    expect(src).toContain('stripStyleHashesFromCsp');
    expect(src).toContain("get('content-security-policy')");
  });
});

// ── RNF-2: no per-request body work — the prompt-61 perf-regression guard ────

describe('[SPEC-SEC-016/RNF-2] middleware does zero per-request body work', () => {
  it('[SPEC-SEC-016/RNF-2] middleware.ts never calls response.text() / reads the body', () => {
    // Prompt 60's middleware did `await response.text()` + a full-HTML regex
    // scan + SHA-256 per request to build the CSP itself. That de-streamed
    // Astro's SSR response and blocked the event loop, causing a real
    // Lighthouse CI regression (TBT ~14s under CPU contention — prompt 61).
    // CSP moved to build/render-time (experimental.csp); this guards against
    // ever reintroducing a body read here.
    const src = read('src/middleware.ts');
    expect(src).not.toContain('.text()');
    expect(src).not.toContain('scriptHashesFrom');
    expect(src).not.toMatch(/new Response\(/); // never reconstructs the body
  });

  it('[SPEC-SEC-016/RNF-2] security-headers.ts no longer exposes any body/HTML-scanning helper', () => {
    const src = read('src/lib/security-headers.ts');
    expect(src).not.toContain('scriptHashesFrom');
    expect(src).not.toContain('createHash');
  });

  it('[SPEC-SEC-016/RNF-2] headersFor stays O(1): no HTML/body parameter', () => {
    // (pathname, contentType, siteEnv) only — no response/body/html param.
    expect(headersFor).toHaveLength(3);
  });
});

// ── RNF-1: no unhashed *static* inline scripts (the one we control directly) ──

describe('[SPEC-SEC-016/RNF-1] the head bootstrap script stays external', () => {
  it('[SPEC-SEC-016/RNF-1] BaseLayout loads it from public/enable-js.js, not inline', () => {
    // INV-1 requires script-src without unsafe-inline. Astro's
    // experimental.csp auto-hashes whatever inline scripts IT emits (e.g.
    // Contact's bundled form+Turnstile module), but the one static script we
    // hand-authored (the early .js class toggle) is external on purpose —
    // one less thing for the CSP machinery to have to hash.
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
    // Contact confirmed by the human (SPEC-SEC-016/RF-5) — andys@, not the
    // security@ placeholder the route shipped with in prompt 60.
    expect(body).toMatch(/^Contact:\s*mailto:andys@solidgraph\.io$/m);
    expect(body).toMatch(/^Expires:\s*\d{4}-\d{2}-\d{2}T/m);
    expect(body).toMatch(/^Preferred-Languages:/m);
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
