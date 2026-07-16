/**
 * SPEC-CMS-002 — garantías repo-side del puente de auth del CMS (ADR-0017).
 * El comportamiento runtime del Worker se testea en
 * workers/cms-auth/test/auth.test.ts; aquí viven las aserciones de higiene y
 * config que necesitan el árbol del repo.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { SiteConfigSchema, HomeSchema } from '../content/schemas';

const ROOT = path.resolve(__dirname, '../../../..');
const WORKER = path.join(ROOT, 'workers/cms-auth');
const WEB_SRC = path.resolve(__dirname, '..');
const ADMIN_CONFIG = path.resolve(__dirname, '../../public/admin/config.yml');

function workerSources(): string {
  return ['index.ts', 'access.ts', 'handshake.ts']
    .map((f) => fs.readFileSync(path.join(WORKER, 'src', f), 'utf-8'))
    .join('\n');
}

// ── INV-2: cero secretos en el repo ───────────────────────────────────────────

describe('[SPEC-CMS-002/INV-2] the service token never lives in the repo', () => {
  it('[SPEC-CMS-002/INV-2] wrangler.toml declares no GITHUB_SERVICE_TOKEN value', () => {
    const toml = fs.readFileSync(path.join(WORKER, 'wrangler.toml'), 'utf-8');
    expect(/^\s*GITHUB_SERVICE_TOKEN\s*=/m.test(toml)).toBe(false);
    expect(toml).toContain('wrangler secret put GITHUB_SERVICE_TOKEN'); // documented instead
  });

  it('[SPEC-CMS-002/INV-2][SPEC-CMS-002/RF-3] no GitHub token literals anywhere in the worker', () => {
    const all = workerSources() + fs.readFileSync(path.join(WORKER, 'wrangler.toml'), 'utf-8');
    expect(all).not.toMatch(/ghp_[A-Za-z0-9]/);
    expect(all).not.toMatch(/github_pat_[A-Za-z0-9]/);
    // the token is only ever read from env
    expect(workerSources()).toContain('env.GITHUB_SERVICE_TOKEN');
  });
});

// ── RNF-2: el Worker es independiente del sitio (QA-001 intacto) ──────────────

describe('[SPEC-CMS-002/RNF-2] worker is isolated from the Astro site', () => {
  it('[SPEC-CMS-002/RNF-2] own project: package.json + wrangler.toml + src/', () => {
    for (const f of ['package.json', 'wrangler.toml', 'src/index.ts']) {
      expect(fs.existsSync(path.join(WORKER, f))).toBe(true);
    }
  });

  it('[SPEC-CMS-002/RNF-2] worker imports nothing from the site, site imports nothing from the worker', () => {
    expect(workerSources()).not.toContain('apps/web');
    const grep = (dir: string): boolean => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          if (grep(full)) return true;
        } else if (/\.(ts|astro|js|mjs)$/.test(entry.name)) {
          if (fs.readFileSync(full, 'utf-8').includes('cms-auth')) return true;
        }
      }
      return false;
    };
    const componentsAndPages = ['components', 'pages', 'layouts', 'lib']
      .map((d) => path.join(WEB_SRC, d))
      .filter((d) => fs.existsSync(d));
    for (const dir of componentsAndPages) {
      expect(grep(dir)).toBe(false);
    }
  });
});

// ── RF-5: config del CMS apunta al puente (base_url — se concreta en prompt 56) ──

describe('[SPEC-CMS-002/RF-5] admin config.yml wires the github backend through base_url', () => {
  it('[SPEC-CMS-002/RF-5] backend github/repo/branch + base_url + auth_endpoint present', () => {
    const src = fs.readFileSync(ADMIN_CONFIG, 'utf-8');
    expect(src).toContain('name: github');
    expect(src).toContain('repo: solidgraph-io/sg-webpage');
    expect(src).toContain('branch: main');
    // the mechanism is wired; the concrete Worker URL lands with prompt 56
    expect(src).toMatch(/base_url:/);
    expect(src).toContain('auth_endpoint: auth');
  });
});

// ── RF-6: atribución diferida — el email del editor no viaja en el handshake ──

describe('[SPEC-CMS-002/RF-6] attribution is deferred (documented, non-blocking)', () => {
  it('[SPEC-CMS-002/RF-6] the Access email is verified but never embedded in the handshake', () => {
    const index = fs.readFileSync(path.join(WORKER, 'src/index.ts'), 'utf-8');
    const access = fs.readFileSync(path.join(WORKER, 'src/access.ts'), 'utf-8');
    expect(access).toContain('email'); // identity captured (available for future attribution)
    // success handshake carries only provider+token — commits attribute to the service account
    expect(index).toMatch(/handshakeHtml\('success', \{ provider: 'github', token:/);
    expect(index).not.toMatch(/handshakeHtml\('success',[^)]*email/);
  });
});

// ── INV-3: el contenido editado sigue validando contra los schemas Zod ────────

describe('[SPEC-CMS-002/INV-3] CMS-edited content keeps validating against Zod', () => {
  it('[SPEC-CMS-002/INV-3] settings/site.yaml + pages/home.yaml parse with their schemas', () => {
    const content = path.resolve(__dirname, '../content');
    const site: unknown = yaml.parse(
      fs.readFileSync(path.join(content, 'settings/site.yaml'), 'utf-8'),
    );
    const home: unknown = yaml.parse(
      fs.readFileSync(path.join(content, 'pages/home.yaml'), 'utf-8'),
    );
    expect(() => SiteConfigSchema.parse(site)).not.toThrow();
    expect(() => HomeSchema.parse(home)).not.toThrow();
  });
});
