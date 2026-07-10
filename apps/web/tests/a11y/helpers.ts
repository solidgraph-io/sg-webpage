/**
 * Shared axe-core harness for Playwright a11y checks (SPEC-A11Y-001).
 */

import type { Page } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeCorePath: string = require.resolve('axe-core');

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
  await page.addScriptTag({ path: axeCorePath });
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
