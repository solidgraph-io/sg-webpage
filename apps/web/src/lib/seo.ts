/**
 * lib/seo.ts — SEO utilities (SPEC-SEO-001/INV-3)
 * Pure TypeScript; no Astro runtime or browser dependencies.
 * All business data comes from SiteConfig (Content Collection).
 */

import type { SiteConfig } from '../content/schemas';

export function buildLocalBusinessJsonLd(site: SiteConfig): string {
  const base = site.url.replace(/\/$/, '');
  const logoUrl = site.logo.startsWith('http') ? site.logo : `${base}${site.logo}`;

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.name,
    url: site.url,
    logo: logoUrl,
    areaServed: site.locations.map((l) => ({
      '@type': 'City',
      name: `${l.city}, ${l.region}`,
    })),
  };

  if (site.legalName) ld['legalName'] = site.legalName;
  if (site.contact?.email) ld['email'] = site.contact.email;
  if (site.contact?.phone) ld['telephone'] = site.contact.phone;
  if (site.sameAs && site.sameAs.length > 0) ld['sameAs'] = site.sameAs;

  return JSON.stringify(ld, null, 2);
}
