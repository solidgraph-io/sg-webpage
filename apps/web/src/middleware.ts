/**
 * middleware — HTTP security headers + CSP (SPEC-SEC-016/RF-1, ADR-0018).
 * Thin Astro glue; the actual header/hash logic is in lib/security-headers.ts
 * (kept import-free of astro:* so it's directly unit-testable).
 */
import { defineMiddleware } from 'astro:middleware';
import { headersFor, isExemptPath, scriptHashesFrom } from './lib/security-headers';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const { pathname } = context.url;
  const contentType = response.headers.get('content-type');

  // Fast path: skip the body-read entirely when we won't add headers anyway.
  if (isExemptPath(pathname) || !(contentType ?? '').includes('text/html')) {
    return response;
  }

  const env = await import('astro:env/server');
  const html = await response.text();
  const headers = headersFor(pathname, contentType, env.SITE_ENV, scriptHashesFrom(html));

  const newResponse = new Response(html, { status: response.status, headers: response.headers });
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      newResponse.headers.set(key, value);
    }
  }
  return newResponse;
});
