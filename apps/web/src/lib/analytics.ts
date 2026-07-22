// Stable Umami event names (SPEC-ANALYTICS-001/RF-3). One name per funnel
// action, documented here as the single source of truth — components map
// their own hrefs/context to these instead of inventing ad-hoc strings.

/** Primary "request a quote" CTA — Nav, Hero and HowItWorks all point at #contact. */
export const CTA_QUOTE = 'cta_quote_hero';
/** "See Our Plans" / "See Plans" CTA — anything pointing at #plans. */
export const CTA_PLANS = 'cta_plans';
/** Per-plan "Get Started" CTA in a PlanCard (see cta-plan-start property `plan`). */
export const CTA_PLAN_START = 'cta_plan_start';

const BY_HREF: Record<string, string> = {
  '#contact': CTA_QUOTE,
  '#plans': CTA_PLANS,
};

/**
 * Maps a generic CTA's href to its stable Umami event name. Returns
 * `undefined` for hrefs with no defined conversion event (Astro omits the
 * `data-umami-event` attribute entirely when the value is undefined).
 */
export function ctaEventName(href: string): string | undefined {
  return BY_HREF[href];
}
