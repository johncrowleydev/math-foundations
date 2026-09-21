# Probability and Statistics authorship

The final subject follows calculus with a reading-only **00 Introduction** and
**22 instructional lessons**. It develops probability models, discrete and
continuous distributions, dependence, sampling, inference, and a bridge to
regression and model assessment. The subject includes **1,157 practice problems**,
**330 dedicated review questions**, **44 quick checks**, **145 contextual
references**, and **13 original figures**. Deeper practice tasks also enter the
existing review system. Pacing remains flexible in [the study plan](study-plan.md).

The canonical sources are directly authored `content/lessons/ps-*.mdx` and
`content/worksheets/ps-*.yaml`, with structured records in
`content/deterministic-probability-statistics.json`,
`content/evidence/probability-statistics.yaml`,
`content/references/probability-statistics.json`, and the shared review, figure,
quick-check, feedback, formula, typing, and source files under `content/`. MDX
places explicit `Figure`, `Exercise`, and `QuickCheck` components after teaching.
Edit these documents and data directly, then run `npm run content:build`. Stable
`probability-statistics-` identities and historical inspection records remain.
The former `scripts/authoring/probability-statistics.mjs` writer and all its
lesson/helper/assessment/source/figure modules are removed; see
[the migration report](declarative-curriculum-migration.md).
The lesson files compile directly to React through Vite's standard MDX plugin.
`Figure`, `Exercise`, and `QuickCheck` are registered React components; metadata
extraction for catalogs and grading is separate from rendering. See the
[component registration workflow](content-authoring.md#lesson-documents-and-interactive-components).

The source records cover [foundations](probability-foundations-inspection.md),
[distributions and sampling](probability-distributions-inspection.md),
[Introduction and inference](probability-inference-inspection.md), and
[regression and model assessment](probability-modeling-inspection.md).
Separate checks document [finite probability](probability-foundations-verification.md),
[distributions](probability-distributions-verification.md), and
[inference](probability-inference-verification.md). Pishro-Nik, OpenStax, and
Mathematics for Machine Learning provide the main references, supplemented by
An Introduction to Statistical Learning and Penn State's regression course.
The sources support original explanations and calculations, not copied textbook
exercises. Parameter conventions, assumptions, and approximation limits are explicit.

After inspecting changed mathematics and supporting passages, update only the
records actually inspected, following [the source policy](content-sources.md) and
[authoring workflow](content-authoring.md). Normal builds validate these facts;
they never approve them. The former subject-wide inspection script is removed,
and inspection dates remain unchanged. Representation-only digest changes are
verified against the previously inspected content, as recorded in the migration report.

The shared TypeScript/Go `approximate-number` validator compares exact arithmetic
against an authored value, positive absolute tolerance, and optional inclusive
bounds. Probability values use [0,1]; signed statistics remain signed. Confidence
endpoints have separate labeled fields, and table/matrix work uses existing grids.
Fixed exercises supply needed CDF and critical values and state rounding and units.
No runtime distribution engine is introduced. Existing exact and calculus graders
handle symbolic answers; unresolved equivalences return input guidance. For example,
some logarithm and cube-root rearrangements remain outside the inherited calculus
normalizer, as documented in the distribution verification record. They do not
silently invoke a provider. See [the grading contract](deterministic-contract.md).

Recognition, typed production, and reasoning retain distinct evidence levels.
Proofs, explanations, and modeling judgments remain open-ended when those are
the learning objectives. Roughly 70% deterministic grading is an authoring
preference; this subject adds no percentage gate or reporting mechanism.

Original Venn and Cartesian figures cover events, conditioning, PMFs/CDFs,
density areas, correlation, sampling spread, likelihood, interval coverage,
posterior updating, regression, and bootstrap distributions. Optional axis labels,
authored ticks, and marker labels extend the existing renderer. Coordinates and
captions are deterministic and source-inspected. [Interface screenshots](screenshots/probability-statistics/README.md)
record representative controls, review, reading, and every figure at desktop and
phone widths.

Final verification on 2026-09-20 passed all **835 content tests**, **77 web tests**,
TypeScript checking, the production PWA build, formatting, and the complete Go
race-test suite. Content tests include source validation, prerequisite order,
shared correct/incorrect grading fixtures, and optional TeX teaching coverage.
Independent checks confirmed that historical source and curriculum inspection
entries are unchanged. The browser run verified **25 server-graded attempts**,
including rounded answers, offline retries, reload, and export/import restoration,
without provider calls or media uploads. Existing server tests also checked frozen
review definitions after catalog replacement.

This subject builds on calculus PR #7, merged into `main` on 2026-09-20.
The probability/statistics pull request targets `main`.
