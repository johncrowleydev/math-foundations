# Implementation contract

Question and trusted catalog context gain `assessment?: Assessment` (mutually exclusive with choice). Shared definitions are in `shared/assessment.ts`. Structured submissions use `mode: "structured"`, `response: StructuredResponse`; no text/media/ink scratchwork is sent. Server-owned `presentation?: {question: Question; assessment?: Assessment}` is returned from stored context (question includes assessment for normal snapshots); browser caches it offline. Drafts have `response?`, `assessmentFingerprint?`, `earlierWork?` while retaining existing text/strokes/photos. Fingerprint effective question plus assessment. Historical attempts and frozen Review use their stored definition.

The shared TypeScript checker is `shared/deterministic.ts`: `validateAssessment(unknown): asserts value is Assessment`; `gradeAssessment(assessment, response): AssessmentResult` throws `InputError` for malformed/incomplete/unsupported syntax. Named validators are data only, with bounded JSON parameters. Go implements identical names/parameters; no evaluator scripts. Fixtures live in `tests/grading/fixtures/deterministic-fixtures.json`. Definition validation must reject unknown validators, invalid fields, absent requirements and invalid fixtures.

Initial validators: `boolean` params `{expected: boolean[]}`; `term` `{accepted: string[], caseSensitive?: boolean}`; `selection` `{expected: string[]}`; `exact` `{expected: string[]}` (one exact arithmetic expression per field); `tuple` `{expected: string[], ordered?:boolean}` (one typed tuple field); `matrix` `{expected: string[][]}` (typed matrix or row-major scalar fields); `boolean-formula` `{expected:string, variables:string[], form?:"nnf"|"no-implication"|"contrapositive", structure?:string}`; `expression` `{expected:string, variables:string[], domain?:string[]}`. Additional bounded mathematical validators must be coordinated with root, with shared fixtures before use. Labels may contain inline math; use Rich rendering. Empty selection is an explicit [] value, absence is incomplete. Boolean false is an answer; null is blank. Interval has four generated scalar keys (see helper).

Evidence level belongs to each assessment, including variant-specific definitions. Preserve deeper existing target requirements and history. No deterministic retry/recheck/restoration can create model jobs. A deterministic question with wrong/unsupported submission mode fails rather than falling back. Catalog and deterministic readiness are independent of model-provider readiness.

### Explicit numerical zero powers

The ordinary exact-arithmetic source parser returns input guidance when the
parsed base and exponent both evaluate to zero, including `0^0` and
`(2-2)^(3-3)`. The recurrence prompts `sequences-and-summations-18` and
`recurrence-relations-8` explicitly require answers that do not rely on that
notation; `9*0^0` and `7*0^0` must not bypass those instructions. This is a bounded
input policy, not a claim that every mathematical context uses the same convention.
Internal polynomial powers and symbolic `x^0` normalization retain their existing
algebraic convention; nonzero constants raised to zero and `0!` remain supported.

### Calculus expressions and antiderivatives

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

### Approximate numerical answers

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
