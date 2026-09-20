# Probability and Statistics interface verification

The browser check uses the production PWA build, an isolated local Go API, and a
temporary synthetic account. It does not use personal answers or live provider
credentials. Desktop captures use 1440 pixels; phone captures use 390 pixels.

The 39 images cover the reading-only Introduction, all thirteen figures, lesson
reading at both widths, a probability table, an approximate probability answer,
separately labeled interval endpoints, dedicated review, and restored offline
interval work, plus the optional typing help for vectors and estimates. The
script also retains the existing handwriting, history, and export/import checks.

Reproduce after `npm run web:build`:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs CHROME_BIN=/usr/bin/google-chrome node scripts/check-deterministic-ui.mjs
```

The script verifies local and server verdict agreement, an incorrect interval
submission and retry, saved answers after reload, offline grading, and absence of
model requests or media uploads. Separate server tests exercise frozen review
instances after catalog replacement and restoration with a provider trap.
Manual image inspection checks mathematical rendering, axis labels and ticks,
open/filled CDF endpoints, compact inputs, and phone layout.

The final run on 2026-09-20 passed all 25 server-verified attempts. The probability
and interval examples used the four decimal places requested in their prompts.
Both offline retry cases survived reload, and exported work restored correctly.
There were no browser runtime errors, model requests, or media uploads.

A focused follow-up using the same isolated browser setup opened “Typing this
math” in Bernoulli, Binomial, and Geometric Models (wide estimate hats) and
Covariance, Correlation, and Random Vectors (bold Latin and Greek symbols).
The four `probability-typing-*` captures show those examples at both widths;
rendering and horizontal-overflow checks passed.
