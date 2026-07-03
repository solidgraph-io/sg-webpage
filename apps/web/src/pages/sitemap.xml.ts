/**
 * sitemap.xml — SPEC-SEO-001/RF-5
 * Server endpoint; lists published pages.
 * Extend `pages` array when new routes are added.
 */

import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';

export const GET: APIRoute = async () => {
  const site = await getEntry('settings', 'site');
  const base = (site?.data.url ?? 'https://solidgraph.dev').replace(/\/$/, '');

  const pages = ['/'];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${base}${p}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
