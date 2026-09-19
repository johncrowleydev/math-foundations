# Algorithms and discrete structures: source inspection

Inspected September 19, 2026. This batch audits all 328 existing lesson items in recurrence relations, combinatorics, graph theory, and asymptotic growth. Numerical examples and response controls are original adaptations, not copied textbook exercises. The separate disposition ledger records each retained ID, original digest, complete grading method, controls, validators, and any evidence change. Proof requests remain whole open exercises.

The official MIT PDF was downloaded to ignored `output/source-research/mcs.pdf`; the following pinpoint passages were extracted and read. No source-review digest was refreshed in this authoring branch.

| Existing citation | Inspected passage                                                                                       | Supports                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `m-recursive`     | [MCS §§22.1–22.2, printed pp. 995–1001](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=1003) | Hanoi, iteration, and verification versus a candidate formula.                           |
| `m-linear-rec`    | [MCS §22.3, pp. 1002–1006](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=1010)              | Ordered staircase counts, characteristic equations, initial conditions, repeated roots.  |
| `m-counting`      | [MCS §§15.2–15.6, pp. 657–670](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=665)           | Product and division rules, subsets, stars and bars, and expanded binomial coefficients. |
| `m-pigeonhole`    | [MCS §15.8, pp. 676–677](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=684)                 | Collisions and occupancy thresholds.                                                     |
| `m-pie`           | [MCS §15.9, pp. 685–687](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=693)                 | Pairwise subtraction and triple-overlap restoration.                                     |
| `m-digraph`       | [MCS §§10.1–10.2, pp. 423–425](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=431)           | Directed degrees and vertex-sequence paths.                                              |
| `m-walks`         | [MCS §§12.7–12.9, pp. 519–525](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=527)           | Components; edge coverage versus vertex coverage.                                        |
| `m-trees`         | [MCS §12.11, pp. 527–531](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=535)                | Trees and spanning subgraphs.                                                            |
| `m-asymptotic`    | [MCS §14.7, pp. 631–636](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=639)                 | Fixed eventual multipliers, tight bounds, and asymptotic pitfalls.                       |

Additional primary passages inspected:

- [`alg-search`, MIT 6.006 Lecture 13, pp. 3–5](https://courses.csail.mit.edu/6.006/fall11/lectures/lecture13.pdf#page=3): visually read the adjacency-list representation, BFS discovery/parent algorithm, total traversal cost, and shortest unweighted paths. The specified alphabetical policy determines this batch’s original traversal examples.
- [`alg-search`, MIT 6.006 Lecture 14, pp. 2 and 5](https://courses.csail.mit.edu/6.006/fall11/lectures/lecture14.pdf#page=2): visually read recursive discovery and dependency-respecting topological order. All topological outputs are checked by exact enumeration of the finite authored DAG.
- [`alg-cost`, MIT 6.006 Lecture 2, pp. 2–3](https://courses.csail.mit.edu/6.006/fall11/lectures/lecture2.pdf#page=2): visually read operation costs, word assumptions, and array copying versus references.
- [`alg-asymptotic`, MIT 6.006 Recitation 1, pp. 1–5](https://courses.csail.mit.edu/6.006/fall11/rec/rec01.pdf): read upper/lower/tight growth, fixed logarithm bases, halving recurrences, and the error caused by changing an induction constant.
- [`d-trees`, Levin §2.2, “Rooted Trees”](https://discrete.openmathbooks.org/dmoi4/sec_trees.html): read the designated-root convention and parent/child relationships based on the unique root path. Rooted leaf conventions are preserved separately from unrooted degree-one terminology.

## Authoring and grading decisions

The catalog preserves all context instructions, particularly graph edge sets, traversal policies, and recurrence domains. Single final typed expressions remain production. A short reason can become a choice inside the same deterministic assessment; there is no second open response. Every such item records the evidence change. All answers are blank initially.

Graph construction uses ordinary vertex and edge lists, with an explicit limit of 16 vertices. Supplied-edge spanning-tree tasks use selection. Paths accept any valid start/orientation when the question permits them. Complete topological orders are entered in one field without showing the answer count. Hamiltonian existence uses exhaustive subset dynamic programming, never sampling or an unbounded search.

Four asymptotic witness families use exact universal criteria: finite initial exception, parity-dependent linear/quadratic functions, a positive decreasing polynomial ratio, and `n log₂ n+n` on powers of two. Fixed finite tests are not used as evidence for these universal bounds. Named proof and derivation exercises remain open.

Explicit adaptations: recurrence 72 requests a constant counterexample; graph 70 requests weights on the stated triangle; graph 40/45/80 bound finite constructions to 16 vertices; asymptotic 53 asks for the evaluated exact count rather than summation notation. Recurrence verification items require the initial value and the exact symbolic substituted identity; they do not ask for an induction narrative.

Integration must recheck source coverage and update only these reviewed lesson digests in `content/sources.json`. This file is an inspection record, not a replacement citation registry.
