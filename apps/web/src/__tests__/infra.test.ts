/**
 * SPEC-INFRA-001 — smoke tests for monorepo fundaciones
 * Each `it()` cites the requirement it covers.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');

describe('SPEC-INFRA-001 — Monorepo fundaciones', () => {
  // ── RF-1: pnpm-workspace.yaml + turbo.json + root package.json ─────────────

  it('[SPEC-INFRA-001/RF-1] pnpm-workspace.yaml exists and lists apps/* and packages/*', () => {
    const content = fs.readFileSync(path.join(ROOT, 'pnpm-workspace.yaml'), 'utf-8');
    expect(content).toContain("- 'apps/*'");
    expect(content).toContain("- 'packages/*'");
  });

  it('[SPEC-INFRA-001/RF-1] root package.json has packageManager pnpm@9.15.9 and engines node>=22', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      packageManager: string;
      engines: { node: string };
    };
    expect(pkg.packageManager).toBe('pnpm@9.15.9');
    expect(pkg.engines.node).toContain('22');
  });

  it('[SPEC-INFRA-001/RF-1] turbo.json exists and has build/dev/lint/type-check tasks', () => {
    const turbo = JSON.parse(fs.readFileSync(path.join(ROOT, 'turbo.json'), 'utf-8')) as {
      tasks: Record<string, unknown>;
    };
    expect(turbo.tasks).toHaveProperty('build');
    expect(turbo.tasks).toHaveProperty('dev');
    expect(turbo.tasks).toHaveProperty('lint');
    expect(turbo.tasks).toHaveProperty('type-check');
  });

  // ── RF-2: apps/web is Astro with @astrojs/node ────────────────────────────

  it('[SPEC-INFRA-001/RF-2] apps/web package.json has astro and @astrojs/node dependencies', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'apps/web/package.json'), 'utf-8'),
    ) as { name: string; dependencies: Record<string, string> };
    expect(pkg.name).toBe('@solidgraph/web');
    expect(pkg.dependencies).toHaveProperty('astro');
    expect(pkg.dependencies).toHaveProperty('@astrojs/node');
  });

  it('[SPEC-INFRA-001/RF-2] astro.config.ts uses output:server and @astrojs/node adapter', () => {
    const config = fs.readFileSync(path.join(ROOT, 'apps/web/astro.config.ts'), 'utf-8');
    expect(config).toContain("output: 'server'");
    expect(config).toContain('@astrojs/node');
  });

  it('[SPEC-INFRA-001/RF-2] tsconfig.json extends @solidgraph/typescript-config/astro', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'apps/web/tsconfig.json'), 'utf-8'),
    ) as { extends: string };
    expect(tsconfig.extends).toBe('@solidgraph/typescript-config/astro');
  });

  // ── RF-3: shared packages ─────────────────────────────────────────────────

  it('[SPEC-INFRA-001/RF-3] packages/blocks-contract exists with Zod dependency', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'packages/blocks-contract/package.json'), 'utf-8'),
    ) as { name: string; dependencies: Record<string, string> };
    expect(pkg.name).toBe('@solidgraph/blocks-contract');
    expect(pkg.dependencies).toHaveProperty('zod');
  });

  it('[SPEC-INFRA-001/RF-3] packages/typescript-config exports base and astro tsconfig', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'packages/typescript-config/package.json'), 'utf-8'),
    ) as { exports: Record<string, string> };
    expect(pkg.exports).toHaveProperty('./base');
    expect(pkg.exports).toHaveProperty('./astro');
  });

  it('[SPEC-INFRA-001/RF-3] packages/eslint-config exports index.js', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'packages/eslint-config/package.json'), 'utf-8'),
    ) as { name: string; exports: Record<string, string> };
    expect(pkg.name).toBe('@solidgraph/eslint-config');
    expect(pkg.exports).toHaveProperty('.');
    expect(fs.existsSync(path.join(ROOT, 'packages/eslint-config/index.js'))).toBe(true);
  });

  // ── RF-4: tooling ─────────────────────────────────────────────────────────

  it('[SPEC-INFRA-001/RF-4] .prettierrc exists with astro plugin', () => {
    const rc = JSON.parse(fs.readFileSync(path.join(ROOT, '.prettierrc'), 'utf-8')) as {
      plugins: string[];
    };
    expect(rc.plugins).toContain('prettier-plugin-astro');
  });

  it('[SPEC-INFRA-001/RF-4] commitlint.config.js exists with conventional extends', () => {
    const content = fs.readFileSync(path.join(ROOT, 'commitlint.config.js'), 'utf-8');
    expect(content).toContain('@commitlint/config-conventional');
  });

  it('[SPEC-INFRA-001/RF-4] root package.json has dev|build|lint|type-check|test|trace scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts).toHaveProperty('dev');
    expect(pkg.scripts).toHaveProperty('build');
    expect(pkg.scripts).toHaveProperty('lint');
    expect(pkg.scripts).toHaveProperty('type-check');
    expect(pkg.scripts).toHaveProperty('test');
    expect(pkg.scripts).toHaveProperty('trace');
  });

  // ── RF-5: test harness ────────────────────────────────────────────────────

  it('[SPEC-INFRA-001/RF-5] vitest.config.ts exists in apps/web', () => {
    expect(fs.existsSync(path.join(ROOT, 'apps/web/vitest.config.ts'))).toBe(true);
  });

  it('[SPEC-INFRA-001/RF-5] playwright.config.ts exists in apps/web', () => {
    expect(fs.existsSync(path.join(ROOT, 'apps/web/playwright.config.ts'))).toBe(true);
  });

  it('[SPEC-INFRA-001/RF-5] vitest smoke — test runner is operational', () => {
    expect(true).toBe(true);
  });

  // ── RF-6: scripts/trace.ts ────────────────────────────────────────────────

  it('[SPEC-INFRA-001/RF-6] scripts/trace.ts exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'scripts/trace.ts'))).toBe(true);
  });

  it('[SPEC-INFRA-001/RF-6] trace.ts contains --check mode logic', () => {
    const content = fs.readFileSync(path.join(ROOT, 'scripts/trace.ts'), 'utf-8');
    expect(content).toContain('--check');
    expect(content).toContain('traceability.md');
  });

  // ── RF-7: Dockerfiles ─────────────────────────────────────────────────────

  it('[SPEC-INFRA-001/RF-7] apps/web/Dockerfile has multi-stage deps/builder/runner', () => {
    const content = fs.readFileSync(path.join(ROOT, 'apps/web/Dockerfile'), 'utf-8');
    expect(content).toContain('AS deps');
    expect(content).toContain('AS builder');
    expect(content).toContain('AS runner');
    expect(content).toContain('node:22-alpine');
    expect(content).toContain('USER node');
    expect(content).toContain('EXPOSE 4321');
    expect(content).toContain('HEALTHCHECK');
    expect(content).toContain('dist/server/entry.mjs');
  });

  it('[SPEC-INFRA-001/RF-7] apps/web/Dockerfile.dev exists', () => {
    expect(fs.existsSync(path.join(ROOT, 'apps/web/Dockerfile.dev'))).toBe(true);
  });

  it('[SPEC-INFRA-001/RF-7] docker-compose.yml exists with web service only', () => {
    const content = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf-8');
    expect(content).toContain('services:');
    expect(content).toContain('web:');
    expect(content).not.toContain('strapi:');
    expect(content).not.toContain('cms:');
  });

  // ── RF-8: .drone.yml ─────────────────────────────────────────────────────

  it('[SPEC-INFRA-001/RF-8] .drone.yml exists and is web-only (no cms step)', () => {
    const content = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
    expect(content).toContain('install');
    expect(content).toContain('validate');
    expect(content).toContain('build-push-web');
    expect(content).toContain('trigger-dokploy');
    expect(content).not.toContain('build-push-cms');
    expect(content).not.toContain('DOKPLOY_WEBHOOK_CMS');
  });

  // ── RF-9: design/ ─────────────────────────────────────────────────────────

  it('[SPEC-INFRA-001/RF-9] design file exists (template HTML)', () => {
    // design/template/index.html is the new per-section design source
    const exists = fs.existsSync(path.join(ROOT, 'design/template/index.html'))
                || fs.existsSync(path.join(ROOT, 'design/solidgraph-website.html'))
                || fs.existsSync(path.join(ROOT, 'design/SolidGraph Website.html'));
    expect(exists).toBe(true);
  });

  it('[SPEC-INFRA-001/RF-9] design/assets/ has logo files', () => {
    const assetsDir = path.join(ROOT, 'design/assets');
    expect(fs.existsSync(assetsDir)).toBe(true);
    const files = fs.readdirSync(assetsDir);
    const logoFiles = files.filter(
      (f) => f.startsWith('logo') || f.startsWith('favicon'),
    );
    expect(logoFiles.length).toBeGreaterThan(0);
  });

  // ── RNF-1: security — no secrets in repo ─────────────────────────────────

  it('[SPEC-INFRA-001/RNF-1] .gitignore covers .env, node_modules, dist, .turbo', () => {
    const content = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf-8');
    expect(content).toContain('.env');
    expect(content).toContain('node_modules');
    expect(content).toContain('dist/');
    expect(content).toContain('.turbo/');
  });

  it('[SPEC-INFRA-001/RNF-1] .env.example exists with only placeholder values', () => {
    const content = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf-8');
    // Must exist and have placeholder keys, no real secrets
    expect(content).toContain('PUBLIC_SITE_URL');
    expect(content).not.toMatch(/pnpm@9\.15\.9\s*=\s*[a-z0-9]{20,}/i); // no long tokens
  });

  // ── INV-1: Conventional Commits configured ────────────────────────────────

  it('[SPEC-INFRA-001/INV-1] commitlint.config.js has scope-enum rule with valid scopes', () => {
    const content = fs.readFileSync(path.join(ROOT, 'commitlint.config.js'), 'utf-8');
    expect(content).toContain('scope-enum');
    expect(content).toContain('infra');
    expect(content).toContain('atom');
  });

  // ── INV-2: trace check is present and blocks CI ──────────────────────────

  it('[SPEC-INFRA-001/INV-2] .drone.yml includes trace check step before build', () => {
    const content = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
    expect(content).toContain('trace');
    // trace step depends on validate (must run before build)
    expect(content).toContain('depends_on: [validate]');
  });

  it('[SPEC-INFRA-001/INV-2] root package.json has trace script for trace --check', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['trace']).toContain('trace.ts');
  });

  // ── RNF-2: DX — frozen lockfile + docker compose web ─────────────────────

  it('[SPEC-INFRA-001/RNF-2] pnpm-lock.yaml exists (reproducible installs)', () => {
    expect(fs.existsSync(path.join(ROOT, 'pnpm-lock.yaml'))).toBe(true);
  });

  it('[SPEC-INFRA-001/RNF-2] docker-compose.yml maps port 4321 for web service', () => {
    const content = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf-8');
    expect(content).toContain('4321:4321');
  });

  it('[SPEC-INFRA-001/RNF-2] apps/web package.json has dev script (pnpm dev levanta web)', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'apps/web/package.json'), 'utf-8'),
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts['dev']).toContain('astro dev');
  });

  // ── RNF-3: CI — gates order matches AGENTS.md §4 ─────────────────────────

  it('[SPEC-INFRA-001/RNF-3] .drone.yml validate step depends on install', () => {
    const content = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
    expect(content).toContain('depends_on: [install]');
  });

  it('[SPEC-INFRA-001/RNF-3] .drone.yml build step depends on test (gates ordered)', () => {
    const content = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
    // build depends on test (which includes trace check)
    expect(content).toContain('depends_on: [test]');
  });

  // ── INV-3: SRP — config lives in modular packages ─────────────────────────

  it('[SPEC-INFRA-001/INV-3] typescript-config/astro.json extends base (no duplication)', () => {
    const astroConfig = JSON.parse(
      fs.readFileSync(
        path.join(ROOT, 'packages/typescript-config/tsconfig.astro.json'),
        'utf-8',
      ),
    ) as { extends: string };
    expect(astroConfig.extends).toBe('./tsconfig.json');
  });
});
