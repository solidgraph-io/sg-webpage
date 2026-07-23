import node from '@astrojs/node';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  devToolbar: { enabled: false },
  build: {
    // single-page site: inlining the ~10 KiB stylesheet removes the
    // render-blocking request from the critical path (SPEC-FORM-001/RNF-2);
    // losing cross-navigation CSS caching is an acceptable trade-off here
    inlineStylesheets: 'always',
  },
  env: {
    schema: {
      // 'secret' = runtime read (Dokploy injects env at runtime, not at build;
      // 'public' would bake in empty). Does not hide it from the HTML.
      TURNSTILE_SITE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      TURNSTILE_SECRET_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      LEAD_TO_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      LEAD_FROM_EMAIL: envField.string({ context: 'server', access: 'secret', optional: true }),
      LEAD_PROVIDER: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Umami first-party analytics (SPEC-ANALYTICS-001) — same runtime-read
      // pattern as Turnstile/lead vars above: unset in dev/CI → the tracker
      // and its /stats/* proxy routes stay no-op.
      ANALYTICS_UMAMI_HOST: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      ANALYTICS_UMAMI_WEBSITE_ID: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      // SPEC-SEC-016/RF-4 — 'staging' env-gates noindex (robots.txt, X-Robots-Tag,
      // <meta robots>) without a separate build-time flag; same runtime pattern.
      SITE_ENV: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  vite: {
    envDir: new URL('../../', import.meta.url).pathname,
    resolve: {
      alias: {
        '@/': new URL('./src/', import.meta.url).pathname,
      },
    },
  },
  // SPEC-SEC-016/RF-1 (F-02, ADR-0018) — CSP hashed at render-time by Astro's
  // own compiler-generated code (cheap, per-script, no full-body re-parse),
  // NOT by middleware reading/regex-scanning the response body (prompt 61
  // fixed a real perf regression: that approach de-streamed SSR and blocked
  // the event loop on every request). None of our routes are prerendered, so
  // Astro emits this as a genuine `Content-Security-Policy` response header
  // (not a <meta> tag) — frame-ancestors works correctly.
  // script-src NEVER carries 'unsafe-inline' (INV-1); style-src does, by
  // design (inlineStylesheets:'always' + style= attributes — ADR-0018 trade-off).
  experimental: {
    csp: {
      scriptDirective: {
        resources: ["'self'", 'https://challenges.cloudflare.com'],
      },
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
      },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://challenges.cloudflare.com",
        'frame-src https://challenges.cloudflare.com',
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ],
    },
  },
});
