/**
 * SPEC-DEPLOY-001 — Stage dev: deploy continuo desde `develop` (registry + Dokploy)
 *
 * Tests are static file assertions against .drone.yml and docs. The pipeline
 * itself is the live proof; these verify structural invariants in the repo.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const DRONE = path.join(ROOT, '.drone.yml');
const ENV_EXAMPLE = path.join(ROOT, '.env.example');
const RUNBOOK = path.join(ROOT, 'docs/deploy/dev-stage.md');

function drone(): string {
  return fs.readFileSync(DRONE, 'utf-8');
}

// ── RF-1: develop branch supported in pipeline ────────────────────────────────

describe('[SPEC-DEPLOY-001/RF-1] develop branch is integrated in the pipeline', () => {
  it('[SPEC-DEPLOY-001/RF-1] .drone.yml build step includes develop in branch list', () => {
    expect(drone()).toMatch(/branch:\s*\n\s*- develop/);
  });

  it('[SPEC-DEPLOY-001/RF-1] .drone.yml has build-push-web-dev step for develop', () => {
    expect(drone()).toContain('build-push-web-dev');
  });
});

// ── RF-2: build-push-web-dev step ────────────────────────────────────────────

describe('[SPEC-DEPLOY-001/RF-2] build-push-web-dev publishes dev image to registry', () => {
  it('[SPEC-DEPLOY-001/RF-2] build-push-web-dev uses plugins/docker image', () => {
    const src = drone();
    const idx = src.indexOf('build-push-web-dev');
    expect(idx).toBeGreaterThan(-1);
    const stepBlock = src.slice(idx, idx + 600);
    expect(stepBlock).toContain('plugins/docker');
  });

  it('[SPEC-DEPLOY-001/RF-2] build-push-web-dev targets registry.solidgraph.dev/solidgraph-web', () => {
    expect(drone()).toContain('registry.solidgraph.dev/solidgraph-web');
  });

  it('[SPEC-DEPLOY-001/RF-2] build-push-web-dev uses dev tag (not latest)', () => {
    const src = drone();
    const idx = src.indexOf('build-push-web-dev');
    const stepBlock = src.slice(idx, idx + 600);
    expect(stepBlock).toContain('- dev');
    expect(stepBlock).not.toContain('- latest');
  });

  it('[SPEC-DEPLOY-001/RF-2] build-push-web-dev also tags with DRONE_COMMIT_SHA', () => {
    const src = drone();
    const idx = src.indexOf('build-push-web-dev');
    const stepBlock = src.slice(idx, idx + 600);
    expect(stepBlock).toContain('DRONE_COMMIT_SHA');
  });

  it('[SPEC-DEPLOY-001/RF-2] build-push-web-dev triggers only on develop push', () => {
    const src = drone();
    const idx = src.indexOf('build-push-web-dev');
    const stepBlock = src.slice(idx, idx + 600);
    expect(stepBlock).toMatch(/branch:\s*\n\s*- develop/);
    expect(stepBlock).not.toMatch(/branch:\s*\n\s*- main/);
  });

  it('[SPEC-DEPLOY-001/RF-2] build-push-web-dev uses apps/web/Dockerfile', () => {
    const src = drone();
    const idx = src.indexOf('build-push-web-dev');
    const stepBlock = src.slice(idx, idx + 600);
    expect(stepBlock).toContain('apps/web/Dockerfile');
  });
});

// ── RF-3: trigger-dokploy-dev step ───────────────────────────────────────────

describe('[SPEC-DEPLOY-001/RF-3] trigger-dokploy-dev POSTs to DOKPLOY_WEBHOOK_WEB_DEV', () => {
  it('[SPEC-DEPLOY-001/RF-3] .drone.yml has trigger-dokploy-dev step', () => {
    expect(drone()).toContain('trigger-dokploy-dev');
  });

  it('[SPEC-DEPLOY-001/RF-3] trigger-dokploy-dev uses DOKPLOY_WEBHOOK_WEB_DEV secret', () => {
    const src = drone();
    const idx = src.indexOf('trigger-dokploy-dev');
    const stepBlock = src.slice(idx, idx + 400);
    expect(stepBlock).toContain('DOKPLOY_WEBHOOK_WEB_DEV');
  });

  it('[SPEC-DEPLOY-001/RF-3] trigger-dokploy-dev depends on build-push-web-dev', () => {
    const src = drone();
    const idx = src.indexOf('trigger-dokploy-dev');
    const stepBlock = src.slice(idx, idx + 400);
    expect(stepBlock).toContain('build-push-web-dev');
  });

  it('[SPEC-DEPLOY-001/RF-3] trigger-dokploy-dev triggers only on develop push', () => {
    const src = drone();
    const idx = src.indexOf('trigger-dokploy-dev');
    const stepBlock = src.slice(idx, idx + 400);
    expect(stepBlock).toMatch(/branch:\s*\n\s*- develop/);
  });
});

// ── RF-4: same gates as prod ──────────────────────────────────────────────────

describe('[SPEC-DEPLOY-001/RF-4] dev deploy runs after the same gates as prod', () => {
  it('[SPEC-DEPLOY-001/RF-4] build-push-web-dev depends on visual-test, a11y-test and perf-test', () => {
    const src = drone();
    // Use step-level search to avoid matching comments before the definition.
    const idx = src.indexOf('- name: build-push-web-dev');
    const stepBlock = src.slice(idx, idx + 600);
    expect(stepBlock).toContain('visual-test');
    expect(stepBlock).toContain('a11y-test');
    expect(stepBlock).toContain('perf-test');
  });
});

// ── RF-5: env vars documented ─────────────────────────────────────────────────

describe('[SPEC-DEPLOY-001/RF-5] required env vars are documented in .env.example', () => {
  it('[SPEC-DEPLOY-001/RF-5] .env.example has PUBLIC_SITE_URL', () => {
    const src = fs.readFileSync(ENV_EXAMPLE, 'utf-8');
    expect(src).toContain('PUBLIC_SITE_URL');
  });

  it('[SPEC-DEPLOY-001/RF-5] .env.example has LEAD_PROVIDER', () => {
    const src = fs.readFileSync(ENV_EXAMPLE, 'utf-8');
    expect(src).toContain('LEAD_PROVIDER');
  });

  it('[SPEC-DEPLOY-001/RF-5] .env.example has LEAD_TO_EMAIL', () => {
    const src = fs.readFileSync(ENV_EXAMPLE, 'utf-8');
    expect(src).toContain('LEAD_TO_EMAIL');
  });

  it('[SPEC-DEPLOY-001/RF-5] .env.example has TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY', () => {
    const src = fs.readFileSync(ENV_EXAMPLE, 'utf-8');
    expect(src).toContain('TURNSTILE_SITE_KEY');
    expect(src).toContain('TURNSTILE_SECRET_KEY');
  });
});

// ── RF-6: runbook exists ──────────────────────────────────────────────────────

describe('[SPEC-DEPLOY-001/RF-6] docs/deploy/dev-stage.md runbook exists', () => {
  it('[SPEC-DEPLOY-001/RF-6] docs/deploy/dev-stage.md file exists', () => {
    expect(fs.existsSync(RUNBOOK)).toBe(true);
  });

  it('[SPEC-DEPLOY-001/RF-6] runbook documents Drone secrets', () => {
    if (!fs.existsSync(RUNBOOK)) return;
    const src = fs.readFileSync(RUNBOOK, 'utf-8');
    expect(src).toContain('DOKPLOY_WEBHOOK_WEB_DEV');
  });

  it('[SPEC-DEPLOY-001/RF-6] runbook documents DNS/Traefik setup', () => {
    if (!fs.existsSync(RUNBOOK)) return;
    const src = fs.readFileSync(RUNBOOK, 'utf-8');
    expect(src).toMatch(/dev\.solidgraph\.dev/);
  });

  it('[SPEC-DEPLOY-001/RF-6] runbook documents post-deploy verification steps', () => {
    if (!fs.existsSync(RUNBOOK)) return;
    const src = fs.readFileSync(RUNBOOK, 'utf-8');
    expect(src).toContain('/api/lead');
  });
});

// ── RNF-1: paridad prod/dev (same Dockerfile) ────────────────────────────────

describe('[SPEC-DEPLOY-001/RNF-1] dev uses same Dockerfile and gates as prod', () => {
  it('[SPEC-DEPLOY-001/RNF-1] build-push-web and build-push-web-dev use same Dockerfile path', () => {
    const src = drone();
    const idxProd = src.indexOf('build-push-web\n');
    const idxDev = src.indexOf('build-push-web-dev');
    const prodBlock = src.slice(idxProd, idxProd + 600);
    const devBlock = src.slice(idxDev, idxDev + 600);
    expect(prodBlock).toContain('apps/web/Dockerfile');
    expect(devBlock).toContain('apps/web/Dockerfile');
  });
});

// ── RNF-2: no secrets in repo ────────────────────────────────────────────────

describe('[SPEC-DEPLOY-001/RNF-2] pipeline uses from_secret for all credentials', () => {
  it('[SPEC-DEPLOY-001/RNF-2] .drone.yml has no hardcoded API keys or passwords', () => {
    const src = drone();
    expect(src).not.toMatch(/password:\s+[a-zA-Z0-9+/]{20,}/);
    expect(src).not.toMatch(/RESEND_API_KEY:\s+re_/);
    expect(src).not.toMatch(/TURNSTILE_SECRET_KEY:\s+[0-9a-zA-Z_-]{20,}/);
  });

  it('[SPEC-DEPLOY-001/RNF-2] DOKPLOY_WEBHOOK_WEB_DEV is from_secret, not inline', () => {
    expect(drone()).toContain('from_secret: DOKPLOY_WEBHOOK_WEB_DEV');
  });
});

// ── RNF-3: prod steps unchanged ──────────────────────────────────────────────

describe('[SPEC-DEPLOY-001/RNF-3] prod steps (main) are not modified', () => {
  it('[SPEC-DEPLOY-001/RNF-3] build-push-web still targets main branch only', () => {
    const src = drone();
    const idx = src.indexOf('- name: build-push-web\n');
    const stepBlock = src.slice(idx, idx + 600);
    expect(stepBlock).toMatch(/branch:\s*\n\s*- main/);
    expect(stepBlock).not.toMatch(/branch:\s*\n\s*- develop/);
  });

  it('[SPEC-DEPLOY-001/RNF-3] trigger-dokploy still targets DOKPLOY_WEBHOOK_WEB (prod)', () => {
    const src = drone();
    expect(src).toContain('DOKPLOY_WEBHOOK_WEB\n');
  });

  it('[SPEC-DEPLOY-001/RNF-3] prod image still uses latest tag', () => {
    const src = drone();
    const idx = src.indexOf('- name: build-push-web\n');
    const stepBlock = src.slice(idx, idx + 600);
    expect(stepBlock).toContain('- latest');
  });
});

// ── INV-1: dev tag ≠ latest (no tag crossover) ───────────────────────────────

describe('[SPEC-DEPLOY-001/INV-1] dev tag is never latest; prod tag is never dev', () => {
  it('[SPEC-DEPLOY-001/INV-1] dev step does not use latest tag', () => {
    const src = drone();
    const idx = src.indexOf('build-push-web-dev');
    const stepBlock = src.slice(idx, idx + 600);
    expect(stepBlock).not.toContain('- latest');
  });

  it('[SPEC-DEPLOY-001/INV-1] prod step does not use dev tag', () => {
    const src = drone();
    const idx = src.indexOf('- name: build-push-web\n');
    const stepBlock = src.slice(idx, idx + 600);
    expect(stepBlock).not.toContain('- dev');
  });
});

// ── INV-2: same gates gate dev ───────────────────────────────────────────────

it('[SPEC-DEPLOY-001/INV-2] dev publish step depends on perf-test (all gates passed)', () => {
  const src = drone();
  const idx = src.indexOf('build-push-web-dev');
  const stepBlock = src.slice(idx, idx + 600);
  expect(stepBlock).toContain('perf-test');
});

// ── INV-3: no secrets in .drone.yml ─────────────────────────────────────────

it('[SPEC-DEPLOY-001/INV-3] .drone.yml has no hardcoded credentials', () => {
  const src = drone();
  // password: must be followed by newline (YAML block) — not an inline value
  expect(src).not.toMatch(/password: [^\s#]/);
  expect(src).not.toMatch(/api_key: [a-zA-Z0-9_-]{15,}/);
});
