/**
 * /.well-known/security.txt — SPEC-SEC-016/RF-5 (RFC 9116).
 * Contact placeholder pending confirmation from the human (see prompt 60 report).
 */
import type { APIRoute } from 'astro';

const SECURITY_CONTACT_EMAIL = 'security@solidgraph.io'; // placeholder — confirm with the human

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
