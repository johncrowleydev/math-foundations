# Calculus interface verification

Captured against the production build with an isolated local Go API and temporary synthetic account data. No personal answers or provider credentials are used.

`calculus-introduction-*` shows the reading-only introduction at 1440 and 390 pixels. `calculus-figure-*` captures all eight figures at both widths. The remaining images show exact constants, derivatives, antiderivative families, initial-value answers, dedicated review, and restored offline work.

Reproduce after `npm run web:build`:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs CHROME_BIN=/usr/bin/google-chrome npm run test:e2e -- deterministic
```

The browser script verifies server verdicts, retries, saved answers after reload, offline grading, review previews, and absence of model requests or media uploads. It also retains the existing structured-answer, handwriting, export/import, and history checks. Manual image inspection checks figure geometry, labels, mathematical rendering, compact answer controls, and phone layout.
