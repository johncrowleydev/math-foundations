# Deterministic assessment contract

Choice and structured assessments use authored data and bounded validators in both the offline client and Go server. They never fall back to model grading. General attempts, history, and retry behavior are documented in [grading](grading.md); this guide covers authoring and implementation contracts.

## Canonical definitions

Edit the existing JSON files directly:

| Source                                              | Purpose                                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `content/choice-exercises.json`                     | Stable lesson/exercise identity, inspected source hash, rationale, options, correct option, and baseline feedback. |
| `content/choice-feedback.json`                      | Per-option explanations, checked against the current prompt, answer, and option text; overrides baseline feedback. |
| `content/knowledge-check-exercises.json`            | Stable exercise IDs for quick checks at their existing teaching locations.                                         |
| `content/deterministic-exercises.json`              | Structured assessments for discrete mathematics.                                                                   |
| `content/deterministic-linear.json`                 | Linear algebra assessments.                                                                                        |
| `content/deterministic-algorithms.json`             | Algorithm-related assessments.                                                                                     |
| `content/deterministic-calculus.json`               | Calculus assessments.                                                                                              |
| `content/deterministic-probability-statistics.json` | Probability and statistics assessments.                                                                            |

Dedicated Review definitions also embed assessments in their canonical JSON; see [Review authoring](review-system.md#authoring).

A structured exercise entry contains `lesson`, `id`, `sourceHash`, `rationale`, `assessment`, and `fixtures`. Optional `instructions`, `prompt`, and `answer` override the displayed task; an overridden answer must match correct feedback. Source hashes pin the original instructions, prompt, math, and answer. The build rejects unknown IDs, duplicate/conflicting grading methods, stale source hashes, invalid definitions, and mismatched fixtures. Reinspect the complete task and its sources before updating hashes; follow [source requirements](content-sources.md).

Preserve every requirement in the prompt: requested explanations, calculations, constructions, and proofs cannot be dropped to make an exercise deterministic. Keep stable lesson slugs, exercise IDs, quick-check placements, and evidence depth. Wrong choice feedback should explain the selected misconception and offer a useful next step; correct feedback should explain the accepted reasoning.

Each structured definition needs accepted and rejected fixtures. A fixture contains `response` and exactly one expected outcome: `verdict: "correct"`, `verdict: "incorrect"`, or `error: true` for input guidance. Include malformed/incomplete input and consequential domain or boundary cases. Definitions and their fixtures are validated by `tools/content/deterministic-exercises.ts`; builds compile runtime output rather than generating canonical content.

## Shared response model

`shared/assessment.ts` defines `Assessment`, `AssessmentRequirement`, and `StructuredResponse`. An assessment has version `1`, inputs, requirements, correct/incorrect feedback, and evidence metadata. Each requirement names a validator, response field IDs, bounded JSON parameters, and a description; it may specify its own evidence level.

| Input kind               | Response value                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `text`, `math`, `select` | String; selections use authored option IDs.                                                   |
| `boolean`                | Boolean; `false` is an answer and `null` is blank.                                            |
| `multiselect`            | Array of option IDs; explicit `[]` is an empty answer, while absence is incomplete.           |
| `grid`                   | Separate editable cell IDs with text/boolean values; given cells are presentation only.       |
| `interval`               | Four generated fields: `<id>.lower`, `<id>.upper`, `<id>.leftClosed`, and `<id>.rightClosed`. |

Labels support inline math. An exercise's `assessment` and `choice` are mutually exclusive. Structured submissions use `mode: "structured"` and `response`; text, media, and ink scratchwork are not submitted for grading. Drafts retain that scratchwork separately.

The browser fingerprints the effective question and assessment. A changed definition preserves prior responses in `earlierWork` instead of reinterpreting them under new controls. Server-owned `presentation` returns the frozen question/assessment for history and offline caching. Historical attempts and issued Review questions retain their original definitions.

Evidence distinguishes recognition, production, and reasoning, plus interaction cost and input capabilities. Variant-specific definitions retain their own evidence. Deterministic formatting must not lower a deeper Review target's required evidence.

## Validator implementation

`shared/deterministic.ts` provides `validateAssessment(unknown)` and `gradeAssessment(assessment, response)`. The latter returns a correct/incorrect result with requirement satisfaction, or throws `InputError` for malformed, incomplete, unsupported, or unresolved input. Input guidance does not create a mathematical attempt. The server implements the same validators in `server/deterministic*.go`, independently validates submissions, and rejects unsupported modes instead of sending them to a provider.

Common validators include `boolean`, `term`, `selection`, `exact`, `tuple`, `matrix`, `boolean-formula`, and `expression`. The registry and its imported modules define the supported bounded validators for logic, sets, relations, graphs, linear algebra, sequences, recurrence, asymptotics, and calculus. Use an existing definition and shared fixtures as the parameter reference; validator names are data, never executable scripts.

Implement a new validator in both TypeScript and Go before authoring content that uses it. Add conformance cases under `tests/grading/fixtures/`, including equivalent answers, true errors, unsupported syntax, and invalid definitions. Existing provider-trap tests cover submission, retry, Review, and restoration. Catalog readiness and deterministic readiness are independent of provider readiness.

The exact-arithmetic parser returns input guidance for an explicitly numerical zero raised to zero, including expressions whose base and exponent both evaluate to zero. Symbolic `x^0`, nonzero constants raised to zero, and `0!` remain supported. This is the parser's bounded input policy, not a convention for every mathematical context.

## Calculus expressions and antiderivatives

The `calculus-expression` and `antiderivative` validators use the existing version-1
assessment and one `math` field. They run offline in TypeScript and on the Go
server. Neither validator creates provider jobs or falls back to AI grading.

For a derivative, partial derivative, Taylor polynomial, or other formula:

```json
{
  "validator": "calculus-expression",
  "fields": ["answer"],
  "params": {
    "variables": ["x"],
    "expected": "1/(2*sqrt(x))",
    "domain": { "positive": ["x"] }
  }
}
```

For an indefinite integral:

```json
{
  "validator": "antiderivative",
  "fields": ["answer"],
  "params": {
    "variable": "x",
    "integrand": "1/x",
    "mode": "family",
    "domain": { "positive": ["x"] }
  }
}
```

`family` requires a freely additive `C` (for example `ln(x)+C`). `particular`
accepts any particular antiderivative and excludes `C`. `initial-value` additionally
requires `initial: {"at":"1", "value":"2"}` and checks the answer and domain at
that point. Initial conditions are exact constants. Use separate requirements for
components of a vector, gradient, or matrix so every requested component is checked.

Domain facts have three optional lists: `positive`, `nonnegative`, and `nonzero`.
Each entry is an expression such as `x`, `1-x^2`, or `cos(x)`. State the corresponding
restrictions in the question, and state a connected interval for an antiderivative
problem. Interval prose is not parsed: encode the facts the checker needs. The
expected formula's natural domain (or the integrand's domain) also applies. The
checker retains restrictions before algebraic cancellation; a submitted formula
with an additional unproved restriction produces input guidance. Simple signs,
powers, products, positive scalar multiples of known facts, sums of nonnegative
quantities, and positivity of exponentials
are proved exactly. This is a bounded domain checker, not a general inequality solver.

