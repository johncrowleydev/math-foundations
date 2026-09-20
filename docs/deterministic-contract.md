# Implementation contract

Question and trusted catalog context gain `assessment?: Assessment` (mutually exclusive with choice). Shared definitions are in `shared/assessment.ts`. Structured submissions use `mode: "structured"`, `response: StructuredResponse`; no text/media/ink scratchwork is sent. Server-owned `presentation?: {question: Question; assessment?: Assessment}` is returned from stored context (question includes assessment for normal snapshots); browser caches it offline. Drafts have `response?`, `assessmentFingerprint?`, `earlierWork?` while retaining existing text/strokes/photos. Fingerprint effective question plus assessment. Historical attempts and frozen Review use their stored definition.

The shared TypeScript checker is `shared/deterministic.ts`: `validateAssessment(unknown): asserts value is Assessment`; `gradeAssessment(assessment, response): AssessmentResult` throws `InputError` for malformed/incomplete/unsupported syntax. Named validators are data only, with bounded JSON parameters. Go implements identical names/parameters; no evaluator scripts. Fixtures live in `shared/deterministic-fixtures.json`. Definition validation must reject unknown validators, invalid fields, absent requirements and invalid fixtures.

Initial validators: `boolean` params `{expected: boolean[]}`; `term` `{accepted: string[], caseSensitive?: boolean}`; `selection` `{expected: string[]}`; `exact` `{expected: string[]}` (one exact arithmetic expression per field); `tuple` `{expected: string[], ordered?:boolean}` (one typed tuple field); `matrix` `{expected: string[][]}` (typed matrix or row-major scalar fields); `boolean-formula` `{expected:string, variables:string[], form?:"nnf"|"no-implication"|"contrapositive", structure?:string}`; `expression` `{expected:string, variables:string[], domain?:string[]}`. Additional bounded mathematical validators must be coordinated with root, with shared fixtures before use. Labels may contain inline math; use Rich rendering. Empty selection is an explicit [] value, absence is incomplete. Boolean false is an answer; null is blank. Interval has four generated scalar keys (see helper).

Evidence level belongs to each assessment, including variant-specific definitions. Preserve deeper existing target requirements and history. No deterministic retry/recheck/restoration can create model jobs. A deterministic question with wrong/unsupported submission mode fails rather than falling back. Catalog and deterministic readiness are independent of model-provider readiness.

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
powers, products, sums of nonnegative quantities, and positivity of exponentials
are proved exactly. This is a bounded domain checker, not a general inequality solver.

Supported notation includes exact rational and radical constants, `pi`, `e`, the
declared variables, arithmetic, implicit multiplication, powers, `sqrt`, `abs`,
`sin`, `cos`, `tan`, `sec`, `csc`, `cot`, `asin`/`arcsin`, `acos`/`arccos`,
`atan`/`arctan`, `exp`, and natural logarithm `ln`. Function arguments use
parentheses; common TeX function names, braces, fractions, and `\left`/`\right`
are accepted. Use `sin(x)^2`, rather than the unsupported shorthand `sin^2(x)`.

Equivalence uses exact rational polynomial arithmetic over normalized function
atoms. Square-root, absolute-value-square, and Pythagorean relations, reciprocal
trigonometric functions, exponential products/sums, and `ln(exp(u))`/`exp(ln(u))`
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
