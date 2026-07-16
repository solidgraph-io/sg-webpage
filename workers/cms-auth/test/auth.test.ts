/**
 * SPEC-CMS-002 — Worker puente de auth del CMS (Cloudflare Access → token de servicio).
 * Runtime behavior: handshake HTML, Access-JWT gate, allowlist, secret from env.
 * (Repo-hygiene assertions — no secrets in wrangler.toml, isolation, config.yml —
 * live in apps/web/src/__tests__/cms-002.test.ts.)
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from 'jose';
import type { JWTVerifyGetKey } from 'jose';
import { handleRequest, type Env } from '../src/index';

const TEAM = 'https://solidgraph-test.cloudflareaccess.com';
const AUD = 'test-aud-e79c2';
const SITE = 'sg-webpage.solidgraph.dev';
const TOKEN = 'test-service-token-abc123';

let jwks: JWTVerifyGetKey;
let signValid: (claims?: Record<string, unknown>) => Promise<string>;
let signWithOtherKey: () => Promise<string>;

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const stranger = await generateKeyPair('RS256');
  jwks = createLocalJWKSet({ keys: [{ ...(await exportJWK(publicKey)), alg: 'RS256' }] });

  signValid = (claims = {}) =>
    new SignJWT({ email: 'editor@example.com', ...claims })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(TEAM)
      .setAudience(AUD)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

  signWithOtherKey = () =>
    new SignJWT({ email: 'mallory@example.com' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(TEAM)
      .setAudience(AUD)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(stranger.privateKey);
});

const ENV: Env = {
  TEAM_DOMAIN: TEAM,
  ACCESS_AUD: AUD,
  ALLOWED_DOMAINS: 'sg-webpage.solidgraph.dev, *.solidgraph.io',
  GITHUB_SERVICE_TOKEN: TOKEN,
};

function req(jwt?: string, site: string = SITE, path = '/auth'): Request {
  const url = `https://sg-cms-auth.example.workers.dev${path}?provider=github&site_id=${site}`;
  return new Request(url, {
    headers: jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {},
  });
}

// ── RF-1: /auth handshake, no GitHub OAuth roundtrip ──────────────────────────

describe('[SPEC-CMS-002/RF-1] GET /auth returns the Netlify/Decap handshake HTML', () => {
  it('[SPEC-CMS-002/RF-1] valid Access JWT → 200 HTML with success postMessage + token', async () => {
    const res = await handleRequest(req(await signValid()), ENV, jwks);
    const body = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(body).toContain("'authorizing:github'"); // listens for the CMS opener
    expect(body).toContain('authorization:github:success:');
    // the content JSON is embedded as a JS string literal (quotes escaped)
    expect(body).toContain('\\"provider\\":\\"github\\"');
    expect(body).toContain(TOKEN);
  });

  it('[SPEC-CMS-002/RF-1] routes other than /auth → 404', async () => {
    for (const path of ['/', '/callback', '/auth/extra', '/token']) {
      const res = await handleRequest(req(await signValid(), SITE, path), ENV, jwks);
      expect(res.status).toBe(404);
      expect(await res.text()).not.toContain(TOKEN);
    }
  });

  it('[SPEC-CMS-002/RNF-3] no OAuth redirect: response is 200 HTML without Location', async () => {
    const res = await handleRequest(req(await signValid()), ENV, jwks);
    expect(res.status).toBe(200);
    expect(res.headers.get('Location')).toBeNull();
    expect(await res.text()).not.toContain('github.com/login/oauth');
  });
});

// ── RF-2 / INV-1: Cloudflare Access gate — no valid JWT, no token. Ever. ──────

describe('[SPEC-CMS-002/RF-2] the Access JWT gate', () => {
  it('[SPEC-CMS-002/RF-2][SPEC-CMS-002/INV-1] missing JWT → error handshake, token absent', async () => {
    const res = await handleRequest(req(undefined), ENV, jwks);
    const body = await res.text();
    expect(body).toContain('authorization:github:error:');
    expect(body).not.toContain(TOKEN);
  });

  it('[SPEC-CMS-002/RF-2][SPEC-CMS-002/INV-1] JWT signed by another key → error, token absent', async () => {
    const res = await handleRequest(req(await signWithOtherKey()), ENV, jwks);
    const body = await res.text();
    expect(body).toContain('authorization:github:error:');
    expect(body).not.toContain(TOKEN);
  });

  it('[SPEC-CMS-002/RF-2][SPEC-CMS-002/INV-1] wrong aud → error, token absent', async () => {
    const badAud = await new SignJWT({ email: 'editor@example.com' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(TEAM)
      .setAudience('other-app-aud')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign((await generateKeyPair('RS256')).privateKey);
    const res = await handleRequest(req(badAud), ENV, jwks);
    expect(await res.text()).not.toContain(TOKEN);
  });

  it('[SPEC-CMS-002/RF-2] garbage JWT → error handshake (no crash)', async () => {
    const res = await handleRequest(req('not-a-jwt'), ENV, jwks);
    expect(res.status).toBe(200); // Decap contract: errors travel via postMessage
    expect(await res.text()).toContain('authorization:github:error:');
  });
});

// ── RF-3: token comes from the Worker secret, never hardcoded ─────────────────

describe('[SPEC-CMS-002/RF-3] service token is read from env (Worker secret)', () => {
  it('[SPEC-CMS-002/RF-3] a different env token surfaces verbatim in the handshake', async () => {
    const res = await handleRequest(
      req(await signValid()),
      { ...ENV, GITHUB_SERVICE_TOKEN: 'another-rotated-token' },
      jwks,
    );
    const body = await res.text();
    expect(body).toContain('another-rotated-token');
    expect(body).not.toContain(TOKEN);
  });

  it('[SPEC-CMS-002/RF-3] unset secret → error handshake, never an empty token grant', async () => {
    const res = await handleRequest(
      req(await signValid()),
      { ...ENV, GITHUB_SERVICE_TOKEN: undefined as unknown as string },
      jwks,
    );
    const body = await res.text();
    expect(body).toContain('authorization:github:error:');
    expect(body).not.toContain('authorization:github:success:');
  });
});

// ── RF-4: domain allowlist ────────────────────────────────────────────────────

describe('[SPEC-CMS-002/RF-4] site_id allowlist', () => {
  it('[SPEC-CMS-002/RF-4] site_id outside ALLOWED_DOMAINS → error, token absent', async () => {
    const res = await handleRequest(req(await signValid(), 'evil.example.com'), ENV, jwks);
    const body = await res.text();
    expect(body).toContain('authorization:github:error:');
    expect(body).not.toContain(TOKEN);
  });

  it('[SPEC-CMS-002/RF-4] exact allowed domain passes', async () => {
    const res = await handleRequest(req(await signValid(), SITE), ENV, jwks);
    expect(await res.text()).toContain('authorization:github:success:');
  });

  it('[SPEC-CMS-002/RF-4] wildcard entry (*.solidgraph.io) matches subdomains only', async () => {
    const ok = await handleRequest(req(await signValid(), 'cms.solidgraph.io'), ENV, jwks);
    expect(await ok.text()).toContain('authorization:github:success:');
    const bad = await handleRequest(req(await signValid(), 'solidgraph.io.evil.com'), ENV, jwks);
    expect(await bad.text()).toContain('authorization:github:error:');
  });
});

// ── RNF-1: the token only ever appears in the authenticated success path ──────

describe('[SPEC-CMS-002/RNF-1] token exposure is limited to the gated success path', () => {
  it('[SPEC-CMS-002/RNF-1] across all failure modes the token never leaks', async () => {
    const failures = [
      await handleRequest(req(undefined), ENV, jwks), // no JWT
      await handleRequest(req(await signWithOtherKey()), ENV, jwks), // bad signature
      await handleRequest(req(await signValid(), 'evil.example.com'), ENV, jwks), // bad domain
      await handleRequest(req(await signValid(), SITE, '/callback'), ENV, jwks), // bad route
    ];
    for (const res of failures) {
      expect(await res.text()).not.toContain(TOKEN);
    }
  });
});
