/**
 * SPEC-ANALYTICS-001 — Umami first-party analytics: conditional tracker,
 * same-origin proxy, declarative conversion events, privacy invariants.
 */

import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { handleScript } from '../pages/stats/script.js';
import { handleSend } from '../pages/stats/api/send';
import { ctaEventName, CTA_QUOTE, CTA_PLANS, CTA_PLAN_START } from '../lib/analytics';

const WEB = path.resolve(import.meta.dirname, '../..');
const read = (rel: string): string => fs.readFileSync(path.join(WEB, rel), 'utf-8');

const ANALYTICS = 'src/components/Analytics.astro';
const LAYOUT = 'src/layouts/BaseLayout.astro';
const NAV = 'src/components/Nav.astro';
const HERO = 'src/components/Hero/Hero.astro';
const HOW = 'src/components/HowItWorks/HowItWorks.astro';
const PLAN_CARD = 'src/components/PlanCard/PlanCard.astro';
const CONTACT_ENTRY = 'src/scripts/contact-form/index.ts';
const ADMIN_INDEX = 'public/admin/index.html';

// ── RF-1 / INV-1: tracker is env-gated, async/defer, same-origin ─────────────

describe('[SPEC-ANALYTICS-001/RF-1] tracker script is conditional on env, same-origin', () => {
  it('[SPEC-ANALYTICS-001/RF-1] Analytics.astro reads both ANALYTICS_UMAMI_* from astro:env/server', () => {
    const src = read(ANALYTICS);
    expect(src).toContain('astro:env/server');
    expect(src).toContain('ANALYTICS_UMAMI_HOST');
    expect(src).toContain('ANALYTICS_UMAMI_WEBSITE_ID');
  });

  it('[SPEC-ANALYTICS-001/RF-1] emits an async/defer same-origin script tag with the website id', () => {
    const src = read(ANALYTICS);
    expect(src).toMatch(/<script[^>]*\basync\b[^>]*\bdefer\b/);
    expect(src).toContain('src="/stats/script.js"');
    expect(src).toContain('data-host-url="/stats"');
    expect(src).toContain('data-website-id=');
    expect(src).not.toMatch(/src=["']https?:\/\//); // never third-party
  });

  it('[SPEC-ANALYTICS-001/INV-1] the script tag is gated — no unconditional <script src="/stats', () => {
    const src = read(ANALYTICS);
    // the tag must sit behind a conditional; a bare top-level tag would mean
    // it renders even without env
    expect(src).toMatch(/\{[^}]*&&[\s\S]*src="\/stats\/script\.js/);
  });

  it('[SPEC-ANALYTICS-001/RF-1] BaseLayout includes <Analytics /> in <head>', () => {
    const layout = read(LAYOUT);
    const headEnd = layout.indexOf('</head>');
    expect(layout.slice(0, headEnd)).toContain('<Analytics');
  });
});

// ── INV-3: /admin (CMS) is never tracked ──────────────────────────────────────

describe('[SPEC-ANALYTICS-001/INV-3] /admin is excluded from tracking', () => {
  it('[SPEC-ANALYTICS-001/INV-3] public/admin/index.html does not load the tracker', () => {
    const src = read(ADMIN_INDEX);
    expect(src).not.toContain('/stats/script.js');
  });
});

// ── RF-5: same-origin proxy to the Umami instance ─────────────────────────────

describe('[SPEC-ANALYTICS-001/RF-5] GET /stats/script.js proxies to ANALYTICS_UMAMI_HOST', () => {
  it('[SPEC-ANALYTICS-001/RF-5] no host configured → 404 (no-op)', async () => {
    const res = await handleScript(undefined);
    expect(res.status).toBe(404);
  });

  it('[SPEC-ANALYTICS-001/RF-5] host configured → fetches <host>/script.js and forwards it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('console.log(1)', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      }),
    );
    const res = await handleScript('https://umami.internal', fetchMock);
    expect(fetchMock).toHaveBeenCalledWith('https://umami.internal/script.js');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('javascript');
    expect(await res.text()).toBe('console.log(1)');
  });

  it('[SPEC-ANALYTICS-001/RF-5] GET export reads ANALYTICS_UMAMI_HOST via astro:env/server', () => {
    const src = read('src/pages/stats/script.js.ts');
    expect(src).toContain('astro:env/server');
    expect(src).toContain('ANALYTICS_UMAMI_HOST');
  });
});

describe('[SPEC-ANALYTICS-001/RF-5] POST /stats/api/send proxies + preserves IP/UA', () => {
  it('[SPEC-ANALYTICS-001/RF-5] no host configured → 404 (no-op)', async () => {
    const req = new Request('https://sg-webpage.solidgraph.dev/stats/api/send', {
      method: 'POST',
      body: '{}',
    });
    const res = await handleSend(req, undefined);
    expect(res.status).toBe(404);
  });

  it('[SPEC-ANALYTICS-001/RF-5] forwards the beacon body and preserves client IP + User-Agent', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"ok":true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const req = new Request('https://sg-webpage.solidgraph.dev/stats/api/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
        'user-agent': 'Mozilla/5.0 (test)',
      },
      body: JSON.stringify({ type: 'event' }),
    });
    const res = await handleSend(req, 'https://umami.internal', fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://umami.internal/api/send');
    expect(init.method).toBe('POST');
    const headers = new Headers(init.headers);
    expect(headers.get('X-Forwarded-For')).toBe('203.0.113.7'); // first hop only
    expect(headers.get('User-Agent')).toBe('Mozilla/5.0 (test)');
    expect(init.body).toBe(JSON.stringify({ type: 'event' }));
    expect(res.status).toBe(200);
  });

  it('[SPEC-ANALYTICS-001/RF-5] POST export reads ANALYTICS_UMAMI_HOST via astro:env/server', () => {
    const src = read('src/pages/stats/api/send.ts');
    expect(src).toContain('astro:env/server');
    expect(src).toContain('ANALYTICS_UMAMI_HOST');
  });
});

