/**
 * Visual gate helpers — SPEC-QA-001
 *
 * compareWithDesign() es el gate real: captura la sección de la app y la sección
 * del diseño fuente (design/template/sections/NN-*.html) con el mismo viewport,
 * las compara con pixelmatch y falla si el diff supera el umbral.
 *
 * El diseño ES la referencia; la implementación debe igualarlo.
 */

import { Browser, Page, TestInfo } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Absolute path to design/template/sections/ from monorepo root
export const DESIGN_SECTIONS = path.resolve(__dirname, '../../../..', 'design/template/sections');

// Local Poppins fonts (same dir as served at /fonts/ in the app)
const FONTS_DIR = path.resolve(__dirname, '../../public/fonts');

// CSS inyectado para congelar animaciones, mostrar data-reveal y
// eliminar backdrop-filter (que blura fondos distintos entre design y app).
const RESET_CSS = `
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-delay: 0.001ms !important;
    transition-duration: 0.001ms !important;
    transition-delay: 0.001ms !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  [data-reveal], .js [data-reveal] {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }
  ::-webkit-scrollbar { display: none; }
  /* Fondo neutro — las secciones detrás del nav (fixed) son transparentes para que
     el pill semi-transparente .nav-inner vea el mismo fondo blanco en ambas páginas */
  html, body { background: white !important; scrollbar-width: none; overflow-x: hidden; }
  section, main { background: transparent !important; }
`;

// CSS de fuentes locales para inyectar en páginas de diseño (reemplaza Google Fonts)
function localFontsFace(): string {
  return [400, 500, 600, 700, 800, 900]
    .map(
      (w) =>
        `@font-face { font-family: 'Poppins'; font-style: normal; font-weight: ${w}; ` +
        `src: url('file://${FONTS_DIR}/poppins-${w}.woff2') format('woff2'); font-display: block; }`,
    )
    .join('\n');
}

/** Intercepta Google Fonts y sirve las fuentes locales para consistencia con la app. */
async function routeFonts(page: Page): Promise<void> {
  await page.route('https://fonts.googleapis.com/**', async (route) => {
    await route.fulfill({
      contentType: 'text/css; charset=utf-8',
      body: localFontsFace(),
    });
  });
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
}

/** Espera a que los estilos y fuentes estén listos (funciona en http:// y file://). */
export async function waitForStyles(page: Page): Promise<void> {
  // 'load' garantiza que todos los <link rel="stylesheet"> externos han cargado
  await page.waitForLoadState('load');
  await page.evaluate(() => document.fonts.ready);
  // Pequeña pausa para que el browser aplique los estilos y haga layout
  await page.waitForTimeout(200);
}

/** Descarga ambas capturas en Buffer y las compara con pixelmatch. */
function diffPNGs(
  a: Buffer,
  b: Buffer,
  pixelThreshold = 0.1,
): { ratio: number; diffBuffer: Buffer; width: number; height: number } {
  const pngA = PNG.sync.read(a);
  const pngB = PNG.sync.read(b);

  const width = Math.min(pngA.width, pngB.width);
  const height = Math.min(pngA.height, pngB.height);

  // Extrae subregión si dimensiones difieren
  function crop(png: PNG): Buffer {
    if (png.width === width && png.height === height) return png.data as unknown as Buffer;
    const out = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
      const srcRow = y * png.width * 4;
      const dstRow = y * width * 4;
      png.data.copy(out, dstRow, srcRow, srcRow + width * 4);
    }
    return out;
  }

  const diff = new PNG({ width, height });
  const count = pixelmatch(crop(pngA), crop(pngB), diff.data, width, height, {
    threshold: pixelThreshold,
    includeAA: false,
  });

  return {
    ratio: count / (width * height),
    diffBuffer: PNG.sync.write(diff),
    width,
    height,
  };
}

// ─── API pública ──────────────────────────────────────────────────────────────

export interface CompareOptions {
  /** Página del Astro app (ya en la URL correcta) */
  astroPage: Page;
  browser: Browser;
  testInfo: TestInfo;
  /** p.ej. '01-nav.html' */
  sectionFile: string;
  /** Selector CSS de la sección, p.ej. '.hero' */
  selector: string;
  /** Viewport a usar en AMBAS capturas */
  viewport: { width: number; height: number };
  /** Umbral de diff aceptable (0–1). Default 0.08 desktop, 0.10 mobile */
  threshold?: number;
  /** Nombre del label para los attachments */
  label: string;
  /** CSS adicional inyectado en AMBAS páginas después de RESET_CSS (para ocultar
   *  elementos decorativos específicos de un test, e.g. aurora blobs tras el nav) */
  extraCss?: string;
}

/**
 * Gate principal [SPEC-QA-001/RF-1].
 * Captura `selector` de la app y del HTML de diseño, compara con pixelmatch
 * y falla si el ratio de diff supera `threshold`.
 * Adjunta design + impl + diff al reporte HTML.
 */
export async function compareWithDesign(opts: CompareOptions): Promise<void> {
  const { astroPage, browser, testInfo, sectionFile, selector, viewport, label } = opts;
  const threshold = opts.threshold ?? 0.08;

  // ── 1. Captura del diseño fuente ────────────────────────────────────────────
  const designPage = await browser.newPage();
  await designPage.setViewportSize(viewport);
  await routeFonts(designPage);
  await designPage.goto(`file://${DESIGN_SECTIONS}/${sectionFile}`);
  await waitForStyles(designPage);
  await designPage.addStyleTag({ content: RESET_CSS });
  if (opts.extraCss) await designPage.addStyleTag({ content: opts.extraCss });
  await designPage.waitForTimeout(200); // frame estable tras CSS reset

  const designShot = await designPage.locator(selector).screenshot();
  await designPage.close();

  // ── 2. Captura de la implementación Astro ───────────────────────────────────
  await astroPage.setViewportSize(viewport);
  await waitForStyles(astroPage);
  await astroPage.addStyleTag({ content: RESET_CSS });
  if (opts.extraCss) await astroPage.addStyleTag({ content: opts.extraCss });
  await astroPage.waitForTimeout(200);

  const implShot = await astroPage.locator(selector).screenshot();

  // ── 3. Comparación pixelmatch ───────────────────────────────────────────────
  const { ratio, diffBuffer } = diffPNGs(designShot, implShot);

  // ── 4. Adjuntar al reporte (RF-2 NRF-2) ────────────────────────────────────
  await testInfo.attach(`${label}–design`, { body: designShot, contentType: 'image/png' });
  await testInfo.attach(`${label}–impl`, { body: implShot, contentType: 'image/png' });
  await testInfo.attach(`${label}–diff (ratio=${ratio.toFixed(4)})`, {
    body: diffBuffer,
    contentType: 'image/png',
  });

  // ── 5. Aserción ─────────────────────────────────────────────────────────────
  // eslint-disable-next-line no-console
  console.log(`[${label}] diff ratio: ${ratio.toFixed(4)} / threshold: ${threshold}`);
  if (ratio > threshold) {
    throw new Error(
      `[SPEC-QA-001/RF-1] Visual diff too large: ${(ratio * 100).toFixed(2)}% > ${(threshold * 100).toFixed(0)}% threshold for "${label}". ` +
        `See attachments in the HTML report.`,
    );
  }
}
