# Written review coverage inspection — 2026-09-23

The published curriculum declared 2,033 review targets; 244 concept/skill pairs
had no compatible question after response-format conversion. The repair compiles
187 existing canonical written exercises alongside the converted lesson tasks.
It does not reset schedules or change existing exercise identities, lesson
questions, assessments, evidence mappings, or issued review instances.

The complete written questions were inspected against the citations now assigned
in `content/sources.json`. All 128 discrete-mathematics and 59 linear-algebra /
calculus questions were checked, including their original calculations and
reasoning. Sources inspected include Hammack's _Book of Proof_ (sets, logic,
quantifiers, contradiction, relations and functions); MIT _Mathematics for
Computer Science_ (logic, induction, relations, graphs, sums, counting,
asymptotics and recurrences); MIT 6.006 notes (search and cost models); Interactive
Linear Algebra (systems through least squares and diagonalization); _Mathematics
for Machine Learning_ (SVD, Hessians, optimization and regression); OpenStax
Calculus 3 §4.7; Stanford PCA notes; NumPy rank-threshold documentation; Logic and
Proof's variable-scope discussion; forall x's empty-domain discussion; MDN array
method descriptions; and NIST's binary-tree definitions. Exact locators remain
in the source catalog.

All restored questions explicitly request reasoning. Four review-only corrections
are declared in `content/written-review.json`: an explanation of why the arithmetic
statement is a proposition; an unambiguous request for every applicable graph-walk
classification; the concrete zero-residual least-squares calculation; and an
explicit eigenvalue of 1 for the identity matrix. Full compiled-question hashes
include these corrections and the written instructions. Existing lesson source
digests were not refreshed.

Citation assignments were expanded where the original broad groups omitted a
needed passage: variable scope, empty domains, JavaScript empty-array behavior,
empty sum/product conventions, augmented matrices and row operations,
eigenvalue multiplicities, numerical rank, and binary versus full binary trees.
The two NIST citations are new; the other assignments reuse inspected citations.
The MDN every/some inspection dates and supporting descriptions were updated.

Compatibility inspection found the published notebook, evidence catalog, teaching,
review-template bank, and all existing lesson grading fields unchanged. The
grading catalog adds only `reviewQuestion` fields and receives a new content
version that includes those fields. The historical version alias is untouched.
The compatibility comparator excludes only that new field; source-pin tests and
Go's effective-catalog test check it separately. The source bundle intentionally
changes for the citation additions above. Original captured compatibility hashes
remain retained alongside the new inspected artifact hashes.

The deterministic-coverage ledger changes only its published catalog version.
Replacing that field with the previous version reproduces the committed coverage
digest exactly; lesson grading methods, requirements, and conversion counts are
unchanged.

The Go regression tests cover all 2,033 targets, all nine targets visible in the
reported screenshot, historical due dates, frozen grading context, source
deduplication, and a written answer satisfying due work. Browser coverage includes
desktop and phone rendering of the restored tautology justification question.
