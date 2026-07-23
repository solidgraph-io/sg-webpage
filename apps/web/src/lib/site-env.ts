/**
 * site-env — pure predicate for SPEC-SEC-016/RF-4 (F-06, staging noindex).
 * Kept separate from astro:env so it's testable without Astro's runtime.
 */

/** Staging (runtime SITE_ENV) or the legacy build-time PUBLIC_NOINDEX flag. */
export function isStagingNoIndex(
  siteEnv: string | undefined,
  publicNoIndex: string | undefined,
): boolean {
  return siteEnv === 'staging' || publicNoIndex === 'true';
}
