export interface BentoItem {
  iconId: string;
  text: string;
  wide?: boolean;
}

export interface BentoFeature {
  title: string;
  text: string;
}

export interface PainPointsProps {
  eyebrow?: string;
  heading: string;
  intro?: string;
  items: BentoItem[];
  feature: BentoFeature;
}
