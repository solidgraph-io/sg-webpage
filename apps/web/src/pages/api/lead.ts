import type { APIRoute } from 'astro';
import { LeadSchema } from '../../lib/lead-schema';
import type { LeadPort } from '../../lib/lead-port';
import { checkRateLimit, resetStore } from '../../lib/rate-limit';
import { createEmailAdapter } from '../../lib/lead-email-adapter';

// Exported for testing — pass a mock LeadPort to override the email adapter
export async function handleLead(request: Request, port?: LeadPort): Promise<Response> {
  const isJson = (request.headers.get('accept') ?? '').includes('application/json');

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip).ok) {
    const msg = 'Too many requests. Please wait a minute and try again.';
    if (isJson) return json({ error: msg }, 429);
    return redirect(request, '/?contact=ratelimit');
  }

  let data: Record<string, unknown>;
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    data = (await request.json()) as Record<string, unknown>;
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

  const result = LeadSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    if (isJson) return json({ errors }, 400);
    const params = new URLSearchParams({ contact: 'error' });
    return redirect(request, `/?${params}`);
  }

  const resolvedPort = port ?? createEmailAdapter(process.env as Record<string, string>);
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

export const POST: APIRoute = ({ request }) => handleLead(request);

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
