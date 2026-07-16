/**
 * SPEC-DOCS-OKF-001 — docs/ as a conformant OKF Knowledge Bundle.
 *
 * Integration suite (ADR-0016 Fase 5.2): sg-webpage consumes
 * @solidgraph-io/okf-tools — the tool's unit tests live in that package
 * (sg-okf-tools). Here the CONSUMER asserts that its own bundle conforms,
 * by running the package's CLI against the real docs/.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, type SpawnSyncReturns } from 'node:child_process';

const ROOT = path.resolve(__dirname, '../../../..');
const DOCS = path.join(ROOT, 'docs');
const OKF = path.join(ROOT, 'node_modules/.bin/okf');

function okf(...args: string[]): SpawnSyncReturns<string> {
  return spawnSync(OKF, args, { encoding: 'utf-8', cwd: ROOT });
}

// One run per command, shared by the assertions below.
const t0 = performance.now();
const check = okf('check', DOCS);
const checkMs = performance.now() - t0;
const indexCheck = okf('index', DOCS, '--check');
const linkCheck = okf('link', DOCS, '--check');
const out = (r: SpawnSyncReturns<string>): string => r.stdout + r.stderr;

// ── RF-1: root index.md declares okf_version; bundle passes check ─────────────

describe('[SPEC-DOCS-OKF-001/RF-1] bundle root declares okf_version', () => {
  it('[SPEC-DOCS-OKF-001/RF-1] docs/index.md opens with frontmatter carrying okf_version "0.1"', () => {
    const content = fs.readFileSync(path.join(DOCS, 'index.md'), 'utf-8');
    expect(content.startsWith('---')).toBe(true);
    expect(content).toContain('okf_version: "0.1"');
    expect(check.status).toBe(0);
    expect(out(check)).not.toContain('[RF-1]');
  });
});

// ── RF-2 / RF-3: every concept has parseable frontmatter + non-empty type ─────

describe('[SPEC-DOCS-OKF-001/RF-2] parseable frontmatter on every concept', () => {
  it('[SPEC-DOCS-OKF-001/RF-2] okf check reports zero hard errors on docs/', () => {
    expect(check.status).toBe(0);
    expect(out(check)).toMatch(/ 0 error\(s\)/);
    expect(out(check)).not.toContain('[RF-2]');
  });
});

describe('[SPEC-DOCS-OKF-001/RF-3] non-empty type in every concept', () => {
  it('[SPEC-DOCS-OKF-001/RF-3] no missing/empty `type` in the bundle', () => {
    expect(out(check)).not.toContain('[RF-3]');
  });
});

// ── RF-4 / RF-5: taxonomy + resolving links (clean bundle → no warnings) ──────

describe('[SPEC-DOCS-OKF-001/RF-4] types stay inside the project taxonomy', () => {
  it('[SPEC-DOCS-OKF-001/RF-4] no taxonomy warnings on docs/', () => {
    expect(out(check)).not.toContain('[RF-4]');
  });
});

describe('[SPEC-DOCS-OKF-001/RF-5] bundle-relative links resolve', () => {
  it('[SPEC-DOCS-OKF-001/RF-5] no broken-link warnings on docs/', () => {
    expect(out(check)).not.toContain('[RF-5]');
  });

  it('[SPEC-DOCS-OKF-001/INV-3] a real cross-link target exists (concept IDs are paths)', () => {
    const spec = fs.readFileSync(path.join(DOCS, 'specs/SPEC-SEC-010.md'), 'utf-8');
    const target = /\]\((\/[^)#\s]+\.md)\)/.exec(spec)?.[1];
    expect(target).toBeTruthy();
    expect(fs.existsSync(path.join(DOCS, target ?? ''))).toBe(true);
  });
});

// ── RF-6 / INV-1: exit codes — hard minimum fails, permissive stays green ─────

describe('[SPEC-DOCS-OKF-001/RF-6] CLI exit codes', () => {
  it('[SPEC-DOCS-OKF-001/RF-6][SPEC-DOCS-OKF-001/INV-1] hard violation → exit ≠ 0; conformant docs/ → exit 0', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'okf-consumer-fixture-'));
    try {
      fs.mkdirSync(path.join(dir, 'specs'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.md'), '---\nokf_version: "0.1"\n---\n\n# B\n');
      fs.writeFileSync(path.join(dir, 'specs/untyped.md'), '---\ntitle: "x"\n---\n\n# X\n');
      expect(okf('check', dir).status).not.toBe(0); // INV-1: hard minimum breaks the gate
      expect(check.status).toBe(0); // our bundle passes
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ── RF-7: wiring — scripts point at the package CLI; CI keeps its own step ────

describe('[SPEC-DOCS-OKF-001/RF-7] pnpm okf:* wired to @solidgraph-io/okf-tools', () => {
  it('[SPEC-DOCS-OKF-001/RF-7] root package.json consumes the CLI with an exact-pinned devDep', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.scripts['okf:check']).toBe('okf check');
    expect(pkg.scripts['okf:index']).toBe('okf index');
    expect(pkg.scripts['okf:link']).toBe('okf link');
    // beta channel: exact pin (SemVer ranges do not resolve prereleases)
    expect(pkg.devDependencies['@solidgraph-io/okf-tools']).toMatch(/^\d+\.\d+\.\d+-beta\.\d+$/);
    expect(pkg.scripts['trace']).toBeDefined(); // trace stays local (its own gate)
  });

  it('[SPEC-DOCS-OKF-001/RF-7] CI runs okf:check + okf:index --check in its own step', () => {
    const drone = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
    const idx = drone.indexOf('- name: okf-check\n');
    expect(idx).toBeGreaterThan(-1);
    const block = drone.slice(idx, idx + 500);
    expect(block).toContain('pnpm okf:check');
    expect(block).toContain('pnpm okf:index -- --check');
    expect(block).not.toContain('pnpm build'); // its own step, not the app build
  });

  it('[SPEC-DOCS-OKF-001/RF-7] build (and thus deploy) is gated on okf-check', () => {
    const drone = fs.readFileSync(path.join(ROOT, '.drone.yml'), 'utf-8');
    const idx = drone.indexOf('- name: build\n');
    const block = drone.slice(idx, idx + 300);
    expect(block).toContain('okf-check');
  });
});

// ── RF-8: progressive-disclosure indexes are present and fresh ────────────────

describe('[SPEC-DOCS-OKF-001/RF-8] per-directory indexes up to date', () => {
  it('[SPEC-DOCS-OKF-001/RF-8] okf index --check passes (no stale index)', () => {
    expect(out(indexCheck)).not.toContain('STALE');
    expect(indexCheck.status).toBe(0);
  });

  it('[SPEC-DOCS-OKF-001/RF-8] every non-empty docs/ subdir has its index.md', () => {
    for (const sub of ['specs', 'adr', 'prompts', 'deploy']) {
      expect(fs.existsSync(path.join(DOCS, sub, 'index.md'))).toBe(true);
    }
  });
});

// ── RNF-1: migration stayed additive — original bodies preserved ──────────────

describe('[SPEC-DOCS-OKF-001/RNF-1] additive migration', () => {
  it('[SPEC-DOCS-OKF-001/RNF-1] spec keeps its original body header below frontmatter', () => {
    const spec = fs.readFileSync(path.join(DOCS, 'specs/SPEC-DOCS-OKF-001.md'), 'utf-8');
    expect(spec.startsWith('---')).toBe(true);
    expect(spec).toContain('- **ID:** SPEC-DOCS-OKF-001');
    expect(spec).toContain('## Requisitos funcionales');
  });

  it('[SPEC-DOCS-OKF-001/RNF-1] ADR keeps its Estado header below frontmatter', () => {
    const adr = fs.readFileSync(
      path.join(DOCS, 'adr/0015-adopt-open-knowledge-format-okf.md'),
      'utf-8',
    );
    expect(adr.startsWith('---')).toBe(true);
    expect(adr).toContain('- **Estado:** Accepted');
  });
});

// ── RNF-2: the conformance run stays fast ─────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RNF-2] checker perf', () => {
  it('[SPEC-DOCS-OKF-001/RNF-2] okf check over docs/ completes in < 2s', () => {
    expect(check.status).toBe(0);
    expect(checkMs).toBeLessThan(2000);
  });
});

// ── RNF-3: permissive consumption — warnings never break the gate ─────────────

describe('[SPEC-DOCS-OKF-001/RNF-3] permissive consumer', () => {
  it('[SPEC-DOCS-OKF-001/RNF-3] okf link --check exits 0 despite known unresolved refs', () => {
    // Historical prompts keep dead refs on purpose (prompt 52 hygiene decision);
    // they surface as warnings and must never break the gate.
    expect(linkCheck.status).toBe(0);
    expect(out(linkCheck)).toMatch(/unresolved/);
  });
});

// ── INV-2: reserved files are never concepts ──────────────────────────────────

describe('[SPEC-DOCS-OKF-001/INV-2] index.md / log.md reserved', () => {
  it('[SPEC-DOCS-OKF-001/INV-2] docs/log.md carries no frontmatter and ISO-dated entries', () => {
    const log = fs.readFileSync(path.join(DOCS, 'log.md'), 'utf-8');
    expect(log.startsWith('---')).toBe(false);
    expect(log).toMatch(/\*\*\d{4}-\d{2}-\d{2}\*\*/);
  });

  it('[SPEC-DOCS-OKF-001/INV-2] generated indexes never list reserved files', () => {
    for (const sub of ['specs', 'adr', 'prompts', 'deploy']) {
      const idx = fs.readFileSync(path.join(DOCS, sub, 'index.md'), 'utf-8');
      expect(idx).not.toContain('(log.md)');
      expect(idx).not.toContain('(index.md)');
    }
  });
});
