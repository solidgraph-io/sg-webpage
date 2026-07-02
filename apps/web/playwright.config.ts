import { defineConfig, devices } from '@playwright/test';

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
    baseURL: 'http://localhost:4321',
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
    command: 'pnpm build && node dist/server/entry.mjs',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env['CI'],
    env: {
      HOST: '0.0.0.0',
      PORT: '4321',
    },
  },
});
