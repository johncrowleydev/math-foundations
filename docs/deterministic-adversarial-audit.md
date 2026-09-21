# Final deterministic-grader adversarial audit

Audited 2026-09-20 from `main` at `3719ac2`. This pass adds a new independently derived corpus, inspects the bounded checker implementations, and fixes nine concrete defects. It does not add curriculum or Review content, change assessment versions or exercise IDs, or modify stored attempts and frozen definitions.

## Method and scope

The new [shared corpus](../tests/grading/fixtures/deterministic-adversarial-corpus.json) contains **1,166 cases across all 36 registered validator families**, using 107 compactly referenced assessment definitions. Every family has correct, incorrect, and input-error cases. TypeScript and Go consume the identical response and expected outcome; passing both suites establishes verdict/input-error parity on this corpus, not a proof of equivalence for every possible input.

The [generator](../tools/verification/deterministic-adversarial.py) imports no checker and never uses an authored answer as an oracle. Two concrete prompt-compliance regressions copy their actual assessment schemas from the authoring definitions; their expected outcomes follow independently from the stated recurrences. Its oracles use direct integer arithmetic, Python sets, pair composition, and permutation enumeration. In particular:

- all 256 pairs of relations on a two-element carrier, independently composing ordered pairs;
- 216 candidate transitivity witnesses for every reflexive symmetric relation on three elements;
- all 64 pairs of subsets of a three-element universe;
- all 27 functions from a three-element domain to a three-element codomain, computing fiber sizes directly;
- six DAGs with every topological order enumerated independently, then missing/duplicate/wrong orders;
- controlled polynomial products, power-rule derivatives and antiderivatives, incorrect coefficients, missing/additive constants, and removable singularities;
- rational and radical tolerance boundaries, just-outside values, separate probability bounds, nonfinite values and unsupported numeric syntax;
- exact null-space constructions, redundant/wrong-shaped bases, affine solution families, zero eigenvectors, eigenpair order/scaling, rectangular SVD sign freedom, and best-rank counterexamples.

Additional direct cases cover alternate logical forms, alpha-renaming and shadowing, quantifier order, reordered/duplicate set elements, structured Boolean false and empty selections, negative residues, recurrence lags, monotone asymptotic witnesses, interval endpoints, inverse branches, Unicode/ASCII forms, whitespace, malformed delimiters, zero denominators, unsupported syntax, and unrequested response fields. These are additional adversaries rather than renamed copies of existing fixtures. The existing broader shared fixtures, definition checks and provider traps remain in place.

## Findings and fixes

No BLOCKING finding was identified in this scope. All nine findings below have minimal shared regression cases and targeted negative controls.

