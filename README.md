# ponsu

A static site that lists every monoid of order 2 to 6 up to isomorphism (2, 7, 35, 228 and 2,237 of them) as Cayley tables, with common names for well-known ones and an interactive switch for each. The page is available in Japanese and English.

- `scripts/generate.js` — backtracking search over associative operation tables; writes `data.json` (run `npm run generate`, about a minute)
- `scripts/named.js` — well-known monoids built from their definitions (groups, chains, T₂, B₂¹, …), matched to the list up to isomorphism
- `monoids.js` — shared helpers: enumeration, canonical forms and structural properties
- `index.html` — renders the list, with filters and a right-regular-representation switch on each card

Every push to `main` deploys the site to GitHub Pages via GitHub Actions (Settings → Pages → Source must be "GitHub Actions"). The deploy replaces `__BUILD__` in `index.html` with the commit SHA so cached assets are never mixed across versions.
