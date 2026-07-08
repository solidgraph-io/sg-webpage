export interface FootCol {
  heading: string;
  links: { label: string; href: string }[];
}
export interface FooterProps {
  brandLink?: string;
  tagline?: string;
  locations?: string[];
  cols?: FootCol[];
  copyright?: string;
}
