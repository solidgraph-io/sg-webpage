#!/usr/bin/env node
/**
 * check-e2e-port — refuse to start the e2e harness if its dedicated port is
 * already occupied (prompt 59). `reuseExistingServer: false` alone isn't
 * enough: @astrojs/node's standalone server retries binding on EADDRINUSE
 * instead of exiting, so Playwright just waits (minutes) instead of failing
 * fast — the exact silent-false-result risk this harness must never have.
 * This runs as the first step of webServer.command and fails loud and
 * immediately instead.
 */
import net from 'node:net';

const port = Number(process.argv[2]);
if (!Number.isInteger(port)) {
  // eslint-disable-next-line no-console -- CLI script: this message IS the product
  console.error('[e2e] check-e2e-port: usage: node check-e2e-port.mjs <port>');
  process.exit(1);
}

const probe = net.createServer();

probe.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console -- CLI script: this message IS the product
    console.error(
      `\n[e2e] Port ${port} is already in use — refusing to start the e2e harness.\n` +
        `[e2e] This port is dedicated to Playwright (apps/web/playwright.config.ts) and must\n` +
        `[e2e] never be silently reused — a stray server there would make e2e test someone\n` +
        `[e2e] else's build. Find and stop whatever's listening, then retry, e.g.:\n` +
        `[e2e]   ss -ltnp | grep ${port}\n`,
    );
  } else {
    // eslint-disable-next-line no-console -- CLI script: this message IS the product
    console.error(`[e2e] check-e2e-port: unexpected error probing port ${port}:`, err);
  }
  process.exit(1);
});

probe.once('listening', () => {
  probe.close(() => process.exit(0));
});

probe.listen(port, '127.0.0.1');