| ID    | Severity | Family                                                                                                           | Reproduction on baseline                                                                                                                                     | Independent reason and fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | -------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DG-01 | HIGH     | `boolean-formula`, shared Boolean parser                                                                         | Expected `p -> q`; response `not p or q` returned input-error in TypeScript and correct in Go. `⇒`, `⇔`, uppercase TeX arrows and TeX spacing also differed. | Implication is equivalent to `!p or q`; the browser's own guidance advertised `not`. TypeScript now recognizes these existing server forms. This fixes an actual offline/server mismatch.                                                                                                                                                                                                                                                                                                                                  |
| DG-02 | MEDIUM   | `expression`                                                                                                     | Expected `x`; `(x^3+x)/(x^2+1)` was incorrect in both implementations.                                                                                       | Factor the numerator as `x(x²+1)`. The denominator is positive for every real `x`, so cancellation changes no domain. Both checkers now exactly recognize a nonzero constant plus same-sign even monomials. Controls retain exclusions for `x²-1`, `x²+y²`, and `x²+y+2`. The real-domain proof is enabled only for ordinary real expression grading; a quantified complex-domain control retains the roots of `z²+1`.                                                                                                     |
| DG-03 | MEDIUM   | `calculus-expression`, shared calculus domain proof                                                              | Expected `1`; `(x^2+1)/(x^2+1)` returned input guidance in both implementations.                                                                             | The existing sign rules already prove `x²+1 > 0`, but the nonzero sum branch never used that result. Both implementations now let a positive sum establish nonzeroness. `x/x` and `cos(x)^2/(1-sin(x)^2)` still return guidance because they introduce holes.                                                                                                                                                                                                                                                              |
| DG-04 | MEDIUM   | `boolean-formula`, shared Boolean parser                                                                         | Expected `p -> q`; `{p -> q)` was correct in TypeScript but an input-error in Go.                                                                            | The browser converted both brace types to parentheses before parsing and lost matching information. It now preserves delimiter types and requires matching closure. Valid braces remain supported.                                                                                                                                                                                                                                                                                                                         |
| DG-05 | MEDIUM   | `graph`                                                                                                          | For an Euler circuit on triangle `a,b,c`, `a,b,c,a)` was accepted as correct by both implementations.                                                        | An unmatched delimiter is malformed input. Both implementations previously stripped all grouping characters. They now validate balanced, matching grouping before normalizing the list. Valid reversed/rotated circuits and Unicode arrows remain accepted.                                                                                                                                                                                                                                                                |
| DG-06 | MEDIUM   | `finite-relation`                                                                                                | For a reflexive/symmetric/not-transitive construction on `{0,1,2}`, relation `{}` plus witness `(0,1` was recorded as incorrect in both implementations.     | The relation's failed reflexivity short-circuited before parsing the malformed witness. Both implementations now parse the witness before any mathematical verdict. Malformed input produces guidance rather than an attempt; a well-formed but incorrect relation still grades incorrect.                                                                                                                                                                                                                                 |
| DG-07 | MEDIUM   | `exact` source parsing; Sequences/Summations `sequences-and-summations-18`, Recurrences `recurrence-relations-8` | The prompts expressly avoid `0^0`, but `{value-1: "9*0^0", value-2: "0"}` and `{answer-1: "7*0^0", answer-2: "4"}` were correct.                             | Their initial terms are explicitly 9 and 7; later values are 0 and 4. Returning correct for the prohibited form defeats the prompt condition. Both source parsers now return input guidance when an exponent and its evaluated base are both zero. The actual assessment definitions are shared regression fixtures. Internal polynomial powers, `x^0`, `2^0` and `0!` retain existing behavior. This is a supported-input policy motivated by these prompts, not a claim of mathematical consensus on every use of `0^0`. |
| DG-08 | MEDIUM   | `exact` shared numeric parser                                                                                    | `binomial(5,2)` for expected `10` was correct in Go but input-error in TypeScript.                                                                           | Both implementations already support binomial coefficients, and Go additionally recognized the full-word alias. TypeScript now accepts the existing server alias, including implicit multiplication.                                                                                                                                                                                                                                                                                                                       |
| DG-09 | MEDIUM   | `exact` shared numeric parser                                                                                    | `binom(5,1001)` for expected `0` was correct in Go but input-error in TypeScript.                                                                            | The bounded parser admits arguments only from 0 to 1000. Go checked the upper bound on `n` but omitted it on `k`. Go now applies the same bound to both. `binom(5,1000)` still returns zero under the existing out-of-range-count convention.                                                                                                                                                                                                                                                                              |

DG-01, DG-04, DG-08 and DG-09 are observed language discrepancies. DG-02 and DG-03 are valid-answer rejection defects. DG-05 accepted malformed syntax as a correct answer. DG-06 mislabeled malformed syntax as a mathematical miss. DG-07 violated an explicit prompt condition without miscomputing the stated recurrence values. No mathematically unequal, well-formed answer was accepted by the new controlled cases after these fixes.

## Family coverage

Counts refer only to the new corpus. `Input error` includes at least one unrequested-field case for each assessment definition, in addition to the syntax/domain cases described above.

