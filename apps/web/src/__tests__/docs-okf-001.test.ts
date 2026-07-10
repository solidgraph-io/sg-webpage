/**
 * SPEC-DOCS-OKF-001 — docs/ as a conformant OKF Knowledge Bundle
 * Tests the okf-check checker (scripts/okf-check.ts) against synthetic
 * fixture bundles and the real docs/ bundle.
 */
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkBundle, TAXONOMY } from '../../../../scripts/okf-check';

const ROOT = path.resolve(__dirname, '../../../..');
const DOCS = path.join(ROOT, 'docs');
const CHECKER = path.join(ROOT, 'scripts/okf-check.ts');
const TSX = path.join(ROOT, 'node_modules/.bin/tsx');

// ── fixture helper ────────────────────────────────────────────────────────────

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});

function makeBundle(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'okf-fixture-'));
  tmpDirs.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  return dir;
}

const ROOT_INDEX = '---\nokf_version: "0.1"\n---\n\n# Bundle\n';
const VALID_CONCEPT = '---\ntype: Spec\ntitle: "X"\n---\n\n# X\n\nBody.\n';

// ── RF-1: root index.md declares okf_version ──────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-1] bundle root index.md with okf_version', () => {
  it('[SPEC-DOCS-OKF-001/RF-1] valid root index → no errors', () => {
    const dir = makeBundle({ 'index.md': ROOT_INDEX, 'specs/a.md': VALID_CONCEPT });
    expect(checkBundle(dir).errors).toEqual([]);
  });

  it('[SPEC-DOCS-OKF-001/RF-1] index.md without okf_version → hard error', () => {
    const dir = makeBundle({ 'index.md': '---\ntitle: "no version"\n---\n\n# Bundle\n' });
    const res = checkBundle(dir);
    expect(res.errors.some((e) => e.includes('okf_version'))).toBe(true);
  });

  it('[SPEC-DOCS-OKF-001/RF-1] missing root index.md → hard error', () => {
    const dir = makeBundle({ 'specs/a.md': VALID_CONCEPT });
    const res = checkBundle(dir);
    expect(res.errors.some((e) => e.includes('index.md'))).toBe(true);
  });

  it('[SPEC-DOCS-OKF-001/RF-1] real docs/index.md declares okf_version "0.1"', () => {
    const content = fs.readFileSync(path.join(DOCS, 'index.md'), 'utf-8');
    expect(content.startsWith('---')).toBe(true);
    expect(content).toContain('okf_version: "0.1"');
  });
});

// ── RF-2: parseable frontmatter in every non-reserved .md (hard) ──────────────

describe('[SPEC-DOCS-OKF-001/RF-2] parseable frontmatter on every concept', () => {
  it('[SPEC-DOCS-OKF-001/RF-2] concept without frontmatter → hard error', () => {
    const dir = makeBundle({ 'index.md': ROOT_INDEX, 'specs/bare.md': '# Bare\n\nNo fm.\n' });
    const res = checkBundle(dir);
    expect(res.errors.some((e) => e.includes('bare.md'))).toBe(true);
  });

  it('[SPEC-DOCS-OKF-001/RF-2] unparseable YAML frontmatter → hard error', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/broken.md': '---\ntype: [unclosed\n---\n\n# Broken\n',
    });
    const res = checkBundle(dir);
    expect(res.errors.some((e) => e.includes('broken.md'))).toBe(true);
  });

  it('[SPEC-DOCS-OKF-001/RF-2] real docs/ bundle has zero hard errors', () => {
    const res = checkBundle(DOCS);
    expect(res.errors).toEqual([]);
    expect(res.concepts).toBeGreaterThan(70); // specs + adr + prompts + numbered docs
  });
});

// ── RF-3: non-empty `type` (hard) ─────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-3] non-empty type in every concept', () => {
  it('[SPEC-DOCS-OKF-001/RF-3] frontmatter without type → hard error', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/untyped.md': '---\ntitle: "no type"\n---\n\n# Untyped\n',
    });
    const res = checkBundle(dir);
    expect(res.errors.some((e) => e.includes('untyped.md') && e.includes('type'))).toBe(true);
  });

  it('[SPEC-DOCS-OKF-001/RF-3] empty type → hard error', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/empty.md': '---\ntype: ""\n---\n\n# Empty\n',
    });
    expect(checkBundle(dir).errors.length).toBeGreaterThan(0);
  });
});

// ── RF-4: taxonomy (warning, permissive) ──────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-4] type outside taxonomy is a warning', () => {
  it('[SPEC-DOCS-OKF-001/RF-4] unknown type → warning, zero errors', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/odd.md': '---\ntype: Weird\n---\n\n# Odd\n',
    });
    const res = checkBundle(dir);
    expect(res.errors).toEqual([]);
    expect(res.warnings.some((w) => w.includes('Weird'))).toBe(true);
  });

  it('[SPEC-DOCS-OKF-001/RF-4] taxonomy matches SPEC-DOCS-OKF-001', () => {
    expect([...TAXONOMY]).toEqual([
      'Spec',
      'ADR',
      'Prompt',
      'Architecture',
      'Methodology',
      'Plan',
      'Runbook',
      'Index',
      'Reference',
    ]);
  });
});

// ── RF-5: bundle-relative links resolve (warning) ─────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-5] bundle-relative links must resolve', () => {
  it('[SPEC-DOCS-OKF-001/RF-5] broken /….md link → warning, zero errors', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/a.md': '---\ntype: Spec\n---\n\n# A\n\nSee [B](/specs/NO-EXISTE.md).\n',
    });
    const res = checkBundle(dir);
    expect(res.errors).toEqual([]);
    expect(res.warnings.some((w) => w.includes('NO-EXISTE.md'))).toBe(true);
  });

  it('[SPEC-DOCS-OKF-001/RF-5] resolving link (with anchor) → no warning', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/a.md': '---\ntype: Spec\n---\n\n# A\n\nSee [B](/specs/b.md#schema).\n',
      'specs/b.md': VALID_CONCEPT,
    });
    expect(checkBundle(dir).warnings).toEqual([]);
  });
});

