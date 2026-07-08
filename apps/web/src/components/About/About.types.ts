export interface Badge {
  iconId: string;
  title: string;
  subtitle: string;
  pos: 'b1' | 'b2' | 'b3';
}
export interface DiffEntry {
  iconId: string;
  title: string;
  text: string;
}
export interface City {
  name: string;
  note: string;
}
export interface AboutProps {
  eyebrow?: string;
  heading?: string;
  sub?: string;
  body: string[];
  visual: { badges: Badge[] };
  diffs: DiffEntry[];
  cities: City[];
}
