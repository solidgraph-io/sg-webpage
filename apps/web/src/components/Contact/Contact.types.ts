export interface AltRow {
  iconId: string;
  label: string;
  sub: string;
}
export interface ContactProps {
  eyebrow?: string;
  heading: string;
  leads: string[];
  altHeading?: string;
  altRows: AltRow[];
  submitLabel?: string;
  privacyNote?: string;
  successMsg?: string;
  formAction?: string;
  contactState?: string;
  turnstileSiteKey?: string;
}
