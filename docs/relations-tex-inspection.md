# Relations rewrite inspection

Inspected on 2026-09-29 for the Relations chapter rewrite in PR #42.

The lesson was read alongside the rewritten formula contexts and the mathematical
passages assigned in `content/sources.json`: Hammack, _Book of Proof_, sections
11.1–11.4, and MIT, _Mathematics for Computer Science_, sections 4.4, 10.4, 10.6,
10.8, 10.10, and 10.11. The examples and explanations are original; these passages
support their definitions and arguments. The complete source record and convention
differences remain in the source catalog.

The inspection checked ordered-pair membership and coordinate order; loops,
reversed pairs, and composable chains in the four relation properties; congruence
proofs with integer multipliers; equality of equivalence classes by both
inclusions; within-block Cartesian products when constructing a relation from a
partition; weak partial orders and strict cover comparisons; inverse pairs;
right-to-left composition; and closure paths. Formula contexts distinguish the
three-pair representation example from the two-pair closure example and distinguish
the least-element label from the earlier integer multiplier. All 676 formula
occurrences in the rewritten lesson, exercises, checks, and figures have exact
context and occurrence matches.

## Typing prerequisites

The six existing typing placements still match their teaching sections:

| Section                               | Constructions inspected                       | Prerequisites and next use                                                                                                                     |
| ------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Relations as sets of ordered pairs    | Ordinary infix `aRb`, parentheses, and commas | The typing primer introduces ordinary input; this placement precedes the property exercises.                                                   |
| Equivalence relations                 | `\ell`, divisibility `\mid`, and `\pmod{m}`   | Earlier lessons teach commands, braces, and `\equiv`; the placement precedes inline exercise 31.                                               |
| Equivalence classes and partitions    | `[a]` and `[a]_R`                             | Subscripts are introduced in Propositional Logic; brackets name a class rather than list its members.                                          |
| Partial and total orders              | `\preceq`                                     | The non-strict comparison is explained before the order exercises.                                                                             |
| Hasse diagrams and extreme elements   | `\prec`                                       | The strict comparison follows the non-strict comparison and precedes inline exercise 41.                                                       |
| Inverses and composition of relations | `S\circ R` and `R^{-1}`                       | Superscripts and grouping are introduced earlier; the composition order and grouped negative exponent are explained before inline exercise 51. |

The new prose uses existing notation; it introduces no new typed response format.
The changed display formulas were checked for set-brace grouping, partition-block
subscripts, modulus arguments, ordered-pair direction, strict versus non-strict
order symbols, and the inverse superscript. The Hasse-chain dashes denote edges,
not subtraction.

Both quick checks retain their original prompts, options, answers, and feedback.
The first distinguishes symmetry from reflexivity; the second uses incomparable
singleton subsets to distinguish a partial order from a total order. They accept
selections. The second check's existing grouping requirement remains sufficient.
Their inspection fingerprints change because they include the revised teaching
passage hashes.

## Inspection records

Only the six Relations typing-placement fingerprints, two Relations quick-check
fingerprints, and the changed Relations curriculum-unit and formula records are
updated. The curriculum formula count increases from 20,746 to 20,840. Unchanged
exercise, reference, figure, and other-lesson inspection records retain their
existing values. The fingerprints identify the inspected content; they do not
replace the mathematical and prerequisite checks above.
