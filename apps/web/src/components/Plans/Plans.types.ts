export interface PlanItem {
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
}

export interface HostingItem {
  name: string;
  price: string;
  desc: string;
  items: string[];
}

export interface PlansProps {
  heading?: string;
  subheading?: string;
  note?: string;
  plans: PlanItem[];
  hosting: { heading: string; subheading?: string; cards: HostingItem[] };
}
