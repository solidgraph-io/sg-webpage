/** @type {import('@lhci/cli').LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:4321/'],
      startServerCommand: 'pnpm --filter @solidgraph/web preview --port 4321',
      startServerReadyPattern: 'Local',
      numberOfRuns: 1,
      settings: {
        // Docker root → --no-sandbox. --headless=new = modo headless estable.
        // --disable-dev-shm-usage: /dev/shm en contenedores es ~64MB → el tab de Chrome crashea
        //   (TARGET_CRASHED); con este flag Chrome usa /tmp en vez de /dev/shm.
        // --disable-gpu: sin GPU en CI, evita fallos del compositor.
        chromeFlags: '--no-sandbox --headless=new --disable-dev-shm-usage --disable-gpu',
      },
    },
    assert: {
      // SPEC-PERF-001/RF-1 — blocking performance budgets
      // Budgets are CI-safe (generous enough for headless Chrome on any machine).
      // Real user experience targets are tighter — adjust as prod data arrives.
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 600 }],
        interactive: ['warn', { maxNumericValue: 5000 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