// ── RF-6: exit codes — hard fails only on RF-1/RF-2/RF-3 ─────────────────────

describe('[SPEC-DOCS-OKF-001/RF-6] CLI exit codes', () => {
  const runCli = (bundle: string) =>
    spawnSync(TSX, [CHECKER, bundle], { encoding: 'utf-8', cwd: ROOT });

  it('[SPEC-DOCS-OKF-001/RF-6] hard violation (missing type) → exit ≠ 0', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/untyped.md': '---\ntitle: "x"\n---\n\n# X\n',
    });
    const res = runCli(dir);
    expect(res.status).not.toBe(0);
  });

  it('[SPEC-DOCS-OKF-001/RF-6] warnings only (unknown type + broken link) → exit 0', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/odd.md': '---\ntype: Weird\n---\n\n# Odd\n\n[gone](/nope.md)\n',
    });
    const res = runCli(dir);
    expect(res.status).toBe(0);
    expect(res.stderr).toContain('warn');
  });
});

// ── RF-7: okf:check wired as repo script (CI step lands in Phase 4) ───────────

describe('[SPEC-DOCS-OKF-001/RF-7] pnpm okf:check wiring', () => {
  it('[SPEC-DOCS-OKF-001/RF-7] root package.json exposes okf:check like trace', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['okf:check']).toContain('scripts/okf-check.ts');
    expect(pkg.scripts['trace']).toBeDefined(); // runs alongside trace
  });
});

// ── RNF-1: migration is additive — bodies preserved under frontmatter ─────────

describe('[SPEC-DOCS-OKF-001/RNF-1] additive migration', () => {
  it('[SPEC-DOCS-OKF-001/RNF-1] spec keeps its original body header below frontmatter', () => {
    const spec = fs.readFileSync(path.join(DOCS, 'specs/SPEC-DOCS-OKF-001.md'), 'utf-8');
    expect(spec.startsWith('---')).toBe(true);
    expect(spec).toContain('- **ID:** SPEC-DOCS-OKF-001'); // original header intact
    expect(spec).toContain('## Requisitos funcionales'); // original body intact
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

// ── RNF-2: minimal deps, fast ─────────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RNF-2] checker perf and dependencies', () => {
  it('[SPEC-DOCS-OKF-001/RNF-2] checkBundle(docs/) completes in < 2s', () => {
    const t0 = performance.now();
    checkBundle(DOCS);
    expect(performance.now() - t0).toBeLessThan(2000);
  });

  it('[SPEC-DOCS-OKF-001/RNF-2] checker imports only node builtins + yaml', () => {
    const src = fs.readFileSync(CHECKER, 'utf-8');
    const imports = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1] ?? '');
    expect(imports.length).toBeGreaterThan(0);
    for (const imp of imports) {
      expect(imp.startsWith('node:') || imp === 'yaml').toBe(true);
    }
  });
});

// ── RNF-3: permissive consumption ─────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RNF-3] permissive consumer', () => {
  it('[SPEC-DOCS-OKF-001/RNF-3] extra keys + unknown type + broken link → zero errors', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/x.md':
        '---\ntype: Custom\nspec_status: Draft\nepic: EPIC-X\n---\n\n# X\n\n[gone](/y.md)\n',
    });
    expect(checkBundle(dir).errors).toEqual([]);
  });
});

// ── INV-1: hard conformance minimum ───────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/INV-1] hard minimum breaks okf:check', () => {
  it('[SPEC-DOCS-OKF-001/INV-1] each hard rule violated → error reported', () => {
    const dir = makeBundle({
      // no index.md (RF-1), one bare concept (RF-2), one untyped (RF-3)
      'a.md': '# A\n',
      'b.md': '---\ntitle: "b"\n---\n\n# B\n',
    });
    const res = checkBundle(dir);
    expect(res.errors.length).toBe(3);
  });
});

// ── INV-2: reserved files are never concepts ──────────────────────────────────

describe('[SPEC-DOCS-OKF-001/INV-2] index.md / log.md reserved', () => {
  it('[SPEC-DOCS-OKF-001/INV-2] subdir index.md and log.md need no frontmatter', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      'specs/index.md': '# Catalog\n\n(no frontmatter — reserved)\n',
      'log.md': '# Log\n\n## 2026-07-09\n\n- adopted OKF\n',
      'specs/a.md': VALID_CONCEPT,
    });
    const res = checkBundle(dir);
    expect(res.errors).toEqual([]);
    expect(res.concepts).toBe(1); // only specs/a.md counts as a concept
  });
});

// ── INV-3: concept IDs are paths — moved docs surface as broken links ─────────

describe('[SPEC-DOCS-OKF-001/INV-3] renames surface via link resolution', () => {
  it('[SPEC-DOCS-OKF-001/INV-3] link to a moved concept path → RF-5 warning', () => {
    const dir = makeBundle({
      'index.md': ROOT_INDEX,
      // b.md moved to specs/b.md but a.md still links the old concept ID /b.md
      'specs/a.md': '---\ntype: Spec\n---\n\n# A\n\nSee [B](/b.md).\n',
      'specs/b.md': VALID_CONCEPT,
    });
    const res = checkBundle(dir);
    expect(res.warnings.some((w) => w.includes('/b.md'))).toBe(true);
    expect(res.errors).toEqual([]);
  });
});
