export interface Step {
  num: string;
  title: string;
  dur: string;
  text: string;
}

export interface Cta {
  label: string;
  href: string;
  variant: 'white' | 'ghost-light';
  icon?: boolean;
}

export interface HowItWorksProps {
  eyebrow?: string;
  heading?: string;
  lead?: string;
  steps: Step[];
  ctas: Cta[];
}
