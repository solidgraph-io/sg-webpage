import node from '@astrojs/node';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  devToolbar: { enabled: false },
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
});
