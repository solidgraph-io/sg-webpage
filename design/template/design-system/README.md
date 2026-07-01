# SolidGraph — Design System

The single source of truth for the SolidGraph Solutions website. Everything is
plain HTML + CSS + one vanilla JS file — no build step, no framework, no
dependencies. Open any file directly.

## Architecture (atomic layers)

```
design-system/     ← foundations (tokens, base, motion, icons)
components/        ← atoms & molecules — one reusable piece per file
sections/          ← organisms — each page section as a standalone document
scripts/           ← behaviour (progressive enhancement)
assets/            ← logos & imagery
index.html         ← composes every section into the full page at runtime
```

Dependency direction is strictly one-way:
`sections` → `components` → `design-system/tokens`. A component never reaches
back into a section; a token never depends on anything.

## Foundations — `design-system/`

| File            | Purpose |
|-----------------|---------|
| `tokens.css`    | All CSS custom properties: color, elevation, radius, layout, motion, type. **Change brand values here and the whole site updates.** |
| `base.css`      | Reset, document defaults, typography (`.display`, `h1–h5`), `.container`, `.grad-text`, grain overlay, `.spotlight`. |
| `animations.css`| Scroll-reveal primitives (`[data-reveal]`) + every shared `@keyframes`. |
| `icons.svg`     | Canonical SVG sprite. Each `<symbol>` is referenced as `<use href="#i-name"/>`. |

### Design tokens (reference)

Color — `--ink` `--indigo` `--indigo-2` `--night` `--night-2` `--periwinkle`
`--peri-bright` `--lilac` `--lilac-2` `--white` `--muted` `--muted-d` `--line`
`--success` `--star`
Elevation — `--shadow-sm` `--shadow-md` `--shadow-lg`
Radius — `--radius` (18) `--radius-lg` (28) `--radius-xl` (40)
Layout — `--max` (1240px)
Motion — `--ease` `--ease-spring`
Type — `--font-sans` (Poppins)

## Components — `components/`

Each file documents itself in a header comment (dependencies + a usage
snippet). One atomic component per file:

`button` · `pill` · `eyebrow` · `section-head` · `logo` · `icon-box` ·
`badge` (badge / p-tag / chips) · `note-bar` · `marquee` · `floating-card`
(hero-float / badge-card) · `aurora` · `bento-card` · `pillar` · `step` ·
`plan-card` · `hosting-card` · `stat` · `testimonial-card` · `portfolio-card`
· `faq-item` · `form` · `cta-strip`

Icons: reference the sprite with `<svg width="16" height="16"><use href="#i-arrow"/></svg>`.
Available ids: `i-search i-phone-off i-template i-dollar i-code i-zap i-shield
i-trend i-pin i-mail i-clock i-arrow i-spark`.

## Sections — `sections/`

Each section is a **complete, standalone HTML document** you can open and
preview on its own. It links the foundation CSS + the component CSS it needs,
inlines the icon symbols it uses, holds section-only layout CSS in a `<style>`
block, and marks its root with `data-section="…"`.

```
01-nav  02-hero  03-marquee  04-pain-points  05-value  06-how-it-works
07-plans  08-testimonials  09-portfolio  10-about  11-faq  12-cta
13-contact  14-footer
```

## Behaviour — `scripts/interactions.js`

Exposes `window.SolidGraph.init(root)`. Auto-runs on `DOMContentLoaded` and is
idempotent, so it's safe to call again after injecting markup. Handles: scroll
reveal, sticky nav, cursor spotlight, magnetic buttons, hero 3D tilt, card
tilt, animated counters, and the how-it-works progress bar. Every routine is
null-safe → works on a single section page or the full composed page.

## Composition — `index.html`

`index.html` fetches every `sections/*.html`, rebases their `../assets/` paths,
lifts out each `[data-section]` root, appends them in order, then calls
`SolidGraph.init()`. It links all foundation + component CSS and inlines the
full sprite once. **Section markup is authored once, in `sections/`.**

## Editing recipes

- **Rebrand color / spacing** → edit `design-system/tokens.css` only.
- **Change how a card looks everywhere** → edit that one `components/*.css`.
- **Edit a section's copy or layout** → edit the matching `sections/NN-*.html`.
- **Add a section** → create `sections/NN-name.html` (root gets
  `data-section="name"`) and add its slug to the `SECTIONS` array in `index.html`.
- **Add an icon** → add a `<symbol>` to `design-system/icons.svg` and mirror it
  into the inline sprite in `index.html`.

> Preview must be served over http(s) (not `file://`) because `index.html`
> uses `fetch()` to compose sections. Standalone `sections/*.html` and
> `styleguide.html` open fine either way.