// ── RF-3: declarative conversion events ───────────────────────────────────────

describe('[SPEC-ANALYTICS-001/RF-3] stable event-name mapping', () => {
  it('[SPEC-ANALYTICS-001/RF-3] #contact → cta_quote_hero, #plans → cta_plans, else undefined', () => {
    expect(ctaEventName('#contact')).toBe(CTA_QUOTE);
    expect(ctaEventName('#plans')).toBe(CTA_PLANS);
    expect(ctaEventName('#faq')).toBeUndefined();
  });
});

describe('[SPEC-ANALYTICS-001/RF-3] primary CTAs carry data-umami-event', () => {
  it('[SPEC-ANALYTICS-001/RF-3] Nav CTA button uses ctaEventName(cta.href)', () => {
    const src = read(NAV);
    // Nav.astro is SRP-capped at <200 lines; the event is precomputed in the
    // frontmatter (navCtaEvent) instead of called inline in the JSX tag.
    expect(src).toContain('ctaEventName(cta.href)');
    expect(src).toMatch(/<Button[^>]*data-umami-event=\{navCtaEvent\}/);
  });

  it('[SPEC-ANALYTICS-001/RF-3] Hero CTA buttons use ctaEventName(cta.href)', () => {
    const src = read(HERO);
    expect(src).toContain('ctaEventName');
    expect(src).toMatch(/<Button[^>]*data-umami-event=\{ctaEventName\(cta\.href\)\}/);
  });

  it('[SPEC-ANALYTICS-001/RF-3] HowItWorks CTA buttons use ctaEventName(cta.href)', () => {
    const src = read(HOW);
    expect(src).toContain('ctaEventName');
    expect(src).toMatch(/<Button[^>]*data-umami-event=\{ctaEventName\(cta\.href\)\}/);
  });

  it(`[SPEC-ANALYTICS-001/RF-3] PlanCard "Get Started" carries ${CTA_PLAN_START} + plan name (no PII)`, () => {
    const src = read(PLAN_CARD);
    expect(src).toContain(`data-umami-event="${CTA_PLAN_START}"`);
    expect(src).toMatch(/data-umami-event-plan=\{name\}/);
  });
});