| Validator               | Correct | Incorrect | Input error | Total |
| ----------------------- | ------: | --------: | ----------: | ----: |
| `antiderivative`        |      14 |        26 |          14 |    54 |
| `approximate-number`    |      23 |        16 |          32 |    71 |
| `asymptotic-bound`      |      10 |        12 |           2 |    24 |
| `binomial-sum`          |       2 |         2 |           2 |     6 |
| `boolean`               |       1 |         1 |           3 |     5 |
| `boolean-formula`       |       9 |         3 |           8 |    20 |
| `boolean-model`         |       1 |         3 |           2 |     6 |
| `boolean-property`      |       2 |         2 |           2 |     6 |
| `calculus-expression`   |      17 |        15 |          20 |    52 |
| `composition`           |       2 |         2 |           2 |     6 |
| `elementary-expression` |       2 |         2 |           2 |     6 |
| `exact`                 |      12 |         6 |          13 |    31 |
| `expression`            |      20 |        31 |          20 |    71 |
| `finite-map`            |      18 |        10 |           2 |    30 |
| `finite-relation`       |     163 |       311 |           4 |   478 |
| `graph`                 |       8 |        14 |          17 |    39 |
| `indexed-expression`    |       2 |         2 |           2 |     6 |
| `inequality`            |       3 |         3 |           2 |     8 |
| `integer-class`         |       3 |         2 |           2 |     7 |
| `integer-list`          |       2 |         3 |           2 |     7 |
| `interval`              |       1 |         1 |           2 |     4 |
| `linear`                |      12 |        25 |          20 |    57 |
| `matrix`                |       2 |         2 |           2 |     6 |
| `nested-object`         |       2 |         2 |           2 |     6 |
| `quantified-formula`    |       4 |         4 |           6 |    14 |
| `recurrence`            |       2 |         2 |           2 |     6 |
| `selection`             |       1 |         2 |           3 |     6 |
| `sequence-pair`         |       5 |         5 |           2 |    12 |
| `set`                   |       2 |         3 |           2 |     7 |
| `set-expression`        |       3 |         2 |           2 |     7 |
| `set-model`             |      19 |        45 |           2 |    66 |
| `square-inverse`        |       1 |         1 |           2 |     4 |
| `summation`             |       1 |         3 |           2 |     6 |
| `term`                  |       1 |         2 |           2 |     5 |
| `tuple`                 |       3 |         4 |           4 |    11 |
| `witness`               |       5 |         9 |           2 |    16 |

## Remaining bounded behavior

- These are finite languages and bounded exact procedures, not a general computer algebra system or theorem prover. Passing the shared corpus does not establish universal language parity or certify every subcase of every construction validator.
- General trigonometric addition and logarithm identities remain outside the calculus normalizer. For example `cos(pi/2-x)` against `sin(x)` receives input guidance rather than a false mathematical rejection. The corpus explicitly preserves that boundary.
- The real rational-domain improvement proves only the documented same-sign even-monomial family. General real polynomial zero-set equivalence is still outside the domain checker. Other mathematically valid rational presentations may require rewriting into a supported form; the ordinary expression checker can classify an unproved domain equivalence as incorrect. This residual limitation is not evidence that arbitrary rational equivalence has been solved.
- Antiderivative `family` mode retains the existing explicit freely additive `C` contract: derivative with respect to `C` must equal one. Rescaled/reparameterized constants are not newly admitted. General piecewise antiderivatives and endpoint differentiability arguments remain outside its syntax.
- Requested representation is part of some tasks: `55` does not satisfy a request to construct the summation `sum(k=1..5) k²`, and an evaluated binomial coefficient does not satisfy a required binomial decomposition. Tests intentionally distinguish value equality from satisfying the requested representation.
- Approximate-number grading still uses exact inclusive tolerance comparisons, with independent inclusive bounds. Scientific notation, percentages, CDF calls and transcendental numerical expressions receive guidance. No float sampling or provider fallback was added.
- Internal polynomial arithmetic retains the algebraic zero-exponent convention, and symbolic `x^0` still normalizes to one. The new guard is at the ordinary exact-arithmetic source boundary for an evaluated zero base and zero exponent; it does not globally change polynomial or calculus normalization. No current assessment parameter or existing fixture was found to require an explicit numerical `0^0`; the only matching assessment text was feedback telling learners to avoid it.

## Validation and reproduction

The TypeScript test asserts family coverage and all three outcome classes; Go runs the same materialized corpus and rejects unexpected error/verdict behavior. Existing server submission/provider traps cover all 36 active families, retries, rechecks, frozen Review and restored definitions without provider jobs. No review request, PR, push or merge was made by this audit worktree.

```sh
python3 tools/verification/deterministic-adversarial.py
npx prettier --write tests/grading/fixtures/deterministic-adversarial-corpus.json
npx tsx --test tests/grading/deterministic-adversarial.test.ts
(cd server && go test -run TestAdversarialConformance -count=1)
npm test
npm run typecheck
(cd server && go test -count=1 ./...)
(cd server && go test -race -count=1 ./...)
```

Validation on this branch: `npm test` passed all **2,002 tests**, including the **1,166 new adversarial cases** and their family/outcome coverage check, content/source validation and existing shared fixtures. `npm run typecheck`, `npm run format:check`, `go test -count=1 ./...`, and `go test -race -count=1 ./...` passed. The Go suite includes provider traps and frozen Review/restore regressions. The overall final-curriculum PR handoff records web build, browser/offline checks and combined CI results; this report does not claim those were performed by the grader-only worktree.
