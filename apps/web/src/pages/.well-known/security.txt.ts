/**
 * /.well-known/security.txt — SPEC-SEC-016/RF-5, SPEC-SEC-017/RF-3 (RFC 9116).
 * Contact confirmed by the human (SPEC-SEC-016/RF-5). Canonical (F-004)
 * resolves the "contact-domain mismatch": the contact is @solidgraph.io, so
 * the canonical location is pinned to that same domain, not wherever this
 * happens to be served from (staging, a preview deploy, etc.).
 */
import type { APIRoute } from 'astro';

const SECURITY_CONTACT_EMAIL = 'andys@solidgraph.io';
const CANONICAL_URL = 'https://solidgraph.io/.well-known/security.txt';

function expiresIn(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export const GET: APIRoute = () => {
  const content = [
    `Contact: mailto:${SECURITY_CONTACT_EMAIL}`,
    `Expires: ${expiresIn(365)}`,
    `Canonical: ${CANONICAL_URL}`,
    'Preferred-Languages: es, en',
    '',
  ].join('\n');

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
