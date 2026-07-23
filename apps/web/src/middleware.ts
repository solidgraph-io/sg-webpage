/**
 * middleware — static HTTP security headers (SPEC-SEC-016/RF-1, ADR-0018).
 * Thin Astro glue; the actual header logic is in lib/security-headers.ts
 * (kept import-free of astro:* so it's directly unit-testable).
 *
 * Deliberately does NOT read the response body (no body-buffering read, no
 * regex, no hashing) — that was prompt 60's approach and it de-streamed
 * Astro's SSR response while blocking the event loop on every request,
 * causing a real Lighthouse CI regression (prompt 61). CSP is generated
 * separately by Astro's `experimental.csp` (astro.config.ts) at render time
 * and is already present on `response` by the time we see it here.
 */
import { defineMiddleware } from 'astro:middleware';
import { headersFor, stripStyleHashesFromCsp } from './lib/security-headers';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const env = await import('astro:env/server');
  const headers = headersFor(
    context.url.pathname,
    response.headers.get('content-type'),
    env.SITE_ENV,
  );
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }

  // See stripStyleHashesFromCsp: a plain header-value edit, not a body read.
  const csp = response.headers.get('content-security-policy');
  if (csp) {
    const sanitized = stripStyleHashesFromCsp(csp);
    if (sanitized !== csp) response.headers.set('content-security-policy', sanitized);
  }

  return response;
});
