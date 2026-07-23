/**
 * security-headers — pure CSP/header logic for SPEC-SEC-016/RF-1 (F-02, ADR-0018).
 * Kept free of any `astro:*` import so it's directly unit-testable; the Astro
 * middleware glue (src/middleware.ts) is a thin wrapper around this module.
 */
import { createHash } from 'node:crypto';

/**
 * Astro sometimes inlines a page's bundled client script directly into the
 * HTML (`<script type="module">…</script>`, no `src`) instead of emitting an
 * external file — observed for Contact's form+Turnstile bundle. A hardcoded
 * hash would break on every rebuild (minified output changes), so instead we
 * hash whatever inline, executing `<script>` blocks are actually in THIS
 * response body, per request. `type="application/ld+json"` blocks are data,
 * never executed, and are excluded (they don't need a hash, script-src
 * doesn't govern them, but skipping keeps the CSP minimal).
 */
export function scriptHashesFrom(html: string): string[] {
  const hashes = new Set<string>();
  const scriptTagRe = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptTagRe.exec(html)) !== null) {
    const attrs = match[1] ?? '';
    const body = match[2] ?? '';
    if (/\bsrc\s*=/i.test(attrs)) continue; // external — governed by host-source, not hash
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue; // data, never executed
    if (body.trim() === '') continue;
    const digest = createHash('sha256').update(body, 'utf8').digest('base64');
    hashes.add(`'sha256-${digest}'`);
  }
  return [...hashes];
}

/**
 * Full CSP string. script-src is 'self' + Turnstile's origin + any hashes for
 * this response's inline scripts — NEVER 'unsafe-inline' (INV-1).
 */
export function buildCsp(scriptHashes: string[] = []): string {
  const scriptSrc = ["'self'", 'https://challenges.cloudflare.com', ...scriptHashes].join(' ');
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://challenges.cloudflare.com",
    'frame-src https://challenges.cloudflare.com',
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

/** /admin is Access-gated and CDN-loaded — never gets the strict site CSP. */
export function isExemptPath(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

/**
 * Pure decision of which headers to apply, given the request path, the
 * response's content-type, the runtime SITE_ENV, and (for document
 * responses) the body's inline-script hashes. Returns null when no headers
 * should be added (non-document response, or an exempt path).
 */
export function headersFor(
  pathname: string,
  contentType: string | null,
  siteEnv: string | undefined,
  scriptHashes: string[] = [],
): Record<string, string> | null {
  if (isExemptPath(pathname)) return null;
  if (!(contentType ?? '').includes('text/html')) return null;

  const headers: Record<string, string> = {
    'Content-Security-Policy': buildCsp(scriptHashes),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
  if (siteEnv === 'staging') {
    headers['X-Robots-Tag'] = 'noindex, nofollow';
  }
  return headers;
}