describe('[SPEC-ANALYTICS-001/RF-3][SPEC-ANALYTICS-001/RF-4] lead success emits a guarded, PII-free event', () => {
  it('[SPEC-ANALYTICS-001/RF-3] success branch calls window.umami?.track("lead", …)', () => {
    const src = read(CONTACT_ENTRY);
    const successBlock = /state = 'success';[\s\S]{0,400}/.exec(src)?.[0] ?? '';
    expect(successBlock).toMatch(/window\.umami\?\.track\(\s*'lead'/);
  });

  it('[SPEC-ANALYTICS-001/RF-4] the tracked payload has no email/name fields (categorical plan only)', () => {
    const src = read(CONTACT_ENTRY);
    const call = /window\.umami\?\.track\(\s*'lead'[\s\S]{0,200}?\)/.exec(src)?.[0] ?? '';
    expect(call).not.toMatch(/email|first_name|last_name|phone/i);
  });
});

// ── RF-2: pageviews are Umami's native behavior — no extra code ──────────────

describe('[SPEC-ANALYTICS-001/RF-2] pageviews require no bespoke tracking code', () => {
  it('[SPEC-ANALYTICS-001/RF-2] Analytics.astro only emits the tracker tag, no manual pageview call', () => {
    const src = read(ANALYTICS);
    // the whole point of RF-2 is that the Umami script auto-registers
    // pageviews on load — a hand-rolled `.track('pageview', …)` would mean
    // we stopped relying on that native behavior
    expect(src).not.toMatch(/\.track\(\s*['"]pageview['"]/);
  });
});

// ── RNF-1 / RNF-2: perf + fidelity — tag only, nothing else rendered ─────────

describe('[SPEC-ANALYTICS-001/RNF-1][SPEC-ANALYTICS-001/RNF-2] perf and fidelity', () => {
  it('[SPEC-ANALYTICS-001/RNF-1] the tracker is async+defer (never render-blocking)', () => {
    const src = read(ANALYTICS);
    expect(src).toMatch(/<script[^>]*\basync\b[^>]*\bdefer\b[^>]*\/>/);
  });

  it('[SPEC-ANALYTICS-001/RNF-2] Analytics.astro renders nothing but the conditional script (no visual output, QA-001 unaffected)', () => {
    const src = read(ANALYTICS);
    const fmEnd = src.indexOf('---', src.indexOf('---') + 3) + 3;
    const template = src.slice(fmEnd);
    // the only tag in the whole template must be the (conditional) <script>
    const tags = [...template.matchAll(/<([a-zA-Z][\w-]*)/g)].map((m) => m[1]);
    expect(tags).toEqual(['script']);
  });
});

// ── RNF-3: nothing hardcoded — both vars are runtime env, never baked in ────

describe('[SPEC-ANALYTICS-001/RNF-3] config via astro:env, nothing hardcoded', () => {
  it('[SPEC-ANALYTICS-001/RNF-3] astro.config.ts declares both vars as server/secret/optional', () => {
    const src = read('astro.config.ts');
    const block = /ANALYTICS_UMAMI_HOST:[\s\S]{0,120}?\}\)/.exec(src)?.[0] ?? '';
    expect(block).toContain("context: 'server'");
    expect(block).toContain("access: 'secret'");
    expect(block).toContain('optional: true');
    const idBlock = /ANALYTICS_UMAMI_WEBSITE_ID:[\s\S]{0,120}?\}\)/.exec(src)?.[0] ?? '';
    expect(idBlock).toContain("access: 'secret'");
  });

  it('[SPEC-ANALYTICS-001/RNF-3] no literal website id is hardcoded in Analytics.astro', () => {
    const src = read(ANALYTICS);
    // the only assignment must come from the env import, never a string literal
    expect(src).not.toMatch(/data-website-id=["'][a-zA-Z0-9-]+["']/);
  });
});

// ── RNF-4: data-umami-event attributes don't touch a11y semantics ───────────

describe('[SPEC-ANALYTICS-001/RNF-4] data-umami-event does not alter a11y semantics', () => {
  it('[SPEC-ANALYTICS-001/RNF-4] instrumented CTAs carry no aria-* or tabindex override alongside the event attribute', () => {
    for (const file of [NAV, HERO, HOW, PLAN_CARD]) {
      const src = read(file);
      for (const m of src.matchAll(/<(?:Button|a)\b[^>]*data-umami-event[^>]*>/g)) {
        expect(m[0]).not.toMatch(/\baria-|tabindex=/);
      }
    }
  });
});

// ── INV-2: cookieless, no consent banner, DNT respected natively by Umami ────

describe('[SPEC-ANALYTICS-001/INV-2] privacy invariants', () => {
  it('[SPEC-ANALYTICS-001/INV-2] the tracker tag never overrides Umami defaults (cookieless + DNT respected)', () => {
    const src = read(ANALYTICS);
    // any of these data-* attributes would be an opt-out of Umami's default
    // privacy behavior — none should be present
    expect(src).not.toMatch(/data-(cache|domains|do-not-track|exclude-search)=/);
  });

  it('[SPEC-ANALYTICS-001/INV-2] no consent/cookie-banner component was introduced (cookieless design)', () => {
    const componentsDir = path.join(WEB, 'src/components');
    const hasBanner = fs
      .readdirSync(componentsDir, { recursive: true })
      .some((f) => /consent|cookie-?banner/i.test(String(f)));
    expect(hasBanner).toBe(false);
  });
});
