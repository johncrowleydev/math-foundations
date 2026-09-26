# Review layout stability

Synthetic local Review session while grading, captured at 1440 × 1000 and 390 × 844.
Navigation stays below the exercise. The original compact grading toolbar stays
below the submitted response and question. The answer area retains its occupied
height, and growing results preserve the visible navigation's scroll position.
Reserved space resets on task navigation or a change in screen width.

The `review-layout-stability` browser check measures visible control positions
through cached refreshes, loading indicator changes, coverage updates, submission,
transcription, feedback, overview completion, and session completion. It also
asserts the original control order and checks resizing without horizontal overflow
or browser errors. Screenshots were visually inspected.

```sh
npm run test:e2e -- review-layout-stability
```
