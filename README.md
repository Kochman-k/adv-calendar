# The Good Deal by Synerise — Advent calendar

Static site: open `index.html` or publish the folder with GitHub Pages.

- Day 1 unlocks on 1 December 2026 at local midnight, one new card per day.
- DEMO is on: `simulatedDay()` in `index.html` returns 5 (days 1–4 opened, day 5 new).
  Change it to `return null;` to use the real date.
- To test from another date, change `startDate()` in `index.html`
  (e.g. `return new Date(2026, 10, 26);` — months count from 0, so 10 = November).
- Day icons live in `assets/`.
