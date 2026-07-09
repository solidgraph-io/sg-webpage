/**
 * SPEC-DEPLOY-002 — Optimización del pipeline: build-once, gates en paralelo, promote-image
 *
 * Structural assertions against .drone.yml.
 * The pipeline itself is the live proof; these verify the build-once + parallel invariants.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const DRONE = path.join(ROOT, '.drone.yml');

function drone(): string {
  return fs.readFileSync(DRONE, 'utf-8');
}

function stepBlock(stepName: string, chars = 800): string {
  const src = drone();
  const idx = src.indexOf(`- name: ${stepName}\n`);
  if (idx === -1) throw new Error(`Step '${stepName}' not found in .drone.yml`);
  return src.slice(idx, idx + chars);
}

// ── RF-1: build una sola vez ──────────────────────────────────────────────────

describe('[SPEC-DEPLOY-002/RF-1] pipeline has exactly one pnpm build', () => {
  it('[SPEC-DEPLOY-002/RF-1] build step exists and runs pnpm build', () => {
    const src = drone();
    expect(src).toContain('- name: build\n');
    const block = stepBlock('build');
    expect(block).toContain('pnpm build');
  });

  it('[SPEC-DEPLOY-002/RF-1] visual-test step does not contain pnpm build', () => {
    expect(stepBlock('visual-test')).not.toContain('pnpm build');
  });

  it('[SPEC-DEPLOY-002/RF-1] a11y-test step does not contain pnpm build', () => {
    expect(stepBlock('a11y-test')).not.toContain('pnpm build');
  });

  it('[SPEC-DEPLOY-002/RF-1] perf-test step does not contain pnpm build', () => {
    expect(stepBlock('perf-test')).not.toContain('pnpm build');
  });

  it('[SPEC-DEPLOY-002/RF-1] visual-test and a11y-test do not reinstall (no pnpm install)', () => {
    // install-glibc handles the single glibc install; test steps skip reinstall.
    expect(stepBlock('visual-test')).not.toContain('pnpm install');
    expect(stepBlock('a11y-test')).not.toContain('pnpm install');
  });
});

// ── RF-2: gates en paralelo ───────────────────────────────────────────────────

describe('[SPEC-DEPLOY-002/RF-2] visual-test, a11y-test and perf-test run in parallel', () => {
  it('[SPEC-DEPLOY-002/RF-2] install-glibc step exists', () => {
    expect(drone()).toContain('- name: install-glibc\n');
  });

  it('[SPEC-DEPLOY-002/RF-2] install-glibc depends on build', () => {
    const block = stepBlock('install-glibc');
    expect(block).toContain('depends_on: [build]');
  });

  it('[SPEC-DEPLOY-002/RF-2] visual-test depends on install-glibc (not a11y-test)', () => {
    const block = stepBlock('visual-test');
    expect(block).toContain('depends_on: [install-glibc]');
    expect(block.slice(0, 200)).not.toContain('a11y-test');
  });

  it('[SPEC-DEPLOY-002/RF-2] a11y-test depends on install-glibc (parallel with visual)', () => {
    const block = stepBlock('a11y-test');
    expect(block).toContain('depends_on: [install-glibc]');
  });
});

// ── RF-3: perf fuera del camino crítico, pero bloqueante ─────────────────────

describe('[SPEC-DEPLOY-002/RF-3] perf-test runs parallel with visual/a11y, still blocks deploy', () => {
  it('[SPEC-DEPLOY-002/RF-3] perf-test depends on install-glibc (parallel)', () => {
    const block = stepBlock('perf-test');
    expect(block).toContain('depends_on: [install-glibc]');
  });

  it('[SPEC-DEPLOY-002/RF-3] perf-test only runs on develop/main push (still blocks prod)', () => {
    const block = stepBlock('perf-test');
    expect(block).toMatch(/branch:\s*\n\s*- develop/);
    expect(block).toMatch(/event:\s*\n\s*- push/);
  });

  it('[SPEC-DEPLOY-002/RF-3] build-push-web-dev depends on perf-test (blocks deploy)', () => {
    const block = stepBlock('build-push-web-dev');
    expect(block).toContain('perf-test');
  });
});

// ── RF-4: build-once → promote-image ─────────────────────────────────────────

describe('[SPEC-DEPLOY-002/RF-4] develop builds immutable image; promote stub for prod', () => {
  it('[SPEC-DEPLOY-002/RF-4] build-push-web-dev tags image with sha-DRONE_COMMIT_SHA', () => {
    const block = stepBlock('build-push-web-dev');
    expect(block).toContain('sha-${DRONE_COMMIT_SHA}');
  });

  it('[SPEC-DEPLOY-002/RF-4] promote-image stub is documented in .drone.yml', () => {
    // The stub is commented out (prod not active); its presence documents the upgrade path.
    expect(drone()).toContain('promote-image');
    expect(drone()).toContain('crane copy');
  });
});

// ── RF-5: caching ────────────────────────────────────────────────────────────

describe('[SPEC-DEPLOY-002/RF-5] Turbo remote cache configured for build step', () => {
  it('[SPEC-DEPLOY-002/RF-5] build step has TURBO_TOKEN env var', () => {
    const block = stepBlock('build');
    expect(block).toContain('TURBO_TOKEN');
  });

  it('[SPEC-DEPLOY-002/RF-5] build step has TURBO_TEAM env var', () => {
    const block = stepBlock('build');
    expect(block).toContain('TURBO_TEAM');
  });
});

// ── RF-6: paridad de bits dev↔prod ───────────────────────────────────────────

it('[SPEC-DEPLOY-002/RF-6] sha-DRONE_COMMIT_SHA tag used for immutable artifact in develop', () => {
  const block = stepBlock('build-push-web-dev');
  // sha-<SHA> is the certifiable, immutable tag that prod will promote
  expect(block).toContain('sha-${DRONE_COMMIT_SHA}');
  expect(block).not.toContain('- latest');
});

// ── RNF-1: sin bajar la barra (gates intactos) ───────────────────────────────

describe('[SPEC-DEPLOY-002/RNF-1] all quality gates remain present', () => {
  it('[SPEC-DEPLOY-002/RNF-1] visual-test step still in pipeline', () => {
    expect(drone()).toContain('- name: visual-test');
  });

  it('[SPEC-DEPLOY-002/RNF-1] a11y-test step still in pipeline', () => {
    expect(drone()).toContain('- name: a11y-test');
  });

  it('[SPEC-DEPLOY-002/RNF-1] perf-test step still in pipeline', () => {
    expect(drone()).toContain('- name: perf-test');
  });
});

// ── RNF-2: velocidad (parallelismo estructural) ───────────────────────────────

describe('[SPEC-DEPLOY-002/RNF-2] parallel gate structure reduces wall-clock', () => {
  it('[SPEC-DEPLOY-002/RNF-2] visual-test and a11y-test share the same depends_on (no serial chain)', () => {
    // Parallel: both wait for install-glibc, neither waits for the other.
    expect(stepBlock('visual-test')).toContain('depends_on: [install-glibc]');
    expect(stepBlock('a11y-test')).toContain('depends_on: [install-glibc]');
  });

  it('[SPEC-DEPLOY-002/RNF-2] perf-test also depends on install-glibc (not a11y or visual)', () => {
    const block = stepBlock('perf-test');
    expect(block).toContain('depends_on: [install-glibc]');
    // perf no longer waits for visual-test (was serial before)
    expect(block.slice(0, 150)).not.toContain('visual-test');
  });
});

// ── RNF-3: no romper prod ─────────────────────────────────────────────────────

it('[SPEC-DEPLOY-002/RNF-3] main still has build-push-web step (promote stub not activated)', () => {
  expect(drone()).toContain('- name: build-push-web\n');
  const block = stepBlock('build-push-web');
  expect(block).toMatch(/branch:\s*\n\s*- main/);
  expect(block).toContain('- latest');
});

// ── INV-1: build-once ────────────────────────────────────────────────────────

it('[SPEC-DEPLOY-002/INV-1] exactly one pnpm build command in the pipeline', () => {
  const src = drone();
  // Count lines that contain `pnpm build` (not pnpm build && ... locally)
  const buildLines = src.split('\n').filter((l) => l.trim() === '- pnpm build');
  expect(buildLines.length).toBe(1);
});

// ── INV-2: promote, not rebuild (stub) ───────────────────────────────────────

it('[SPEC-DEPLOY-002/INV-2] promote-image stub is commented out (prod not active)', () => {
  const src = drone();
  // The stub must exist but be commented out (starts with #)
  const idx = src.indexOf('promote-image');
  expect(idx).toBeGreaterThan(-1);
  const lineStart = src.lastIndexOf('\n', idx) + 1;
  const line = src.slice(lineStart, src.indexOf('\n', lineStart));
  // Line must be a YAML comment (starts with spaces + #)
  expect(line.trim()).toMatch(/^#/);
});

// ── INV-3: gates intactos ────────────────────────────────────────────────────

it('[SPEC-DEPLOY-002/INV-3] fidelity + a11y still block certification (not relaxed)', () => {
  // Both gates are present AND build-push steps depend on them
  const pushDevBlock = stepBlock('build-push-web-dev');
  expect(pushDevBlock).toContain('visual-test');
  expect(pushDevBlock).toContain('a11y-test');
  const pushMainBlock = stepBlock('build-push-web');
  expect(pushMainBlock).toContain('visual-test');
  expect(pushMainBlock).toContain('a11y-test');
});
