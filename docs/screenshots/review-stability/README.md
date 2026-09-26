# Review layout stability

Synthetic local Review session while grading, captured at 1440 × 1000 and 390 × 844.
Navigation precedes the task, grading actions occupy fixed slots, and the task and
page retain their occupied height so async updates cannot clamp the scroll position.
The retained height resets on task navigation or a change in screen width.

The `review-layout-stability` browser check measures control positions through
cached refreshes, loading indicator changes, coverage updates, submission,
transcription, feedback, overview completion, and session completion. It also
checks resizing between desktop and mobile without horizontal overflow or browser
errors. Screenshots were visually inspected.

```sh
npm run test:e2e -- review-layout-stability
```
