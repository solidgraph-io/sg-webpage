/**
 * SPEC-DOCS-OKF-001/RF-5 — cross-links codemod (OKF §5.3, ADR-0015 Fase 3).
 * Tests the okf-link codemod (scripts/okf-link.ts) against synthetic bundles:
 * prose refs (SPEC-XXX, ADR-XXXX) become bundle-relative links that resolve;
 * code fences, inline code, existing links, self-refs and unresolved refs are
 * left untouched; the rewrite is idempotent and --check is warning-only.
 */
import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { applyLinks, checkLinks, buildIdMap } from '../../../../scripts/okf-link';

const ROOT = path.resolve(__dirname, '../../../..');
const CODEMOD = path.join(ROOT, 'scripts/okf-link.ts');
const TSX = path.join(ROOT, 'node_modules/.bin/tsx');

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});

const ROOT_INDEX = ['---', 'okf_version: "0.1"', '---', '', '# Bundle — ver SPEC-QA-001', ''].join(
  '\n',
);

function concept(body: string, description = 'A concept'): string {
  return `---\ntype: Spec\ntitle: "X"\ndescription: "${description}"\n---\n\n${body}`;
}

function makeBundle(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'okf-link-fixture-'));
  tmpDirs.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  return dir;
}

function read(dir: string, rel: string): string {
  return fs.readFileSync(path.join(dir, rel), 'utf-8');
}

/** Bundle with one spec, one ADR and one prompt exercising every zone rule. */
function standardBundle(): string {
  return makeBundle({
    'index.md': ROOT_INDEX,
    'specs/SPEC-QA-001.md': concept(
      '# SPEC-QA-001 — Gate\n\nEste doc es SPEC-QA-001 (auto-ref) y se apoya en ADR-0014.\n',
    ),
    'adr/0014-design-gate.md': concept(
      [
        '# ADR-0014 — Gate de diseño',
        '',
        'La spec SPEC-QA-001 define el gate. Segunda mención de SPEC-QA-001 aquí.',
        'Referencia inexistente: SPEC-NOPE-001 queda en prosa.',
        '',
        '```',
        'cita en fence: SPEC-QA-001',
        '```',
        '',
        'Inline: `SPEC-QA-001` intacto.',
      ].join('\n'),
    ),
    'prompts/10-foo.md': concept(
      [
        '# Prompt sobre SPEC-QA-001',
        '',
        'Ya enlazado: [SPEC-QA-001](/specs/SPEC-QA-001.md) no se duplica.',
        'Y ADR-0014 en prosa sí se enlaza.',
      ].join('\n'),
      'Prompt que cita SPEC-QA-001 en la description',
    ),
    'traceability.md': concept('# Matriz\n\nSPEC-QA-001 no se toca (la genera pnpm trace).\n'),
  });
}

// ── id map ────────────────────────────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-5] okf:link builds the ID → bundle-path map', () => {
  it('[SPEC-DOCS-OKF-001/RF-5] maps SPEC ids (filename) and ADR numbers (slug)', () => {
    const dir = standardBundle();
    const map = buildIdMap(dir);
    expect(map.get('SPEC-QA-001')).toBe('/specs/SPEC-QA-001.md');
    expect(map.get('ADR-0014')).toBe('/adr/0014-design-gate.md');
  });
});

