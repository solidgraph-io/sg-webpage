/**
 * SPEC-DOCS-OKF-001/RF-8 — progressive-disclosure indexes (OKF §6).
 * Tests the okf-index generator (scripts/okf-index.ts) against synthetic
 * bundles and the real docs/ bundle, plus the RF-8 warning in okf-check.
 */
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { applyIndexes, checkIndexes, GENERATED_MARK } from '../../../../scripts/okf-index';
import { checkBundle } from '../../../../scripts/okf-check';

const ROOT = path.resolve(__dirname, '../../../..');
const DOCS = path.join(ROOT, 'docs');
const GENERATOR = path.join(ROOT, 'scripts/okf-index.ts');
const TSX = path.join(ROOT, 'node_modules/.bin/tsx');

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});

const ROOT_INDEX = [
  '---',
  'okf_version: "0.1"',
  '---',
  '',
  '# Bundle',
  '',
  '## Secciones',
  '',
  '<!-- okf:index:start -->',
  '<!-- okf:index:end -->',
  '',
].join('\n');

function concept(title: string, description?: string): string {
  const desc = description ? `\ndescription: "${description}"` : '';
  return `---\ntype: Spec\ntitle: "${title}"${desc}\n---\n\n# ${title}\n`;
}

function makeBundle(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'okf-index-fixture-'));
  tmpDirs.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  return dir;
}

function standardBundle(): string {
  return makeBundle({
    'index.md': ROOT_INDEX,
    'specs/SPEC-B-001.md': concept('Spec B', 'Second spec'),
    'specs/SPEC-A-001.md': concept('Spec A', 'First spec'),
    'specs/log.md': '# Log\n\n## 2026-07-10\n\n- x\n',
    'adr/0001-decision.md': concept('ADR 1'),
    'empty-dir/notes.txt': 'not markdown',
  });
}

// ── generation ────────────────────────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-8] okf:index generates per-directory indexes', () => {
  it('[SPEC-DOCS-OKF-001/RF-8] every non-empty subdir gets an index.md with the marker', () => {
    const dir = standardBundle();
    applyIndexes(dir);
    for (const sub of ['specs', 'adr']) {
      const idx = fs.readFileSync(path.join(dir, sub, 'index.md'), 'utf-8');
      expect(idx).toContain(GENERATED_MARK);
    }
    // subdir without .md concepts needs no index
    expect(fs.existsSync(path.join(dir, 'empty-dir/index.md'))).toBe(false);
  });

  it('[SPEC-DOCS-OKF-001/RF-8] sub-indexes carry no frontmatter (INV-2) and list concepts sorted', () => {
    const dir = standardBundle();
    applyIndexes(dir);
    const idx = fs.readFileSync(path.join(dir, 'specs/index.md'), 'utf-8');
    expect(idx.startsWith('---')).toBe(false);
    expect(idx).toContain('* [Spec A](SPEC-A-001.md) - First spec');
    expect(idx).toContain('* [Spec B](SPEC-B-001.md) - Second spec');
    expect(idx.indexOf('SPEC-A-001.md')).toBeLessThan(idx.indexOf('SPEC-B-001.md'));
    // reserved files are never listed
    expect(idx).not.toContain('log.md');
    expect(idx).not.toContain('(index.md)');
  });

  it('[SPEC-DOCS-OKF-001/RF-8] concept without description → bare bullet', () => {
    const dir = standardBundle();
    applyIndexes(dir);
    const idx = fs.readFileSync(path.join(dir, 'adr/index.md'), 'utf-8');
    expect(idx).toContain('* [ADR 1](0001-decision.md)');
  });

  it('[SPEC-DOCS-OKF-001/RF-8] root index managed block links every sub-index', () => {
    const dir = standardBundle();
    applyIndexes(dir);
    const root = fs.readFileSync(path.join(dir, 'index.md'), 'utf-8');
    expect(root).toContain('](/specs/index.md)');
    expect(root).toContain('](/adr/index.md)');
    // frontmatter + prose outside the managed block survive
    expect(root.startsWith('---\nokf_version: "0.1"')).toBe(true);
    expect(root).toContain('# Bundle');
  });

  it('[SPEC-DOCS-OKF-001/RF-8] generation is idempotent (second run changes nothing)', () => {
    const dir = standardBundle();
    const first = applyIndexes(dir);
    expect(first.length).toBeGreaterThan(0);
    expect(applyIndexes(dir)).toEqual([]);
  });
});

// ── check mode ────────────────────────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-8] okf:index --check detects stale indexes', () => {
  it('[SPEC-DOCS-OKF-001/RF-8] stale before generating, clean after', () => {
    const dir = standardBundle();
    expect(checkIndexes(dir).length).toBeGreaterThan(0);
    applyIndexes(dir);
    expect(checkIndexes(dir)).toEqual([]);
  });

  it('[SPEC-DOCS-OKF-001/RF-8] CLI: stale → exit ≠ 0; fresh → exit 0', () => {
    const dir = standardBundle();
    const stale = spawnSync(TSX, [GENERATOR, dir, '--check'], { encoding: 'utf-8', cwd: ROOT });
    expect(stale.status).not.toBe(0);
    applyIndexes(dir);
    const fresh = spawnSync(TSX, [GENERATOR, dir, '--check'], { encoding: 'utf-8', cwd: ROOT });
    expect(fresh.status).toBe(0);
  });
});

// ── RF-8 warning in okf-check ─────────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-8] okf:check warns on missing sub-indexes', () => {
  it('[SPEC-DOCS-OKF-001/RF-8] non-empty subdir without index.md → warning, zero errors', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/SPEC-A-001.md': concept('A'),
    });
    const res = checkBundle(dir);
    expect(res.errors).toEqual([]);
    expect(res.warnings.some((w) => w.includes('specs') && w.includes('index.md'))).toBe(true);
  });

  it('[SPEC-DOCS-OKF-001/RF-8] subdir with index.md → no RF-8 warning', () => {
    const dir = standardBundle();
    applyIndexes(dir);
    expect(checkBundle(dir).warnings).toEqual([]);
  });
});

// ── real bundle ───────────────────────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-8] real docs/ bundle has fresh indexes', () => {
  it('[SPEC-DOCS-OKF-001/RF-8] every docs/ subdir index exists and none is stale', () => {
    for (const sub of ['specs', 'adr', 'prompts', 'deploy']) {
      expect(fs.existsSync(path.join(DOCS, sub, 'index.md'))).toBe(true);
    }
    expect(checkIndexes(DOCS)).toEqual([]);
  });

  it('[SPEC-DOCS-OKF-001/RF-8] okf:index is wired as a root script', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['okf:index']).toContain('scripts/okf-index.ts');
  });
});
