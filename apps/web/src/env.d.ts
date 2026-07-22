// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_NOINDEX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Umami tracker global (SPEC-ANALYTICS-001) — present only when the /stats
// script loaded; every call site uses `window.umami?.track(...)` so a
// missing tracker (no env configured) is a silent no-op.
interface Window {
  umami?: {
    track: (event: string, data?: Record<string, unknown>) => void;
  };
}