// ── rewrite rules ─────────────────────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-5] okf:link rewrites prose refs into bundle links', () => {
  it('[SPEC-DOCS-OKF-001/RF-5] first prose mention per target → bundle-relative link', () => {
    const dir = standardBundle();
    applyLinks(dir);
    const adr = read(dir, 'adr/0014-design-gate.md');
    expect(adr).toContain('La spec [SPEC-QA-001](/specs/SPEC-QA-001.md) define el gate.');
    const spec = read(dir, 'specs/SPEC-QA-001.md');
    expect(spec).toContain('[ADR-0014](/adr/0014-design-gate.md)');
  });

  it('[SPEC-DOCS-OKF-001/RF-5] only the first mention per target is linked (una relación)', () => {
    const dir = standardBundle();
    applyLinks(dir);
    const adr = read(dir, 'adr/0014-design-gate.md');
    expect(adr).toContain('Segunda mención de SPEC-QA-001 aquí.');
    expect(adr.match(/\]\(\/specs\/SPEC-QA-001\.md\)/g)).toHaveLength(1);
  });

  it('[SPEC-DOCS-OKF-001/RF-5] code fences and inline code stay untouched', () => {
    const dir = standardBundle();
    applyLinks(dir);
    const adr = read(dir, 'adr/0014-design-gate.md');
    expect(adr).toContain('cita en fence: SPEC-QA-001\n');
    expect(adr).toContain('Inline: `SPEC-QA-001` intacto.');
  });

  it('[SPEC-DOCS-OKF-001/RF-5] already-linked targets are not re-linked nor nested', () => {
    const dir = standardBundle();
    applyLinks(dir);
    const prompt = read(dir, 'prompts/10-foo.md');
    expect(prompt).toContain('Ya enlazado: [SPEC-QA-001](/specs/SPEC-QA-001.md) no se duplica.');
    expect(prompt).not.toContain('[[');
    expect(prompt.match(/\]\(\/specs\/SPEC-QA-001\.md\)/g)).toHaveLength(1);
  });

  it('[SPEC-DOCS-OKF-001/RF-5] self-references stay in prose (un doc no se enlaza a sí mismo)', () => {
    const dir = standardBundle();
    applyLinks(dir);
    const spec = read(dir, 'specs/SPEC-QA-001.md');
    expect(spec).toContain('Este doc es SPEC-QA-001 (auto-ref)');
    expect(spec).not.toContain('[SPEC-QA-001](/specs/SPEC-QA-001.md)');
  });

  it('[SPEC-DOCS-OKF-001/RF-5] frontmatter and headings stay untouched', () => {
    const dir = standardBundle();
    applyLinks(dir);
    const prompt = read(dir, 'prompts/10-foo.md');
    expect(prompt).toContain('description: "Prompt que cita SPEC-QA-001 en la description"');
    expect(prompt).toContain('# Prompt sobre SPEC-QA-001\n');
    const adr = read(dir, 'adr/0014-design-gate.md');
    expect(adr).toContain('# ADR-0014 — Gate de diseño\n');
  });

  it('[SPEC-DOCS-OKF-001/RF-5] unresolved refs stay in prose and are reported as warnings', () => {
    const dir = standardBundle();
    const report = applyLinks(dir);
    const adr = read(dir, 'adr/0014-design-gate.md');
    expect(adr).toContain('Referencia inexistente: SPEC-NOPE-001 queda en prosa.');
    expect(report.unresolved).toEqual([{ file: 'adr/0014-design-gate.md', id: 'SPEC-NOPE-001' }]);
  });

  it('[SPEC-DOCS-OKF-001/RF-5] reserved files and traceability.md are never rewritten', () => {
    const dir = standardBundle();
    const before = { index: read(dir, 'index.md'), trace: read(dir, 'traceability.md') };
    applyLinks(dir);
    expect(read(dir, 'index.md')).toBe(before.index);
    expect(read(dir, 'traceability.md')).toBe(before.trace);
  });

  it('[SPEC-DOCS-OKF-001/RF-5] idempotent: second run changes nothing', () => {
    const dir = standardBundle();
    const first = applyLinks(dir);
    expect(first.changed.length).toBeGreaterThan(0);
    const second = applyLinks(dir);
    expect(second.changed).toEqual([]);
    expect(second.linked).toEqual([]);
  });
});

// ── check mode (warning-only) ─────────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-5] okf:link --check is warning-only', () => {
  it('[SPEC-DOCS-OKF-001/RF-5] lists linkable refs before, none after', () => {
    const dir = standardBundle();
    expect(checkLinks(dir).pending.length).toBeGreaterThan(0);
    applyLinks(dir);
    expect(checkLinks(dir).pending).toEqual([]);
  });

  it('[SPEC-DOCS-OKF-001/RF-5] CLI --check exits 0 even with pending refs (no gate duro)', () => {
    const dir = standardBundle();
    const pending = spawnSync(TSX, [CODEMOD, dir, '--check'], { encoding: 'utf-8', cwd: ROOT });
    expect(pending.status).toBe(0);
    expect(pending.stdout + pending.stderr).toContain('SPEC-QA-001');
  });
});

// ── wiring ────────────────────────────────────────────────────────────────────

describe('[SPEC-DOCS-OKF-001/RF-5] okf:link is wired as a root script', () => {
  it('[SPEC-DOCS-OKF-001/RF-5] package.json exposes pnpm okf:link', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['okf:link']).toContain('scripts/okf-link.ts');
  });
});
