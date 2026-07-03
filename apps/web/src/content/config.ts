/**
 * Astro Content Collections — CMS-ready data layer (SPEC-CONTENT-001).
 *
 * Sveltia CMS mapping (EPIC-05):
 *   - settings/site.yaml → Sveltia "files" collection, singleton "site"
 *   - pages/home.yaml   → Sveltia "files" collection, singleton "home"
 * No schema changes needed when adding the Sveltia admin config.
 */

import { defineCollection } from 'astro:content';
import { SiteConfigSchema, HomeSchema } from './schemas';

export const collections = {
  settings: defineCollection({ type: 'data', schema: SiteConfigSchema }),
  pages: defineCollection({ type: 'data', schema: HomeSchema }),
};
