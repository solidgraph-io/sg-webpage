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
  submittingLabel?: string;
  privacyNote?: string;
  successMsg?: string;
  confirmTitle?: string;
  formAction?: string;
  contactState?: string;
  turnstileSiteKey?: string;
}
