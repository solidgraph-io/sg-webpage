/**
 * Shared axe-core harness for Playwright a11y checks (SPEC-A11Y-001).
 */

import type { Page } from '@playwright/test';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const axeCorePath: string = require.resolve('axe-core');
// Read once and evaluate as a string (CDP Runtime.evaluate) rather than
// page.addScriptTag (a DOM <script> element, blocked by the site's strict
// CSP script-src — SPEC-SEC-016/INV-1). This is test-only tooling injection,
// not page content, so bypassing the page's CSP here is correct and doesn't
// touch production code.
const axeCoreSource = fs.readFileSync(axeCorePath, 'utf-8');

export interface AxeViolation {
  id: string;
  description: string;
  nodes: { target: string[] }[];
}
export interface AxeResults {
  violations: AxeViolation[];
}

export async function runAxe(
  page: Page,
  options: Record<string, unknown> = {},
): Promise<AxeResults> {
  await page.evaluate(axeCoreSource);
  return page.evaluate((opts: Record<string, unknown>) => {
    return (
      window as unknown as { axe: { run: (doc: Document, opts: unknown) => Promise<AxeResults> } }
    ).axe.run(document, opts);
  }, options);
}

export function formatViolations(violations: AxeViolation[]): string {
  return violations
    .map(
      (v) => `[${v.id}] ${v.description}: ${v.nodes.map((n) => n.target.join(', ')).join(' | ')}`,
    )
    .join('\n');
}
