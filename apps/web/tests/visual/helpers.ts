import { Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Absolute path to design/template/sections/ from the monorepo root
export const DESIGN_SECTIONS = path.resolve(
  __dirname, '../../../..', 'design/template/sections',
);

export async function waitForFonts(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400); // extra time for font render
}

/**
 * Captures a screenshot of the design HTML source element and attaches it to the
 * test report. Returns the screenshot buffer so callers can also save it as a snapshot.
 */
export async function captureDesign(
  page: Page,
  sectionFile: string,
  selector: string,
): Promise<Buffer> {
  await page.goto(`file://${DESIGN_SECTIONS}/${sectionFile}`);
  await waitForFonts(page);
  return page.locator(selector).screenshot();
}
