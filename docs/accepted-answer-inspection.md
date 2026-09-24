# Accepted-answer inspection — 2026-09-23

The reported review task required a quantified formula but revealed only an
English explanation. A second report showed a multiple-choice explanation
without identifying the correct option. Passing grading fixtures had not been
connected to the answer that learners actually saw.

## Scope and inspected changes

The initial audit checked 66 logical-formula lesson exercises (73 formula
requirements): 24 quantified-formula exercises and six Boolean-formula exercises
had no standalone accepted formula in their revealed prose/math. Four
set-expression exercises already had acceptable notation. Dedicated review
questions exhibited the same problem. The repair was expanded to every
structured assessment, not just those examples.

All 3,282 lesson assessments and 922 review assessment records (including template
exemplars and variants) now contain an explicit canonical `solution`. Each was
sourced from an existing authored correct fixture in `content/` and mathematical
fields were authored as equivalent standard TeX; no
solutions are generated from executable curriculum prose or inferred at runtime.
The full response is checked against every grading requirement together by the
TypeScript content build and by a Go regression over the published catalog.
These checks establish that the shown response is accepted; they are not a new
independent proof of every existing mathematical explanation.

A semantic comparison against the previous canonical JSON confirmed that lesson
identities, source pins, fixtures, expected values, grading requirements and input
shapes remain unchanged. Additional changes clarify 31 lesson questions and the
quantified review template's two formula variants. Named predicates and domains
are stated in the question, and the symbolic response requirement is explicit.
One misleading quantifier hint was corrected for an exercise requesting an
ordinary inequality. Existing model-answer prose is retained alongside the new
accepted response.

The deterministic coverage comparison preserves all identities, grading methods,
evidence levels, counts and source pins. Its differences are the catalog version
and the intentional prompt-change flags for those 31 lesson questions and two
review variants. Only those 31 curriculum inspection units were updated.

The source catalog's 71 affected lesson digests and 373 affected review-template
digests include the now-visible canonical solutions. Existing citation
assignments remain in place, with quantifier/function/set references added to
the relevant contradiction groups and divisibility support added to the
induction-hypothesis group. Reading documents, exercise placements, figures,
glossary, TeX instruction, evidence identities and generated review banks are
unchanged.

## Supporting passages inspected

The explanations are original applications of these definitions and rules, not
claims of copied textbook exercises. Pinpoint assignments are in
`content/sources.json`.

- Hammack, _Book of Proof_, §2.6, printed pp. 50–52: Boolean equivalence,
  contraposition, De Morgan, commutativity and associativity
  ([PDF p. 62](https://richardhammack.github.io/BookOfProof/Main.pdf#page=62)).
- §2.10, printed pp. 59–61: quantified negation and negated implication
  ([PDF p. 71](https://richardhammack.github.io/BookOfProof/Main.pdf#page=71)).
- §4.2, Definition 4.4, printed p. 116: integer divisibility witnesses
  ([PDF p. 128](https://richardhammack.github.io/BookOfProof/Main.pdf#page=128)).
- §5.1, printed pp. 128–129: contraposition
  ([PDF p. 140](https://richardhammack.github.io/BookOfProof/Main.pdf#page=140)).
- §7.3, printed pp. 151–153: existence and uniqueness
  ([PDF p. 165](https://richardhammack.github.io/BookOfProof/Main.pdf#page=165)).
- §§1.5–1.6 and §8.2: set operations and elementwise inclusion
  ([PDF p. 30](https://richardhammack.github.io/BookOfProof/Main.pdf#page=30),
  [PDF p. 171](https://richardhammack.github.io/BookOfProof/Main.pdf#page=171)).
- §§12.1–12.2, Definitions 12.1 and 12.4: functions, injectivity and surjectivity
  ([PDF p. 236](https://richardhammack.github.io/BookOfProof/Main.pdf#page=236),
  [PDF p. 240](https://richardhammack.github.io/BookOfProof/Main.pdf#page=240)).
- MIT, _Mathematics for Computer Science_, §§3.3–3.4.2, §5.1 and §9.1:
  logical equivalence, induction hypotheses and divisibility
  ([PDF p. 67](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=67),
  [PDF p. 146](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=146),
  [PDF p. 349](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=349)).

## Rendering and compatibility

Reveals show complete accepted field values, with mathematical fields rendered
using the app’s TeX renderer and a Copy TeX control containing the exact accepted
source, followed by the explanation. Publication checks reject unrenderable TeX
and parser shorthand such as bare `exists`, `!=`, and `sqrt(...)`. Interval
endpoints receive the same TeX checks; infinite endpoints use `\infty`. Multiple-choice reveals name the actual keyed option. Inline
quick checks use the same exercise renderer. The Review Library shows structured
solutions as well.

TeX equivalence checks exposed missing normalization for quantified multiplication,
the variable theta, and empty-set notation for inconsistent affine systems; both
graders now accept those standard forms. Exponential normalization also leaked
expanded products out of denominators, causing `n/2^j` to represent the wrong
expression. Both parsers now preserve grouping, with correct reciprocal and
incorrect product regressions for positive, negative and fractional bases. Matrix
row separators now accept ordinary TeX spaces and source newlines in both graders
without weakening rejection of missing cells or repeated separators.

The solution is excluded from the existing draft fingerprint, preserving saved
responses when this display metadata is added. Go retains the optional field in
new archived presentations without rewriting historical snapshots. An offline
index in the existing notebook bundle supplies a verified solution to old frozen
reviews only when their complete input/grading contract still matches. Only
input hints are ignored in that lookup; labels, choices, grid givens and grading
requirements must match. The displayed supplement never changes the snapshot.

The original captured compatibility hashes remain in
`tests/content/fixtures/published-compatibility.json`; its inspected-update records
pin the intentionally changed artifacts separately to this repair and report.
No historical grading-version alias is changed.

Regression coverage includes missing, incomplete, invalid and mathematically
incorrect accepted responses; requested formula forms; mixed input types;
template and concrete variant publication; TypeScript/Go grading; immutable
attempts; saved draft fingerprints; frozen-review resolution; and desktop/phone
reveal-and-submit checks using the actual displayed canonical values.
