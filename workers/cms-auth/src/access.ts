/**
 * Cloudflare Access identity gate (SPEC-CMS-002/RF-2, INV-1).
 *
 * Access injects a `Cf-Access-Jwt-Assertion` JWT on every request that passed
 * its challenge. The Worker verifies it independently — signature (RS256)
 * against the team's public certs, audience = the Access App AUD, issuer and
 * expiry — so a request that bypassed Access (or forged headers) never
 * reaches the token.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { JWTVerifyGetKey } from 'jose';

export interface AccessIdentity {
  /** Editor email from the Access JWT (attribution — SPEC-CMS-002/RF-6). */
  email?: string;
}

// One remote JWKS per team domain, cached for the Worker isolate's lifetime.
const jwksByTeam = new Map<string, JWTVerifyGetKey>();

function remoteJwks(teamDomain: string): JWTVerifyGetKey {
  let jwks = jwksByTeam.get(teamDomain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    jwksByTeam.set(teamDomain, jwks);
  }
  return jwks;
}

/**
 * Returns the verified identity, or `null` when the JWT is missing/invalid/
 * for another audience — the caller must then answer with the error handshake
 * and never the token.
 */
export async function verifyAccessJwt(
  request: Request,
  env: { TEAM_DOMAIN: string; ACCESS_AUD: string },
  jwks?: JWTVerifyGetKey,
): Promise<AccessIdentity | null> {
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!assertion) return null;

  try {
    const { payload } = await jwtVerify(assertion, jwks ?? remoteJwks(env.TEAM_DOMAIN), {
      issuer: env.TEAM_DOMAIN,
      audience: env.ACCESS_AUD,
    });
    return { email: typeof payload['email'] === 'string' ? payload['email'] : undefined };
  } catch {
    return null;
  }
}
