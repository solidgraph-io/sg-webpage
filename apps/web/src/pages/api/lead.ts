import type { APIRoute } from 'astro';
import { LeadSchema } from '../../lib/lead-schema';
import type { LeadPort } from '../../lib/lead-port';
import { checkRateLimit, resetStore } from '../../lib/rate-limit';
import { createEmailAdapter } from '../../lib/lead-email-adapter';
import { verifyTurnstile } from '../../lib/turnstile';

// Exported for testing — inject port and/or turnstileVerify to override defaults
export async function handleLead(
  request: Request,
  port?: LeadPort,
  turnstileVerify?: (token: string) => Promise<boolean>,
): Promise<Response> {
  const isJson = (request.headers.get('accept') ?? '').includes('application/json');

  // SPEC-SEC-017/RF-4 (F-010): cheap anti-CSRF, ahead of rate-limit/Turnstile
  // so cross-origin noise is cut early. No CSRF token/session — nothing
  // stateful to protect; this is defense-in-depth alongside Turnstile.
  // Origin/Referer both absent → allow: browsers issuing a cross-site
  // request always send at least one of these, so absence signals a
  // non-browser client, not the CSRF threat model.
  if (isCrossOrigin(request)) {
    const msg = 'Cross-origin request rejected';
    if (isJson) return json({ error: msg }, 403);
    return redirect(request, '/?contact=error');
  }

  // SPEC-SEC-016/RF-2 (F-03): CF-Connecting-IP first (set by Cloudflare's edge,
  // not client-suppliable), then X-Real-IP, then the LAST X-Forwarded-For hop
  // (the first is client-controlled and trivially spoofable — INV-2).
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ??
    'unknown';

  if (!checkRateLimit(ip).ok) {
    const msg = 'Too many requests. Please wait a minute and try again.';
    if (isJson) return json({ error: msg }, 429);
    return redirect(request, '/?contact=ratelimit');
  }

  let data: Record<string, unknown>;
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    // SPEC-SEC-016/RF-3 (F-05): malformed body → 400, never an uncaught 500.
    try {
      data = (await request.json()) as Record<string, unknown>;
    } catch {
      const msg = 'Invalid request body';
      if (isJson) return json({ error: msg }, 400);
      return redirect(request, '/?contact=error');
    }
  } else {
    const form = await request.formData();
    const pairs: Array<[string, unknown]> = [];
    form.forEach((val, key) => pairs.push([key, val]));
    data = Object.fromEntries(pairs);
  }

  // Honeypot — silently discard without invoking port
  const gotcha = typeof data['_gotcha'] === 'string' ? data['_gotcha'] : '';
  if (gotcha.length > 0) {
    if (isJson) return json({ ok: true }, 200);
    return redirect(request, '/?contact=success');
  }

  // Turnstile — verify challenge token; skip in test/dev mode (no turnstileVerify injected)
  const verify = turnstileVerify ?? (() => Promise.resolve(true));
  const cfToken =
    typeof data['cf-turnstile-response'] === 'string' ? data['cf-turnstile-response'] : '';
  if (!(await verify(cfToken))) {
    const msg = 'Invalid or expired captcha. Please try again.';
    if (isJson) return json({ error: msg }, 400);
    return redirect(request, '/?contact=error');
  }

  const result = LeadSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    if (isJson) return json({ errors }, 400);
    const params = new URLSearchParams({ contact: 'error' });
    return redirect(request, `/?${params}`);
  }

  const resolvedPort = port ?? createEmailAdapter({});
  try {
    await resolvedPort.deliver(result.data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[lead] delivery error:', err instanceof Error ? err.message : err);
    if (isJson) return json({ error: 'Delivery failed. Please try again.' }, 500);
    return redirect(request, '/?contact=deliveryfail');
  }

  if (isJson) return json({ ok: true }, 200);
  return redirect(request, '/?contact=success');
}

export const POST: APIRoute = async ({ request }) => {
  const env = await import('astro:env/server');
  const port = createEmailAdapter({
    LEAD_PROVIDER: env.LEAD_PROVIDER,
    LEAD_TO_EMAIL: env.LEAD_TO_EMAIL,
    LEAD_FROM_EMAIL: env.LEAD_FROM_EMAIL,
    RESEND_API_KEY: env.RESEND_API_KEY,
  });
  const secretKey = env.TURNSTILE_SECRET_KEY;
  const verify = secretKey
    ? (t: string) => verifyTurnstile(t, secretKey)
    : () => Promise.resolve(true);
  return handleLead(request, port, verify);
};

// Exported for testing only
export const resetRateLimitForTesting = resetStore;

// ── helpers ───────────────────────────────────────────────────────────────────

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function redirect(request: Request, path: string): Response {
  const base = new URL(request.url).origin;
  return Response.redirect(base + path, 303);
}

/** Host from the Origin header, falling back to Referer's host. Null if neither is present/parseable. */
function requestHost(request: Request): string | null {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host;
    } catch {
      return null;
    }
  }
  const referer = request.headers.get('referer');
  if (!referer) return null;
  try {
    return new URL(referer).host;
  } catch {
    return null;
  }
}

/**
 * SPEC-SEC-017/RF-4 (F-010): true only when Origin/Referer is present AND its
 * host differs from the request's own. "Own host" prefers X-Forwarded-Host
 * (Cloudflare/Traefik in prod), then the Host header, and only as a last
 * resort `new URL(request.url).host`. That ordering matters: @astrojs/node's
 * standalone adapter normalizes request.url's origin to a fixed
 * `http://localhost` regardless of the actual bound host or the client's real
 * target (confirmed empirically — using request.url as the primary source
 * rejected every legitimate same-origin request in a real run). Host is what
 * the client actually connected to and is the standard basis for
 * Origin-based CSRF checks (OWASP); request.url only stays as a fallback for
 * synthetic Request objects in tests, which don't carry a Host header at all.
 * Scheme-agnostic on purpose: an http-vs-https mismatch on the SAME host is
 * not the CSRF threat model.
 */
function isCrossOrigin(request: Request): boolean {
  const originHost = requestHost(request);
  if (!originHost) return false;
  const ownHost =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host') ??
    new URL(request.url).host;
  return originHost !== ownHost;
}
