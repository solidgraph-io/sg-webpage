/**
 * /.well-known/security.txt — SPEC-SEC-016/RF-5 (RFC 9116).
 * Contact confirmed by the human (SPEC-SEC-016/RF-5).
 */
import type { APIRoute } from 'astro';

const SECURITY_CONTACT_EMAIL = 'andys@solidgraph.io';

function expiresIn(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export const GET: APIRoute = () => {
  const content = [
    `Contact: mailto:${SECURITY_CONTACT_EMAIL}`,
    `Expires: ${expiresIn(365)}`,
    'Preferred-Languages: es, en',
    '',
  ].join('\n');

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
