#!/usr/bin/env tsx
/**
 * scripts/trace.ts — Spec ↔ Test Traceability (SPEC-INFRA-001/RF-6)
 *
 * Usage:
 *   pnpm trace                 generate docs/traceability.md
 *   pnpm trace -- --check      also fail with exit 1 if any Approved spec has uncovered reqs
 *
 * Algorithm:
 *   1. Scan docs/specs/*.md → extract spec ID, status, and requirement IDs (RF-x, RNF-x, INV-x)
 *   2. Scan apps/web/src/__tests__ and scripts/ for citations [SPEC-XXX/REQ-y]
 *   3. Cross-reference: collect covered/uncovered per spec
 *   4. Write docs/traceability.md
 *   5. In --check mode: exit 1 if any Approved spec has ≥1 uncovered requirement
 */

import fs from 'node:fs';
import path from 'node:path';

// Script is always run from the monorepo root (pnpm -w run trace)
const ROOT = process.cwd();
const SPECS_DIR = path.join(ROOT, 'docs', 'specs');
const OUTPUT_FILE = path.join(ROOT, 'docs', 'traceability.md');

const CHECK_MODE = process.argv.includes('--check');

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpecRequirement {
  id: string; // e.g. RF-1, RNF-2, INV-3
  label: string; // full label from spec e.g. "**RF-1**"
  covered: boolean;
  coveredBy: string[]; // test file + line references
}

interface SpecEntry {
  file: string;
  specId: string; // e.g. SPEC-INFRA-001
  status: string; // Draft | Review | Approved | Implemented | Verified
  requirements: SpecRequirement[];
}

// ─── Parse specs ──────────────────────────────────────────────────────────────

function parseSpec(filePath: string): SpecEntry | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.md');

  // Extract spec ID from filename (e.g. SPEC-INFRA-001)
  const idMatch = /^(SPEC-[A-Z]+-\d+)/.exec(fileName);
  if (!idMatch?.[1]) return null;
  const specId = idMatch[1];

  // Extract status — accept bold "**Estado:**" or plain "Estado:" / "Status:"
  const statusMatch =
    /(?:\*{0,2}Estado:\*{0,2}|Status:)\s*([A-Za-z]+)/i.exec(content);
  const status = statusMatch?.[1] ?? 'Unknown';

  // Extract requirement IDs
  // Match patterns like: - **RF-1** or - **RNF-2** or - **INV-3**
  const reqPattern = /[-–]\s*\*{0,2}((?:RF|RNF|INV)-\d+)\*{0,2}/g;
  const requirements: SpecRequirement[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = reqPattern.exec(content)) !== null) {
    const reqId = m[1];
    if (reqId && !seen.has(reqId)) {
      seen.add(reqId);
      requirements.push({ id: reqId, label: reqId, covered: false, coveredBy: [] });
    }
  }

  return { file: path.relative(ROOT, filePath), specId, status, requirements };
}

// ─── Parse test citations ─────────────────────────────────────────────────────

async function collectCitations(): Promise<Map<string, string[]>> {
  // Map: "SPEC-INFRA-001/RF-1" → ["apps/web/src/__tests__/foo.test.ts:42"]
  const citations = new Map<string, string[]>();

  // Scan all test files under apps/ and scripts/
  const files: string[] = [];
  collectFiles(path.join(ROOT, 'apps'), '.test.ts', files);
  collectFiles(path.join(ROOT, 'scripts'), '.test.ts', files);

  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Match [SPEC-XXX-NNN/RF-y] or [SPEC-XXX-NNN/RNF-y] or [SPEC-XXX-NNN/INV-y]
      const citPattern = /\[((SPEC-[A-Z]+-\d+)\/((?:RF|RNF|INV)-\d+))\]/g;
      let match: RegExpExecArray | null;
      while ((match = citPattern.exec(line)) !== null) {
        const key = match[1]!; // e.g. SPEC-INFRA-001/RF-1
        const ref = `${path.relative(ROOT, filePath)}:${idx + 1}`;
        if (!citations.has(key)) citations.set(key, []);
        citations.get(key)!.push(ref);
      }
    });
  }

  return citations;
}

function collectFiles(dir: string, ext: string, result: string[]): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.astro') {
      collectFiles(full, ext, result);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      result.push(full);
    }
  }
}

// ─── Build traceability ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!fs.existsSync(SPECS_DIR)) {
    console.error(`[trace] specs dir not found: ${SPECS_DIR}`);
    process.exit(1);
  }

  const specFiles = fs
    .readdirSync(SPECS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(SPECS_DIR, f))
    .sort();

  const specs: SpecEntry[] = [];
  for (const f of specFiles) {
    const entry = parseSpec(f);
    if (entry) specs.push(entry);
  }

  const citations = await collectCitations();

  // Cross-reference
  for (const spec of specs) {
    for (const req of spec.requirements) {
      const key = `${spec.specId}/${req.id}`;
      const hits = citations.get(key) ?? [];
      req.covered = hits.length > 0;
      req.coveredBy = hits;
    }
  }

  // Generate markdown
  const lines: string[] = [
    '# Traceability Matrix',
    '',
    `> Generated by \`scripts/trace.ts\` on ${new Date().toISOString().slice(0, 10)}`,
    '',
  ];

  let uncoveredApproved = 0;

  for (const spec of specs) {
    const uncovered = spec.requirements.filter((r) => !r.covered);
    const isApproved = /^(Approved|Implemented|Verified)$/i.test(spec.status);
    const statusBadge = isApproved && uncovered.length > 0 ? '⚠️' : isApproved ? '✅' : '📝';

    lines.push(`## ${statusBadge} ${spec.specId} — Status: ${spec.status}`);
    lines.push('');
    lines.push(`File: \`${spec.file}\``);
    lines.push('');

    if (spec.requirements.length === 0) {
      lines.push('_No requirements extracted._');
    } else {
      lines.push('| Req | Covered | Tests |');
      lines.push('|-----|---------|-------|');
      for (const req of spec.requirements) {
        const check = req.covered ? '✅' : '❌';
        const tests = req.coveredBy.length > 0 ? req.coveredBy.join(', ') : '—';
        lines.push(`| ${req.id} | ${check} | ${tests} |`);
      }
    }

    lines.push('');

    if (isApproved) {
      uncoveredApproved += uncovered.length;
    }
  }

  lines.push('---');
  lines.push(`_Total specs: ${specs.length} | Uncovered reqs in Approved specs: ${uncoveredApproved}_`);
  lines.push('');

  const output = lines.join('\n');
  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
  console.log(`[trace] wrote ${OUTPUT_FILE}`);

  if (CHECK_MODE && uncoveredApproved > 0) {
    console.error(
      `[trace] FAIL: ${uncoveredApproved} requirement(s) in Approved specs lack test coverage.`,
    );
    console.error('[trace] Run `pnpm trace` to see the full matrix.');
    process.exit(1);
  }

  if (CHECK_MODE) {
    console.log('[trace] OK — all Approved spec requirements have test coverage.');
  }
}

void main();
