/**
 * SPEC-INFRA-001/RF-6 — trace gate hardening (OKF Phase 2, step 0).
 *
 * Bug class under test: a docs/specs/SPEC-*.md whose filename does not parse
 * to a valid spec ID (e.g. compound domain SPEC-DOCS-OKF-001 before the fix)
 * was silently excluded from the matrix — its citations did not count and its
 * uncovered requirements never failed `pnpm trace -- --check`. No spec may be
 * invisible to the gate again.
 */
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseSpec, validateSpecFiles, CITATION_RE } from '../../../../scripts/trace';

const ROOT = path.resolve(__dirname, '../../../..');
const TRACE = path.join(ROOT, 'scripts/trace.ts');
const TSX = path.join(ROOT, 'node_modules/.bin/tsx');

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});

function makeSpecsRoot(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'trace-fixture-'));
  tmpDirs.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, 'docs', 'specs', rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  return dir;
}

const SPEC_BODY = '- **Estado:** Draft\n\n## Requisitos\n\n- **RF-1** — algo testeable.\n';

// ── compound spec domains parse ───────────────────────────────────────────────

describe('[SPEC-INFRA-001/RF-6] compound spec domains are visible to the gate', () => {
  it('[SPEC-INFRA-001/RF-6] parseSpec accepts compound domain (SPEC-DOCS-OKF-001)', () => {
    const root = makeSpecsRoot({ 'SPEC-DOCS-OKF-001.md': SPEC_BODY });
    const entry = parseSpec(path.join(root, 'docs/specs/SPEC-DOCS-OKF-001.md'));
    expect(entry?.specId).toBe('SPEC-DOCS-OKF-001');
    expect(entry?.requirements.map((r) => r.id)).toContain('RF-1');
  });

  it('[SPEC-INFRA-001/RF-6] parseSpec still accepts single-segment domains', () => {
    const root = makeSpecsRoot({ 'SPEC-INFRA-001.md': SPEC_BODY });
    const entry = parseSpec(path.join(root, 'docs/specs/SPEC-INFRA-001.md'));
    expect(entry?.specId).toBe('SPEC-INFRA-001');
  });

  it('[SPEC-INFRA-001/RF-6] parseSpec accepts digits inside the domain (SPEC-A11Y-001)', () => {
    const root = makeSpecsRoot({ 'SPEC-A11Y-001.md': SPEC_BODY });
    const entry = parseSpec(path.join(root, 'docs/specs/SPEC-A11Y-001.md'));
    expect(entry?.specId).toBe('SPEC-A11Y-001');
  });

  it('[SPEC-INFRA-001/RF-6] real SPEC-DOCS-OKF-001 parses with all its requirements', () => {
    const entry = parseSpec(path.join(ROOT, 'docs/specs/SPEC-DOCS-OKF-001.md'));
    expect(entry?.specId).toBe('SPEC-DOCS-OKF-001');
    const ids = entry?.requirements.map((r) => r.id) ?? [];
    for (const rf of ['RF-1', 'RF-7', 'RF-8', 'RNF-1', 'INV-1']) {
      expect(ids).toContain(rf);
    }
  });

  it('[SPEC-INFRA-001/RF-6] citation regex matches compound-domain citations', () => {
    // fictional IDs so these literals don't count as real coverage in the matrix
    const re = new RegExp(CITATION_RE.source, 'g');
    expect(re.exec("it('[SPEC-FOO-BAR-001/RF-9] …')")?.[1]).toBe('SPEC-FOO-BAR-001/RF-9');
    expect(new RegExp(CITATION_RE.source).exec("it('[SPEC-B2B-001/INV-9] …')")?.[1]).toBe(
      'SPEC-B2B-001/INV-9',
    );
  });
});

// ── invisible specs fail the gate ─────────────────────────────────────────────

describe('[SPEC-INFRA-001/RF-6] specs invisible to the matrix break trace --check', () => {
  it('[SPEC-INFRA-001/RF-6] unparseable spec filename → problem reported', () => {
    const root = makeSpecsRoot({ 'SPEC-NOPARSE.md': SPEC_BODY });
    const problems = validateSpecFiles([path.join(root, 'docs/specs/SPEC-NOPARSE.md')]);
    expect(problems.some((p) => p.includes('SPEC-NOPARSE.md'))).toBe(true);
  });

  it('[SPEC-INFRA-001/RF-6] spec with no recognized requirements → problem reported', () => {
    const root = makeSpecsRoot({
      'SPEC-EMPTY-001.md': '- **Estado:** Draft\n\nSin requisitos aún.\n',
    });
    const problems = validateSpecFiles([path.join(root, 'docs/specs/SPEC-EMPTY-001.md')]);
    expect(problems.some((p) => p.includes('SPEC-EMPTY-001.md'))).toBe(true);
  });

  it('[SPEC-INFRA-001/RF-6] SPEC-TEMPLATE.md and reserved files are exempt', () => {
    const root = makeSpecsRoot({
      'SPEC-TEMPLATE.md': SPEC_BODY,
      'index.md': '# Catalog\n',
      'log.md': '# Log\n',
    });
    const files = ['SPEC-TEMPLATE.md', 'index.md', 'log.md'].map((f) =>
      path.join(root, 'docs/specs', f),
    );
    expect(validateSpecFiles(files)).toEqual([]);
  });

  it('[SPEC-INFRA-001/RF-6] CLI: unparseable spec file → trace --check exits ≠ 0', () => {
    const root = makeSpecsRoot({ 'SPEC-NOPARSE.md': SPEC_BODY });
    const res = spawnSync(TSX, [TRACE, '--check'], { encoding: 'utf-8', cwd: root });
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain('SPEC-NOPARSE.md');
  });

  it('[SPEC-INFRA-001/RF-6] CLI: healthy Draft spec (uncovered) → trace --check exits 0', () => {
    const root = makeSpecsRoot({ 'SPEC-FOO-001.md': SPEC_BODY });
    const res = spawnSync(TSX, [TRACE, '--check'], { encoding: 'utf-8', cwd: root });
    expect(res.status).toBe(0);
  });
});
