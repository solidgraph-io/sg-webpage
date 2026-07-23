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