Supported notation includes exact rational and radical constants, `pi`, `e`, the
declared variables, arithmetic, implicit multiplication, powers, `sqrt`, `abs`,
`sin`, `cos`, `tan`, `sec`, `csc`, `cot`, `asin`/`arcsin`, `acos`/`arccos`,
`atan`/`arctan`, `exp`, and natural logarithm `ln`. Function arguments use
parentheses; common TeX function names, braces, fractions, and `\left`/`\right`
are accepted. Use `sin(x)^2`, rather than the unsupported shorthand `sin^2(x)`.

Equivalence uses exact rational polynomial arithmetic over normalized function
atoms. Square-root, absolute-value-square, and Pythagorean relations, reciprocal
trigonometric functions, sine/cosine double-angle identities, positive rational
scaling of square roots, exponential products/sums, and `ln(exp(u))`/`exp(ln(u))`
are supported with their domain restrictions. Antiderivatives are checked by
symbolic differentiation, including chain, product, quotient, and inverse-function
rules. No numerical sampling proves an identity. General trigonometric addition
formulas and unrestricted logarithm identities are outside this bounded normalizer;
use the supported forms when authoring answers. General noninteger powers require
positive bases, except square roots/positive half-powers in formula answers.

Limits are 2,048 source characters, 256 tokens, nesting depth 24, six declared
variables, 64 function atoms, and numerical exponents between -32 and 32. Existing
exact-arithmetic size limits and an additional symbolic work limit apply. Unsupported
notation, unresolved domain restrictions, and exceeded bounds return input guidance.
The shared `calculus-fixtures.json` corpus verifies browser/server conformance,
and the existing provider-trap tests cover new, retried, reviewed, and restored attempts.

For a supported form that does not normalize to the authored answer, a remaining
nonzero rational/algebraic residual establishes an incorrect response. The checker
also recognizes coefficient, sign, and chain-factor mistakes expressed using the
same normalized function terms. It does not treat every unfamiliar function atom
as evidence of an error: if the remaining response introduces a different argument
within a function family, an unresolved nested composition, an unevaluated constant
function, or an unrecognized radical/inverse-function branch identity, it returns
input guidance asking for the standard taught form. Examples include
`cos(pi/2-x)` against `sin(x)` and `ln(x^2)` against `2*ln(x)` on a positive domain.
This conservative boundary is relative to the immutable authored normal form;
it is not a general-purpose theorem prover. Correct identities already covered
by the exact normalizer remain accepted. No sampling or provider fallback is used.

## Approximate numerical answers

`approximate-number` uses one existing math field and params
`{expected: string, tolerance: string, minimum?: string, maximum?: string}`.
Every parameter is an exact numeric expression; tolerance must be positive and
expected must satisfy any inclusive bounds. Unknown parameters are rejected.
Multiple endpoints or table cells use separate requirements.

The answer is correct when its exact distance from `expected` is at most
`tolerance` and it satisfies `minimum` and `maximum`. Bounds are checked separately:
with expected `0`, tolerance `0.0001`, and minimum `0`, a negative probability is
incorrect even inside the tolerance. Both tolerance boundaries are inclusive;
this is a tolerance check, not a rule requiring a particular number of typed digits.
For example expected `0.3333`, tolerance `0.00005`, minimum `0`, maximum `1`
accepts `0.3333` and `1/3`. Use a tolerance appropriate to the precision requested
and any supplied table. Do not impose probability bounds on signed statistics.

The existing bounded exact parser supports decimals, fractions, arithmetic,
integer powers, factorials, binomial coefficients, and supported square roots.
Exact rational/radical sign comparisons determine tolerance membership in both
TypeScript and Go; no floating-point sampling proves symbolic equivalence.
Scientific notation, percent signs, distribution functions, and transcendental
numeric expressions are unsupported here and return input guidance, without an
attempt or provider fallback. Prompts must state units (for example decimal
probability or percentage points). Supplied distribution tables and critical
values support calculations; this validator does not compute CDFs or quantiles.
Use `exact` or `calculus-expression` when an exact expression is the objective.
