export interface PlanCardProps {
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  delivery: string;
  bestFor: string;
  includes: string[];
  excludes?: string[];
  ctaLabel: string;
  ctaHref: string;
  popular?: boolean;
  delay?: string;
}
