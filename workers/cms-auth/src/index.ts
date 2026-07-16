/**
 * cms-auth — Worker puente de auth del CMS (SPEC-CMS-002, ADR-0017).
 *
 * GET /auth: tras validar la identidad de Cloudflare Access (RF-2) y el
 * dominio solicitante (RF-4), entrega a Sveltia el token de la cuenta de
 * servicio (secret del Worker — RF-3) mediante el handshake postMessage de
 * Netlify/Decap (RF-1). Sin OAuth de GitHub. Deploy separado del sitio
 * (RNF-2); ver DEPLOY.md.
 */

import type { JWTVerifyGetKey } from 'jose';
import { verifyAccessJwt } from './access';
import { handshakeHtml } from './handshake';

export interface Env {
  /** Team de Cloudflare Access, p. ej. https://solidgraph.cloudflareaccess.com */
  TEAM_DOMAIN: string;
  /** AUD de la Access App que protege /admin + este Worker */
  ACCESS_AUD: string;
  /** Dominios permitidos (coma-separados; admite comodín *.dominio) */
  ALLOWED_DOMAINS: string;
  /** PAT fine-grained de la cuenta de servicio — SECRET (`wrangler secret put`) */
  GITHUB_SERVICE_TOKEN: string;
}

/** `site_id` must match ALLOWED_DOMAINS (comma-separated, `*` wildcard). */
function domainAllowed(siteId: string, allowed: string): boolean {
  if (!siteId) return false;
  return allowed
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean)
    .some((entry) => {
      const re = new RegExp(`^${entry.replace(/\./g, '\\.').replace(/\*/g, '[^.]+')}$`);
      return re.test(siteId);
    });
}

const error = (message: string): Response =>
  handshakeHtml('error', { provider: 'github', error: message });

export async function handleRequest(
  request: Request,
  env: Env,
  jwks?: JWTVerifyGetKey, // test seam: local JWKS instead of the team's remote certs
): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== '/auth') {
    return new Response('Not Found', { status: 404 });
  }

  const siteId = url.searchParams.get('site_id') ?? '';
  if (!domainAllowed(siteId, env.ALLOWED_DOMAINS)) {
    return error(`"${siteId}" is not an allowed domain`);
  }

  // INV-1: without a valid Access identity the token is never emitted.
  const identity = await verifyAccessJwt(request, env, jwks);
  if (!identity) {
    return error('Unauthorized: missing or invalid Cloudflare Access identity');
  }

  if (!env.GITHUB_SERVICE_TOKEN) {
    return error('Service token not configured (wrangler secret put GITHUB_SERVICE_TOKEN)');
  }

  // RF-6 (atribución) queda diferido: los commits van a la cuenta de servicio;
  // el email del editor (identity.email) no viaja en el handshake.
  return handshakeHtml('success', { provider: 'github', token: env.GITHUB_SERVICE_TOKEN });
}

export default {
  fetch: (request: Request, env: Env): Promise<Response> => handleRequest(request, env),
};
