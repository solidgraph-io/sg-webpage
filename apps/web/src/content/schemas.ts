/**
 * Pure Zod schemas for Content Collections — no Astro runtime dependency.
 * Imported by config.ts (collection wrappers) and by unit tests directly.
 *
 * Design rule (exactOptionalPropertyTypes):
 *   Fields that are ALWAYS provided in the YAML are declared required in Zod.
 *   This means the inferred type is T (not T | undefined), which is assignable
 *   to the component's optional prop (prop?: T) under exactOptionalPropertyTypes.
 *   Genuinely absent fields (e.g., plan.excludes for Enterprise) stay optional.
 */

import { z } from 'zod';

// ── Shared primitives ─────────────────────────────────────────────────────────

const NavLink = z.object({ label: z.string(), href: z.string() });

// icon: required z.boolean() — use false in YAML for CTAs without icon.
// This avoids boolean | undefined, which conflicts with exactOptionalPropertyTypes.
const HeroCta = z.object({
  label: z.string(),
  href: z.string(),
  variant: z.enum(['primary', 'ghost-light']),
  icon: z.boolean(),
});

const HowCta = z.object({
  label: z.string(),
  href: z.string(),
  variant: z.enum(['white', 'ghost-light']),
  icon: z.boolean(),
});

const HeroFloat = z.object({
  iconId: z.string(),
  label: z.string(),
  sub: z.string(),
  pos: z.enum(['f1', 'f2']),
});

const Badge = z.object({
  iconId: z.string(),
  title: z.string(),
  subtitle: z.string(),
  pos: z.enum(['b1', 'b2', 'b3']),
});

// ── SiteConfig (settings/site) ────────────────────────────────────────────────

export const SiteConfigSchema = z.object({
  name: z.string(),
  legalName: z.string().optional(),
  url: z.string().url(),
  logo: z.string(),
  locations: z.array(z.object({ city: z.string(), region: z.string() })),
  contact: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  sameAs: z.array(z.string()).optional(),
  defaultSeo: z.object({
    title: z.string(),
    description: z.string(),
    ogImage: z.string().optional(),
  }),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

// ── HomeData (pages/home) ─────────────────────────────────────────────────────

export const HomeSchema = z.object({
  // seo is optional — if absent, defaults from SiteConfig are used
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().optional(),
    })
    .optional(),

  nav: z.object({
    links: z.array(NavLink),
    cta: NavLink,
  }),

  // Hero: all fields that home.yaml always provides are required (T, not T|undefined).
  hero: z.object({
    pill: z.string(),
    title: z.string(),
    subtitle: z.string(),
    snippet: z.string(),
    ctas: z.array(HeroCta),
    preview: z.object({
      url: z.string(),
      tag: z.string(),
      title: z.string(),
      body: z.string(),
      cta: z.string(),
      chips: z.array(z.string()),
      logoSrc: z.string(),
    }),
    floats: z.array(HeroFloat),
  }),

  marquee: z.object({
    items: z.array(z.object({ label: z.string() })),
  }),

  painPoints: z.object({
    heading: z.string(),
    intro: z.string(),
    items: z.array(z.object({ iconId: z.string(), text: z.string() })),
    feature: z.object({ title: z.string(), text: z.string() }),
  }),

  value: z.object({
    heading: z.string(),
    lead: z.object({ strong: z.string(), body: z.string() }),
    pillars: z.array(
      z.object({ num: z.string(), iconId: z.string(), title: z.string(), text: z.string() }),
    ),
  }),

  howItWorks: z.object({
    steps: z.array(
      z.object({ num: z.string(), title: z.string(), dur: z.string(), text: z.string() }),
    ),
    ctas: z.array(HowCta),
  }),

  plans: z.object({
    items: z.array(
      z.object({
        name: z.string(),
        tagline: z.string(),
        price: z.string(),
        priceNote: z.string(),
        delivery: z.string(),
        bestFor: z.string(),
        includes: z.array(z.string()),
        // excludes and popular are genuinely optional across plans — Enterprise has none
        excludes: z.array(z.string()).optional(),
        ctaLabel: z.string(),
        ctaHref: z.string(),
        popular: z.boolean().optional(),
      }),
    ),
    hosting: z.object({
      heading: z.string(),
      subheading: z.string(),
      cards: z.array(
        z.object({
          name: z.string(),
          price: z.string(),
          desc: z.string(),
          items: z.array(z.string()),
        }),
      ),
    }),
  }),

  testimonials: z.object({
    stats: z.array(z.object({ value: z.string(), label: z.string() })),
    items: z.array(
      z.object({
        quote: z.string(),
        authorName: z.string(),
        authorRole: z.string(),
        initials: z.string(),
      }),
    ),
  }),

  portfolio: z.object({
    items: z.array(
      z.object({
        category: z.string(),
        title: z.string(),
        // location and tag: always present in home.yaml → required in schema
        location: z.string(),
        description: z.string(),
        tag: z.string(),
        thumbBg: z.string(),
        thumbInner: z.string(),
      }),
    ),
  }),

  about: z.object({
    visual: z.object({ badges: z.array(Badge) }),
    body: z.array(z.string()),
    diffs: z.array(z.object({ iconId: z.string(), title: z.string(), text: z.string() })),
    cities: z.array(z.object({ name: z.string(), note: z.string() })),
  }),

  faq: z.object({
    items: z.array(z.object({ question: z.string(), answer: z.string() })),
  }),

  ctaStrip: z.object({
    heading: z.string(),
    body: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
  }),

  contact: z.object({
    heading: z.string(),
    leads: z.array(z.string()),
    altRows: z.array(z.object({ iconId: z.string(), label: z.string(), sub: z.string() })),
  }),

  // footer: required (always in home.yaml); sub-fields required since home.yaml always provides them
  footer: z.object({
    brandLink: z.string(),
    tagline: z.string(),
    locations: z.array(z.string()),
    cols: z.array(
      z.object({
        heading: z.string(),
        links: z.array(z.object({ label: z.string(), href: z.string() })),
      }),
    ),
    copyright: z.string(),
  }),
});

export type HomeData = z.infer<typeof HomeSchema>;
