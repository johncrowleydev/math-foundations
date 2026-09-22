# Power-set Review notation correction

Inspected on September 21, 2026. Content repair commit:
`d00a429bf86b5db8fd11edad8d940f2d010e08da`.

The fixed `df-power-set-term-review` definition previously accepted only the
written name. It now also accepts `P(A)`, `\mathcal{P}(A)`, `\mathcal P(A)`, and
`𝒫(A)`, both bare and enclosed in single or double dollar delimiters. Its
instructions permit notation, and the official answer and correct feedback
identify the power set with calligraphic notation. All other term aliases,
question IDs, concepts, objectives, and input fields remain unchanged.

The supporting passage was inspected in Richard Hammack, _Book of Proof_,
edition 3.4, [§1.4, Definition 1.4, printed p. 15 / PDF p. 27](https://richardhammack.github.io/BookOfProof/Main.pdf#page=27).
It defines the power set of A as all subsets of A and gives the notation P(A).
The original retrieval question accepts the corresponding typed and rendered
spellings. The new `review-df-power-set` citation points directly to that
definition; only this template's source assignment and inspection digest changed.

## Published artifact inspection

The original captured hashes in
`tests/content/fixtures/published-compatibility.json` remain intact. The four
new hashes recorded under `inspectedUpdates` cover exactly these changes:

| Artifact                        | Inspected semantic difference                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `content/review-templates.json` | Only the fixed power-set template described above.                                                               |
| `content/sources.json`          | One new pinpoint citation and the power-set Review target's citation assignment.                                 |
| `grading-catalog.json`          | The same single Review template; no lesson exercise or other Review definition changed.                          |
| `content/grading-version.json`  | The content change receives its own version, `6ede0369cebabfee9c1eac518cf8972a1b2681b9a529238c29b1cde1eadac81b`. |

For each artifact, reversing only those differences in memory reproduces its
original captured SHA-256 exactly. The catalog comparison uses the existing
`comparableCatalog` projection without changing its exclusions. Other published
artifact compatibility assertions continue to pass against their existing pins.
The historical MDX representation-to-grading-version mapping is unchanged;
tests separately preserve that mapping and require the current corrected
curriculum to publish its own representation hash as its version.

## Verification and saved work

Twelve accepted notation fixtures and six rejected fixtures cover both
TypeScript content validation and the Go published-catalog grading check.
Rejections include P(B), union, a subset relation, and the number of subsets.
The existing lexical accepted/rejected fixtures remain in place.

Review sessions issued after the catalog update receive this definition.
Previously issued instances intentionally keep their frozen grading metadata;
historical attempts and grades are not rewritten. The written answer “power
set” remains accepted in those older sessions. Starting a new Review session
uses the corrected accepted-answer list.
