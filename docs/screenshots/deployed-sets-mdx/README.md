# Deployed sets content preserved through MDX

Checked the production Vite build at 1440 × 1000 and 390 × 844 with synthetic API responses. These screenshots contain no learner answers or account data. The current deployed lesson prose and power-set layout were preserved while keeping canonical MDX and its explicit React components.

- `desktop-proof.png`, `phone-proof.png`: restored inclusion/equality teaching renders as ordinary MDX prose and math.
- `desktop-power-set.png`, `phone-power-set.png`: all four subset boxes fit inside the power-set frame.
- `desktop-bit-mask.png`, `phone-bit-mask.png`: all four bit-mask rows remain readable; neither viewport has page overflow.

The compiled sets lesson was compared against the deployed `notebook.json`. Section prose (normalizing only figure-reference serialization for this comparison), rendered teaching blocks, exercise questions, placement IDs, and quick-check bodies match. Native MDX figure references and the corresponding teaching hashes are the intended metadata differences. The original stash was preserved.

Source passages rechecked on September 21, 2026:

- Richard Hammack, _Book of Proof_, §§1.4–1.6 and §§8.2–8.3: power sets, set operations, complements, element proofs, and equality by both inclusions. [Power sets](https://richardhammack.github.io/BookOfProof/Main.pdf#page=27), [set proofs](https://richardhammack.github.io/BookOfProof/Main.pdf#page=171).
- Lehman, Leighton, Meyer, _Mathematics for Computer Science_, §4.5.1, Theorem 4.5.5, pp. 117–118: the fixed-position subset/bit-sequence correspondence and counting subsets. [Supporting passage](https://courses.csail.mit.edu/6.042/spring18/mcs.pdf#page=125).

The neighbor/colleague explanations and bit-mask example are existing original curriculum, not copied textbook material. Content validation, source/audit/introduction tests, and the production web build passed before these captures.
