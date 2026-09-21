# React MDX browser verification

Captured from the production build on September 21, 2026, at desktop (1440 × 1000)
and phone (390 × 844) viewport sizes. All six captures were visually inspected.

The repeatable `e2e/mdx.spec.ts` test removes every legacy lesson prose
and figure block from the fetched notebook metadata before the client receives it.
The visible lessons therefore require the compiled MDX/React rendering path. All
API traffic is intercepted; the entered answer and saved choices are synthetic
verification data, not learner work.

| Capture                                              | Verified interface                                        |
| ---------------------------------------------------- | --------------------------------------------------------- |
| [Calculus figure](calculus-figure-desktop.png)       | Actual React figure, SVG and expansion control            |
| [Calculus exercise](calculus-exercise-desktop.png)   | Actual React exercise, restored draft and revealed answer |
| [Graph interaction](graph-interaction-desktop.png)   | Figure after advancing its interactive frame              |
| [Calculus on phone](calculus-figure-phone.png)       | Responsive lesson and figure                              |
| [Probability on phone](probability-figure-phone.png) | Responsive probability figure and teaching card           |
| [Linear algebra on phone](linear-algebra-phone.png)  | Lesson heading, prose and math                            |

The harness also verifies authored assessment order and saved exercise keys,
quick-check choice restoration, formula and reference popovers, deep section URLs,
reload navigation, and a fresh launch with an existing reading bookmark. It is run
against a local production preview with `PLAYWRIGHT_MODULE` and `CHROME_BIN` pointing
to the available Playwright and Chromium installations.
