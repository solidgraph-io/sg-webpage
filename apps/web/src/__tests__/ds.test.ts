/**
 * SPEC-DS-001 — Design system foundation
 * Tests run in Node (file-system checks). Each it() cites the requirement.
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const WEB = path.join(ROOT, 'apps/web');
const DESIGN_DS = path.join(ROOT, 'design/template/design-system');

// ── RF-1: tokens verbatim ──────────────────────────────────────────────────
describe('SPEC-DS-001/RF-1 — tokens', () => {
  const tokensPath = path.join(WEB, 'src/styles/tokens.css');

  it('[SPEC-DS-001/RF-1] tokens.css exists in apps/web/src/styles/', () => {
    expect(fs.existsSync(tokensPath)).toBe(true);
  });

  it('[SPEC-DS-001/RF-1] tokens.css contains all brand and neutral custom properties', () => {
    const content = fs.readFileSync(tokensPath, 'utf-8');
    for (const token of [
      '--ink',
      '--indigo',
      '--indigo-2',
      '--night',
      '--night-2',
      '--periwinkle',
      '--peri-bright',
      '--lilac',
      '--lilac-2',
      '--white',
      '--muted',
      '--muted-d',
      '--line',
      '--success',
      '--star',
    ]) {
      expect(content, `missing ${token}`).toContain(`${token}:`);
    }
  });

  it('[SPEC-DS-001/RF-1] tokens.css has elevation, radius, layout, motion, type tokens', () => {
    const content = fs.readFileSync(tokensPath, 'utf-8');
    for (const token of [
      '--shadow-sm',
      '--shadow-md',
      '--shadow-lg',
      '--radius',
      '--radius-lg',
      '--radius-xl',
      '--max',
      '--ease',
      '--ease-spring',
      '--font-sans',
    ]) {
      expect(content, `missing ${token}`).toContain(`${token}:`);
    }
  });

  it('[SPEC-DS-001/RF-1] all token values match design source verbatim', () => {
    const ported = fs.readFileSync(tokensPath, 'utf-8');
    const source = fs.readFileSync(path.join(DESIGN_DS, 'tokens.css'), 'utf-8');
    const extract = (css: string): Map<string, string> => {
      const m = new Map<string, string>();
      for (const match of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
        const name = match[1];
        const val = match[2];
        if (name && val) m.set(name, val.trim());
      }
      return m;
    };
    const portedMap = extract(ported);
    for (const [name, val] of extract(source)) {
      expect(portedMap.get(name), `--${name} mismatch`).toBe(val);
    }
  });
});

// ── RF-2: base.css ─────────────────────────────────────────────────────────
describe('SPEC-DS-001/RF-2 — base', () => {
  const basePath = path.join(WEB, 'src/styles/base.css');

  it('[SPEC-DS-001/RF-2] base.css exists', () => {
    expect(fs.existsSync(basePath)).toBe(true);
  });

  it('[SPEC-DS-001/RF-2] base.css has .container with max-width', () => {
    const c = fs.readFileSync(basePath, 'utf-8');
    expect(c).toContain('.container');
    expect(c).toContain('max-width');
  });

  it('[SPEC-DS-001/RF-2] base.css has .grad-text with gradient', () => {
    const c = fs.readFileSync(basePath, 'utf-8');
    expect(c).toContain('.grad-text');
    expect(c).toContain('gradient');
  });

  it('[SPEC-DS-001/RF-2] base.css has .spotlight cursor utility', () => {
    expect(fs.readFileSync(basePath, 'utf-8')).toContain('.spotlight');
  });
});

// ── RF-3: Poppins self-hosted ──────────────────────────────────────────────
describe('SPEC-DS-001/RF-3 — typography', () => {
  const globalPath = path.join(WEB, 'src/styles/global.css');
  const layoutPath = path.join(WEB, 'src/layouts/BaseLayout.astro');

  it('[SPEC-DS-001/RF-3] global.css exists', () => {
    expect(fs.existsSync(globalPath)).toBe(true);
  });

  it('[SPEC-DS-001/RF-3] global.css has @font-face for Poppins', () => {
    const c = fs.readFileSync(globalPath, 'utf-8');
    expect(c).toContain('@font-face');
    expect(c.toLowerCase()).toContain('poppins');
  });

  it('[SPEC-DS-001/RF-3] global.css has font-display: swap', () => {
    expect(fs.readFileSync(globalPath, 'utf-8')).toContain('font-display: swap');
  });

  it('[SPEC-DS-001/RF-3] global.css references self-hosted /fonts/poppins woff2 (no CDN)', () => {
    const c = fs.readFileSync(globalPath, 'utf-8');
    expect(c).toContain('/fonts/poppins-');
    expect(c).not.toContain('fonts.googleapis.com');
    expect(c).not.toContain('fonts.gstatic.com');
  });

  it('[SPEC-DS-001/RF-3] poppins woff2 files 400/600/700/800 exist in public/fonts/', () => {
    for (const w of ['400', '600', '700', '800']) {
      expect(
        fs.existsSync(path.join(WEB, `public/fonts/poppins-${w}.woff2`)),
        `poppins-${w}.woff2 missing`,
      ).toBe(true);
    }
  });

  it('[SPEC-DS-001/RF-3] BaseLayout preloads Poppins font files with font/woff2', () => {
    const layout = fs.readFileSync(layoutPath, 'utf-8');
    expect(layout).toContain('rel="preload"');
    expect(layout).toContain('font/woff2');
  });
});

// ── RF-4: animations.css ───────────────────────────────────────────────────
describe('SPEC-DS-001/RF-4 — animations', () => {
  const animPath = path.join(WEB, 'src/styles/animations.css');

  it('[SPEC-DS-001/RF-4] animations.css exists', () => {
    expect(fs.existsSync(animPath)).toBe(true);
  });

  it('[SPEC-DS-001/RF-4] animations.css has all required @keyframes', () => {
    // Existence here does NOT mean they apply: CSS Modules localizes
    // animation-name values, so a module referencing `bob` can silently miss
    // these keyframes. The runtime guard is tests/e2e/animations.spec.ts,
    // which asserts the COMPUTED animation-name on the page.
    const c = fs.readFileSync(animPath, 'utf-8');
    for (const kf of ['ping', 'float1', 'float2', 'float3', 'bob', 'spin', 'scroll-x']) {
      expect(c, `missing @keyframes ${kf}`).toContain(`@keyframes ${kf}`);
    }
  });

  it('[SPEC-DS-001/RF-4] animations.css has data-reveal transition rule', () => {
    expect(fs.readFileSync(animPath, 'utf-8')).toContain('data-reveal');
  });
});

// ── RF-5: interactions.js ──────────────────────────────────────────────────
describe('SPEC-DS-001/RF-5 — interactions JS', () => {
  const jsPath = path.join(WEB, 'public/interactions.js');

  it('[SPEC-DS-001/RF-5] interactions.js exists in public/', () => {
    expect(fs.existsSync(jsPath)).toBe(true);
  });

  it('[SPEC-DS-001/RF-5] interactions.js uses IntersectionObserver for scroll reveal', () => {
    expect(fs.readFileSync(jsPath, 'utf-8')).toContain('IntersectionObserver');
  });

  it('[SPEC-DS-001/RF-5] interactions.js checks prefers-reduced-motion', () => {
    expect(fs.readFileSync(jsPath, 'utf-8')).toContain('prefers-reduced-motion');
  });

  it('[SPEC-DS-001/RF-5] interactions.js has nav scrolled/hide scroll logic', () => {
    const c = fs.readFileSync(jsPath, 'utf-8');
    expect(c).toContain('scrolled');
    expect(c).toContain('hide');
  });

  it('[SPEC-DS-001/RF-5] interactions.js has magnetic button support', () => {
    expect(fs.readFileSync(jsPath, 'utf-8')).toContain('magnetic');
  });
});

// ── RF-6: progressive enhancement ─────────────────────────────────────────
describe('SPEC-DS-001/RF-6 — progressive enhancement', () => {
  it('[SPEC-DS-001/RF-6] BaseLayout loads the .js class snippet in <head> before first paint', () => {
    // External since SPEC-SEC-016/INV-1 (CSP script-src has no unsafe-inline):
    // same synchronous, blocking, before-first-paint timing as an inline script.
    const layout = fs.readFileSync(path.join(WEB, 'src/layouts/BaseLayout.astro'), 'utf-8');
    expect(layout).toContain('src="/enable-js.js"');
    const snippet = fs.readFileSync(path.join(WEB, 'public/enable-js.js'), 'utf-8');
    expect(snippet).toContain("classList.add('js')");
  });

  it('[SPEC-DS-001/RF-6] animations.css scopes reveal hide under .js (PE)', () => {
    const c = fs.readFileSync(path.join(WEB, 'src/styles/animations.css'), 'utf-8');
    expect(c).toContain('.js [data-reveal]');
  });

  it('[SPEC-DS-001/RF-6] animations.css does NOT hide [data-reveal] without .js prefix', () => {
    const c = fs.readFileSync(path.join(WEB, 'src/styles/animations.css'), 'utf-8');
    // Line-anchored: bare [data-reveal] at start of rule must not set opacity:0
    expect(c).not.toMatch(/^\s*\[data-reveal\][^{]*\{[^}]*opacity\s*:\s*0/m);
  });
});

// ── RF-7: BaseLayout ───────────────────────────────────────────────────────
describe('SPEC-DS-001/RF-7 — BaseLayout', () => {
  const layoutPath = path.join(WEB, 'src/layouts/BaseLayout.astro');

  it('[SPEC-DS-001/RF-7] BaseLayout.astro exists', () => {
    expect(fs.existsSync(layoutPath)).toBe(true);
  });

  it('[SPEC-DS-001/RF-7] BaseLayout has html lang attribute', () => {
    expect(fs.readFileSync(layoutPath, 'utf-8')).toContain('lang=');
  });

  it('[SPEC-DS-001/RF-7] BaseLayout has charset and viewport meta tags', () => {
    const c = fs.readFileSync(layoutPath, 'utf-8');
    expect(c).toContain('charset');
    expect(c).toContain('viewport');
  });

  it('[SPEC-DS-001/RF-7] BaseLayout exposes title and description via props', () => {
    const c = fs.readFileSync(layoutPath, 'utf-8');
    expect(c).toContain('title');
    expect(c).toContain('description');
  });

  it('[SPEC-DS-001/RF-7] BaseLayout has <slot />', () => {
    expect(fs.readFileSync(layoutPath, 'utf-8')).toContain('<slot');
  });

  it('[SPEC-DS-001/RF-7] BaseLayout loads interactions.js with defer', () => {
    const c = fs.readFileSync(layoutPath, 'utf-8');
    expect(c).toContain('interactions.js');
    expect(c).toContain('defer');
  });

  it('[SPEC-DS-001/INV-3] BaseLayout does not contain section content (SRP)', () => {
    const c = fs.readFileSync(layoutPath, 'utf-8');
    // Must not embed any section-specific markup outside the slot
    expect(c).not.toContain('<section');
    expect(c).not.toContain('<nav ');
    expect(c).not.toContain('<footer');
  });
});

// ── RF-8: primitive components ─────────────────────────────────────────────
describe('SPEC-DS-001/RF-8 — primitives', () => {
  const compsDir = path.join(WEB, 'src/components');
  const primitives = [
    'Button',
    'Eyebrow',
    'Pill',
    'Badge',
    'Logo',
    'IconBox',
    'SectionHead',
    'Aurora',
    'FloatingCard',
  ];

  it('[SPEC-DS-001/RF-8] all 9 primitive .astro files exist', () => {
    for (const p of primitives) {
      expect(fs.existsSync(path.join(compsDir, `${p}.astro`)), `${p}.astro missing`).toBe(true);
    }
  });

  it('[SPEC-DS-001/RF-8] Button has all 4 variant classes', () => {
    const c = fs.readFileSync(path.join(compsDir, 'Button.astro'), 'utf-8');
    for (const v of ['btn-primary', 'btn-white', 'btn-ghost-light', 'btn-outline']) {
      expect(c, `missing ${v}`).toContain(v);
    }
  });

  it('[SPEC-DS-001/RF-8] Button supports .magnetic modifier', () => {
    expect(fs.readFileSync(path.join(compsDir, 'Button.astro'), 'utf-8')).toContain('magnetic');
  });

  it('[SPEC-DS-001/RF-8] Button wraps its slot in .btn__label above the hover overlay', () => {
    const c = fs.readFileSync(path.join(compsDir, 'Button.astro'), 'utf-8');
    // loose text nodes paint below the positioned ::before gradient; the
    // single wrapper span keeps every caption above it on hover
    expect(c).toMatch(/<span class="btn__label">\s*<slot \/>\s*<\/span>/);
    expect(c).not.toContain('.btn-primary > *');
    const label = c.match(/\.btn__label\s*\{[^}]*\}/)?.[0] ?? '';
    expect(label).toContain('z-index: 1');
    expect(label).toContain('position: relative');
  });

  it('[SPEC-DS-001/RF-8] Pill has .ping sub-element', () => {
    expect(fs.readFileSync(path.join(compsDir, 'Pill.astro'), 'utf-8')).toContain('ping');
  });

  it('[SPEC-DS-001/RF-8] Aurora has three blob elements (a1, a2, a3)', () => {
    const c = fs.readFileSync(path.join(compsDir, 'Aurora.astro'), 'utf-8');
    expect(c).toContain('a1');
    expect(c).toContain('a2');
    expect(c).toContain('a3');
  });

  it('[SPEC-DS-001/RF-8] IconBox has size modifier classes', () => {
    const c = fs.readFileSync(path.join(compsDir, 'IconBox.astro'), 'utf-8');
    expect(c).toContain('icon-box--sm');
    expect(c).toContain('icon-box--lg');
  });

  it('[SPEC-DS-001/RF-8] SectionHead has eyebrow + h2 + paragraph slots/structure', () => {
    const c = fs.readFileSync(path.join(compsDir, 'SectionHead.astro'), 'utf-8');
    expect(c).toContain('section-head');
    expect(c).toContain('eyebrow');
  });
});

// ── RNF-1: a11y ────────────────────────────────────────────────────────────
describe('SPEC-DS-001/RNF-1 — a11y', () => {
  it('[SPEC-DS-001/RNF-1] animations.css has prefers-reduced-motion override (opacity:1)', () => {
    const c = fs.readFileSync(path.join(WEB, 'src/styles/animations.css'), 'utf-8');
    expect(c).toContain('prefers-reduced-motion');
    expect(c).toContain('opacity: 1');
  });
});

// ── RNF-2: perf ────────────────────────────────────────────────────────────
describe('SPEC-DS-001/RNF-2 — perf', () => {
  it('[SPEC-DS-001/RNF-2] interactions.js raw size is under 10 KB', () => {
    const stats = fs.statSync(path.join(WEB, 'public/interactions.js'));
    expect(stats.size).toBeLessThan(10 * 1024);
  });
});

// ── INV-1: no hex in components (excl. Aurora decorative blobs) ────────────
describe('SPEC-DS-001/INV-1 — tokens only (no hardcoded hex)', () => {
  it('[SPEC-DS-001/INV-1] component <style> blocks use no bare hex literals', () => {
    const compsDir = path.join(WEB, 'src/components');
    // Aurora blobs use non-tokenized decorative hex colors — accepted exception
    const toCheck = ['Eyebrow', 'Pill', 'Logo', 'IconBox', 'SectionHead'];
    const hexRe = /#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])/;
    for (const name of toCheck) {
      const content = fs.readFileSync(path.join(compsDir, `${name}.astro`), 'utf-8');
      const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      if (styleMatch) {
        expect(styleMatch[1], `${name}.astro has bare hex in <style>`).not.toMatch(hexRe);
      }
    }
  });
});

// ── INV-2: PE — site visible without JS ───────────────────────────────────
describe('SPEC-DS-001/INV-2 — site visible without JS', () => {
  it('[SPEC-DS-001/INV-2] without .js class [data-reveal] elements are fully visible', () => {
    const c = fs.readFileSync(path.join(WEB, 'src/styles/animations.css'), 'utf-8');
    // All hide rules must be scoped to .js — bare [data-reveal] must never set opacity:0
    expect(c).toContain('.js [data-reveal]');
    expect(c).not.toMatch(/^\s*\[data-reveal\][^{]*\{[^}]*opacity\s*:\s*0/m);
  });
});

// ── RNF-3: fidelity — styleguide structural check ─────────────────────────
describe('SPEC-DS-001/RNF-3 — styleguide fidelity', () => {
  it('[SPEC-DS-001/RNF-3] design/template/styleguide.html exists as visual reference', () => {
    expect(fs.existsSync(path.join(ROOT, 'design/template/styleguide.html'))).toBe(true);
  });

  it('[SPEC-DS-001/RNF-3] primitive CSS class names match styleguide selectors', () => {
    const styleguide = fs.readFileSync(path.join(ROOT, 'design/template/styleguide.html'), 'utf-8');
    // Verify key class names used in styleguide exist in our components
    const compsDir = path.join(WEB, 'src/components');
    const checks: [string, string][] = [
      ['Button.astro', 'btn-primary'],
      ['Eyebrow.astro', 'eyebrow'],
      ['Pill.astro', 'pill'],
      ['IconBox.astro', 'icon-box'],
      ['SectionHead.astro', 'section-head'],
    ];
    for (const [file, cls] of checks) {
      if (styleguide.includes(cls)) {
        const comp = fs.readFileSync(path.join(compsDir, file), 'utf-8');
        expect(comp, `${file} missing class ${cls}`).toContain(cls);
      }
    }
  });
});

// ── INV-4: no Tailwind ─────────────────────────────────────────────────────
describe('SPEC-DS-001/INV-4 — no Tailwind', () => {
  it('[SPEC-DS-001/INV-4] astro.config.ts does not import @tailwindcss/vite', () => {
    const c = fs.readFileSync(path.join(WEB, 'astro.config.ts'), 'utf-8');
    expect(c).not.toContain('@tailwindcss/vite');
    expect(c).not.toContain('tailwindcss');
  });
});
