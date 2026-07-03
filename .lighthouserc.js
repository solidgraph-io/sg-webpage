/** @type {import('@lhci/cli').LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4321/'],
      startServerCommand:
        'pnpm --filter @solidgraph/web preview --port 4321',
      startServerReadyPattern: 'Local',
      numberOfRuns: 1,
    },
    assert: {
      // SPEC-PERF-001/RF-1 — blocking performance budgets
      // Budgets are CI-safe (generous enough for headless Chrome on any machine).
      // Real user experience targets are tighter — adjust as prod data arrives.
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift':  ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time':      ['error', { maxNumericValue: 600 }],
        'interactive':              ['warn',  { maxNumericValue: 5000 }],
        'first-contentful-paint':   ['warn',  { maxNumericValue: 2000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
