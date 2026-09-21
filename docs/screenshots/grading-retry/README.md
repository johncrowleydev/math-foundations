# Saved submission retry verification

These captures use an isolated local production build with synthetic saved work
and mocked API responses. They contain no learner answers and make no live grading
requests.

The fixture starts with a rejected original upload whose displayed error was
replaced by an older client's failed recheck. Clicking **Retry grading** sends the
original submission exactly once, preserving its ID, answer, timestamp, effort
metadata, and content version. No recheck request is sent. The mocked grade then
appears on the saved attempt. Desktop and phone captures were visually inspected.

| View    | Before retry                         | After recovery                             |
| ------- | ------------------------------------ | ------------------------------------------ |
| Desktop | [Failed attempt](desktop-before.png) | [Recovered attempt](desktop-recovered.png) |
| Phone   | [Failed attempt](phone-before.png)   | [Recovered attempt](phone-recovered.png)   |

After building, run a local production preview on port 4196, then execute:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs npm run test:e2e -- retry-grading
```

The unit tests separately cover effort-clock recovery after an old recheck hid the
original rejection, stale queued rechecks, repeated retry clicks, and retention of
confirmed grading history. Server tests verify that a missing attempt returns an
actionable message instead of a raw SQL error.

Retries retain the original content version and remain subject to normal server
validation. They do not silently rewrite an answer to fit a changed question or
bypass a catalog-version rejection.
