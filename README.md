# ponsu

A static site that lists every monoid of order 2, 3 and 4 up to isomorphism (2, 7 and 35 of them) as Cayley tables. The page is available in Japanese and English.

- `monoids.js` — enumerates all associative operation tables by brute force and picks one representative per isomorphism class
- `index.html` — renders the list, with filters for groups, commutative monoids, bands and monoids with a zero

Every push to `main` deploys the site to GitHub Pages via GitHub Actions (Settings → Pages → Source must be "GitHub Actions").
