/**
 * robots.txt — SPEC-SEO-001/RF-6
 * noindex when PUBLIC_NOINDEX=true (staging).
 */

import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';

export const GET: APIRoute = async () => {
  const site = await getEntry('settings', 'site');
  const base = (site?.data.url ?? 'https://solidgraph.dev').replace(/\/$/, '');
  const isNoIndex = import.meta.env.PUBLIC_NOINDEX === 'true';

  const content = isNoIndex
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
