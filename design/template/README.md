# SolidGraph Website

Custom marketing site for **SolidGraph Solutions LLC**. Built as a modular,
no-build design system so it's easy to work on from Claude Code or any editor.

## Run it

Serve the folder over http (needed because `index.html` composes sections with
`fetch`), e.g.:

```bash
python3 -m http.server      # then open http://localhost:8000
```

- **`index.html`** — the full assembled marketing page.
- **`sections/NN-*.html`** — open any one to preview/edit a single section in isolation.
- **`styleguide.html`** — visual reference of tokens + every atomic component.

## Layout

```
index.html            full page (composes sections at runtime)
styleguide.html       living style guide
design-system/        tokens.css · base.css · animations.css · icons.svg · README.md
components/            one atomic component per .css file (23 components)
sections/              14 standalone section documents
scripts/               interactions.js  (window.SolidGraph.init)
assets/                logos
```

## Where to make changes

| I want to…                        | Edit                                           |
| --------------------------------- | ---------------------------------------------- |
| Rebrand colors / spacing / radius | `design-system/tokens.css`                     |
| Restyle a repeated element        | `components/<name>.css`                        |
| Change a section's copy or layout | `sections/NN-<name>.html`                      |
| Add / reorder sections            | `sections/` + `SECTIONS` array in `index.html` |
| Adjust behaviour / animations     | `scripts/interactions.js`                      |

Full architecture notes and token reference: **`design-system/README.md`**.

_Fonts: Poppins (Google Fonts). No other runtime dependencies._
