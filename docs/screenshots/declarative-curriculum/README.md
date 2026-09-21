# Declarative curriculum interface checks

These captures use the production PWA built from canonical MDX/YAML/JSON, with a
fresh browser profile and intercepted synthetic API responses. No personal data
or production API is used. The migration preserves the existing React interface.

Run `npm run web:build`, start the preview on loopback port 4196 with
`FOUNDATIONS_API_TARGET=http://127.0.0.1:18996 npm run preview --prefix web -- --port 4196`,
then run `npm run test:e2e -- mdx`. Set `PLAYWRIGHT_MODULE` and `CHROME_BIN`
to an installed local Playwright module and Chromium executable when necessary.
The API target is intentionally an unused loopback endpoint; the test intercepts
every API request.

The check opens the explicit MDX figure, expands and closes it, edits an exercise
and restores its draft after reload, selects a quick-check answer, and advances
a graph figure frame. It checks all four subjects and captures desktop
(1440×1000) and phone (390×844) layouts. Sources remain collapsed. Screenshots
were visually inspected for readable math, usable controls and phone wrapping.
Server grading, frozen review history and offline behavior are covered separately
by the existing Go and web tests; synthetic API responses are not grading proof.

- [Calculus figure, desktop](calculus-figure-desktop.png)
- [Calculus exercise and restored draft, desktop](calculus-exercise-desktop.png)
- [Discrete mathematics graph, second frame](graph-interaction-desktop.png)
- [Calculus figure, phone](calculus-figure-phone.png)
- [Probability figure, phone](probability-figure-phone.png)
- [Linear algebra, phone](linear-algebra-phone.png)
