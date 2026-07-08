export interface Pillar {
  num: string;
  iconId: string;
  title: string;
  text: string;
}

export interface Lead {
  strong: string;
  body: string;
}

export interface ValueProps {
  eyebrow?: string;
  heading: string;
  lead: Lead;
  pillars: Pillar[];
}
