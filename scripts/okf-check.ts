#!/usr/bin/env tsx
/**
 * scripts/okf-check.ts — OKF bundle conformance checker (SPEC-DOCS-OKF-001)
 *
 * Usage:
 *   pnpm okf:check              check docs/ (bundle root)
 *   pnpm okf:check <dir>        check another bundle root (used by tests)
 *
 * Rules (SPEC-DOCS-OKF-001):
 *   RF-1  hard    docs/index.md exists with frontmatter declaring okf_version
 *   RF-2  hard    every non-reserved .md has parseable YAML frontmatter
 *   RF-3  hard    every concept frontmatter has a non-empty `type`
 *   RF-4  warn    `type` outside the project taxonomy
 *   RF-5  warn    bundle-relative links (/….md) that do not resolve
 *   RF-6  exit    exit ≠ 0 only for RF-1/RF-2/RF-3; warnings keep exit 0
 *   RF-8  warn    non-empty subdirectory without its index.md (§6, `pnpm okf:index`)
 *
 * Reserved files (index.md, log.md) are never concepts (INV-2); only the
 * bundle-root index.md carries frontmatter (okf_version).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const TAXONOMY = [
  'Spec',
  'ADR',
  'Prompt',
  'Architecture',
  'Methodology',
  'Plan',
  'Runbook',
  'Index',
  'Reference',
] as const;

export interface OkfResult {
  errors: string[]; // hard violations: RF-1, RF-2, RF-3
  warnings: string[]; // permissive: RF-4, RF-5
  concepts: number; // non-reserved .md files checked
}

const RESERVED = new Set(['index.md', 'log.md']);

// Frontmatter block must open the file: --- … --- (§4)
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

// Bundle-relative markdown links: ](/path/to/file.md) or ](/path.md#anchor) (§5.3)
const BUNDLE_LINK_RE = /\]\((\/[^)#\s]+\.md)(?:#[^)]*)?\)/g;

function collectMdFiles(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectMdFiles(full, out);
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
}

function parseFrontmatter(content: string): { data: unknown } | { error: string } | null {
  const m = FRONTMATTER_RE.exec(content);
  if (!m) return null;
  try {
    return { data: YAML.parse(m[1]!) };
  } catch (e) {
    return { error: e instanceof Error ? e.message.split('\n')[0]! : String(e) };
  }
}

export function checkBundle(bundleRoot: string): OkfResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let concepts = 0;

  if (!fs.existsSync(bundleRoot) || !fs.statSync(bundleRoot).isDirectory()) {
    return { errors: [`[RF-1] bundle root not found: ${bundleRoot}`], warnings, concepts };
  }

  const files: string[] = [];
  collectMdFiles(bundleRoot, files);
  files.sort();

  // ── RF-1: root index.md declares okf_version ─────────────────────────────
  const rootIndex = path.join(bundleRoot, 'index.md');
  if (!fs.existsSync(rootIndex)) {
    errors.push('[RF-1] missing bundle root index.md');
  } else {
    const fm = parseFrontmatter(fs.readFileSync(rootIndex, 'utf-8'));
    if (!fm) {
      errors.push('[RF-1] index.md: no frontmatter (must declare okf_version)');
    } else if ('error' in fm) {
      errors.push(`[RF-1] index.md: unparseable frontmatter — ${fm.error}`);
    } else {
      const v = (fm.data as Record<string, unknown> | null)?.['okf_version'];
      if (typeof v !== 'string' || v.trim() === '') {
        errors.push('[RF-1] index.md: frontmatter lacks okf_version');
      }
    }
  }

  for (const file of files) {
    const rel = path.relative(bundleRoot, file);
    const base = path.basename(file);
    const content = fs.readFileSync(file, 'utf-8');

    // ── RF-5: bundle-relative links must resolve (warning) — all files ─────
    let link: RegExpExecArray | null;
    BUNDLE_LINK_RE.lastIndex = 0;
    while ((link = BUNDLE_LINK_RE.exec(content)) !== null) {
      const target = path.join(bundleRoot, link[1]!);
      if (!fs.existsSync(target)) {
        warnings.push(`[RF-5] ${rel}: broken bundle link ${link[1]}`);
      }
    }

    // Reserved files are never concepts (INV-2)
    if (RESERVED.has(base)) continue;

    concepts++;

    // ── RF-2: parseable frontmatter (hard) ──────────────────────────────────
    const fm = parseFrontmatter(content);
    if (!fm) {
      errors.push(`[RF-2] ${rel}: missing frontmatter block`);
      continue;
    }
    if ('error' in fm) {
      errors.push(`[RF-2] ${rel}: unparseable frontmatter — ${fm.error}`);
      continue;
    }

    // ── RF-3: non-empty type (hard) ─────────────────────────────────────────
    const data = fm.data as Record<string, unknown> | null;
    const type = data?.['type'];
    if (typeof type !== 'string' || type.trim() === '') {
      errors.push(`[RF-3] ${rel}: frontmatter lacks non-empty \`type\``);
      continue;
    }

    // ── RF-4: type in project taxonomy (warning) ────────────────────────────
    if (!(TAXONOMY as readonly string[]).includes(type)) {
      warnings.push(`[RF-4] ${rel}: type "${type}" outside taxonomy (${TAXONOMY.join('|')})`);
    }
  }

  // ── RF-8: non-empty subdirs should carry a progressive-disclosure index ──
  // Non-empty = ≥1 direct non-reserved .md (same rule as okf-index)
  for (const entry of fs.readdirSync(bundleRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(bundleRoot, entry.name);
    const hasConcepts = fs
      .readdirSync(dir, { withFileTypes: true })
      .some((e) => e.isFile() && e.name.endsWith('.md') && !RESERVED.has(e.name));
    if (hasConcepts && !fs.existsSync(path.join(dir, 'index.md'))) {
      warnings.push(
        `[RF-8] ${entry.name}/: non-empty directory lacks index.md (run \`pnpm okf:index\`)`,
      );
    }
  }

  return { errors, warnings, concepts };
}

// ── CLI (RF-6: exit ≠ 0 only on hard violations) ──────────────────────────────
function main(): void {
  const bundleRoot = path.resolve(process.argv[2] ?? path.join(process.cwd(), 'docs'));
  const { errors, warnings, concepts } = checkBundle(bundleRoot);

  for (const w of warnings) console.warn(`[okf] warn  ${w}`);
  for (const e of errors) console.error(`[okf] ERROR ${e}`);
  console.log(
    `[okf] ${concepts} concept(s) checked — ${errors.length} error(s), ${warnings.length} warning(s)`,
  );

  if (errors.length > 0) {
    console.error('[okf] FAIL: hard conformance violations (RF-1/RF-2/RF-3).');
    process.exit(1);
  }
  console.log('[okf] OK — bundle is OKF-conformant.');
}

const isMain =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
