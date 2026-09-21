# Calculus authorship

Calculus now follows discrete mathematics and linear algebra: a reading-only **00 Introduction** and **22 instructional lessons**, from limits through single-variable calculus, series, multivariable differentiation, double integrals, constrained optimization, and gradient descent. The sequence contains **1,117 practice problems**, **333 dedicated review questions**, **44 quick checks**, **162 contextual references**, and **eight figures**. Deeper reasoning tasks also enter the existing review system. Pacing is flexible; see [the curriculum plan](study-plan.md).

The canonical sources are directly authored `content/lessons/calc-*.mdx` and
`content/worksheets/calc-*.yaml`, with structured records in
`content/deterministic-calculus.json`, `content/evidence/calculus.yaml`,
`content/references/calculus.json`, and the shared review, figure, quick-check,
feedback, formula, typing, and source files under `content/`. MDX places explicit
`Figure`, `Exercise`, and `QuickCheck` components after their teaching. Edit these
documents and data directly, then run the normal `npm run content` build. The
former `scripts/authoring/calculus.mjs` writer and all its lesson/helper/feedback/
figure modules are removed; see [the migration report](declarative-curriculum-migration.md).
The lesson files compile directly to React through Vite's standard MDX plugin.
`Figure`, `Exercise`, and `QuickCheck` are registered React components; metadata
extraction for catalogs and grading is separate from rendering. See the
[component registration workflow](content-authoring.md#lesson-documents-and-interactive-components).

Source inspection and independent calculation records cover [differentiation](calculus-differentiation-inspection.md), [integration and series](calculus-integration-inspection.md), [multivariable differentiation](calculus-multivariable-inspection.md), and [integration and optimization in several variables](calculus-optimization-inspection.md). OpenStax supplies the primary pinpoint references, supplemented by Mathematics for Machine Learning. Citations support original explanations and exercises rather than implying textbook provenance. After inspecting a changed version, update only its inspected records following
[the source policy](content-sources.md) and [authoring workflow](content-authoring.md).
Normal builds never approve a source digest or historical inventory entry. The
former subject-wide inspection script is removed; the rendering migration retains inspection dates and verifies representation-only
digest changes against the previously inspected content, as recorded in the migration report.

The TypeScript and Go grading engines share bounded `calculus-expression` and `antiderivative` contracts. They preserve domain restrictions before cancellation and distinguish general families, particular antiderivatives, and initial-value answers. Exact normalization, differentiation, and documented identities establish equivalence; numerical sampling does not. Unsupported or unresolved identities return input guidance. See [the deterministic contract](deterministic-contract.md) for the supported grammar and limits. Reasoning and modeling judgments remain open-ended. The deterministic proportion is an authoring preference, without a calculus percentage gate or reporting subsystem.

Verification includes content/source and prerequisite validation, independently checked mathematical examples and figure coordinates, shared TypeScript/Go conformance fixtures, every authored deterministic answer fixture, web tests, typechecking, production build, formatting, and Go tests. Browser checks use an isolated local API and synthetic data: calculus submissions, incorrect-answer retries, restored work, offline persistence, dedicated review previews, and all figures at desktop and phone widths. The existing server provider-trap tests cover deterministic new submissions, retries, and frozen review instances. [Screenshots and reproduction instructions](screenshots/calculus/README.md) document the resulting interface.

Validation on September 20, 2026: all **791 content/shared-engine tests** and **77 web tests** passed; root typechecking and the web TypeScript production build passed; `go test -race -count=1 ./...` passed. Content/source validation retained all historical inspection records. The browser run checked **21 server-verified attempts**, including calculus offline retries and restored work, and captured both widths for every new figure. The standard production bundler reports its existing large-chunk advisory; the build and service-worker precache complete successfully.
