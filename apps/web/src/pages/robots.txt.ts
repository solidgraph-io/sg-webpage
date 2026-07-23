/**
 * robots.txt — SPEC-SEO-001/RF-6, SPEC-SEC-016/RF-4 (F-06)
 * noindex when PUBLIC_NOINDEX=true (build-time) or SITE_ENV=staging (runtime).
 */

import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { isStagingNoIndex } from '../lib/site-env';

export const GET: APIRoute = async () => {
  const site = await getEntry('settings', 'site');
  const base = (site?.data.url ?? 'https://solidgraph.dev').replace(/\/$/, '');
  const env = await import('astro:env/server');
  const isNoIndex = isStagingNoIndex(env.SITE_ENV, import.meta.env.PUBLIC_NOINDEX);

  const content = isNoIndex
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
