import { defineConfig, devices } from '@playwright/test';

// Dedicated port for the e2e harness — deliberately different from `pnpm dev`'s
// 4321 (and prod's, same value). If the harness reused whatever's already on
// 4321, a stray/zombie server from elsewhere gets tested instead of our build,
// producing confusing false reds (or worse, false greens) — see
// docs/prompts/59-e2e-harness-port-isolation.md. Single source of truth: every
// use below reads PORT/BASE_URL, no magic numbers duplicated.
const PORT = Number(process.env['PLAYWRIGHT_PORT']) || 4331;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : '50%',
  reporter: [['html', { open: 'never' }], ['list']],
  snapshotDir: 'tests/snapshots',
  expect: {
    toHaveScreenshot: {
      threshold: 0.15,
      maxDiffPixelRatio: 0.05,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    // check-e2e-port fails fast and loud if PORT is already taken — needed
    // because @astrojs/node's server retries EADDRINUSE instead of exiting,
    // so reuseExistingServer:false alone would just make Playwright hang
    // until its own timeout instead of failing immediately (prompt 59).
    // In CI: dist/ is pre-built by the `build` step in .drone.yml (build-once, SPEC-DEPLOY-002/RF-1).
    // Locally: rebuild on every test run to pick up latest changes.
    command: process.env['CI']
      ? `node scripts/check-e2e-port.mjs ${PORT} && node dist/server/entry.mjs`
      : `node scripts/check-e2e-port.mjs ${PORT} && pnpm build && node dist/server/entry.mjs`,
    url: BASE_URL,
    // Never reuse whatever's already there: if the dedicated port is occupied
    // by anything — ours or not — the harness must fail loudly rather than
    // silently test against a foreign build (prompt 59).
    reuseExistingServer: false,
    env: {
      HOST: '0.0.0.0',
      PORT: String(PORT),
    },
  },
});
