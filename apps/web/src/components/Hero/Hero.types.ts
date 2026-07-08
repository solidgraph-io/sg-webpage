export interface HeroFloat {
  iconId: string;
  label: string;
  sub: string;
  pos: 'f1' | 'f2';
}

export interface HeroPreview {
  url?: string;
  tag?: string;
  title?: string;
  body?: string;
  cta?: string;
  chips?: string[];
  logoSrc?: string;
}

export interface HeroCta {
  label: string;
  href: string;
  variant: 'primary' | 'ghost-light';
  icon?: boolean;
}

export interface HeroProps {
  pill?: string;
  title: string;
  subtitle?: string;
  ctas: HeroCta[];
  snippet?: string;
  preview?: HeroPreview;
  floats?: HeroFloat[];
}
