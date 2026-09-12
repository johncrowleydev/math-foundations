# Reading navigation and purposeful figures

The tablet landscape reader now has a persistent, independently scrollable page outline on the right. Its text and a narrow marker identify the section at the top of the reading viewport, including that section's exercises and quick checks. Selecting an entry jumps to its teaching text. The active entry stays visible when the outline itself is long. The reader retains the selected one- or two-finger scrolling mode; the outline uses ordinary scrolling.

The rail appears when the reader has at least 1080dp of available width and 480dp of height in landscape. This preserves the existing tablet reading-column width. Portrait, phones, and narrower windows use the outline dialog with the same active-section indicator. Opening a reference beside the reader can reclaim the rail's space without losing reading position.

## Figure pruning

Removed twelve formula-and-text flow figures after reading their surrounding teaching sections:

- Logic implication, distribution, and simplification: the truth table, ticket example, and fully explained algebraic derivations already teach the same material.
- Function composition: the prose already follows an input through both functions and contrasts the two composition orders.
- Telescoping: the text already explains the cancellation and endpoints, with a worked sum.
- Direct proof, contrapositive, and contradiction examples: the adjacent complete proofs explain the assumptions and every conclusion.
- Ordinary and strong induction: the teaching already distinguishes the base, available hypotheses, and next conclusion.
- Ordered versus unordered counting: the text already explains uniform repetition and division by the number of orders.
- Recurrence unfolding: the worked derivation already traces substitutions to the initial term.

The remaining 39 figures show useful spatial or structural information: graph connections and routes, set membership and regions, mappings, predicate grids, indexed growth, area arrangements, board splitting, counting trees and bins, recurrence dependencies, and comparison curves. No replacement graphic was added solely to satisfy a figure quota.

Only figure declarations were removed from lesson prose. All exercises, answers, teaching explanations, notation, and lesson/section identifiers remain intact. Formula explanations retain their IDs and mathematical contents; their source-block locations and ordinals were remapped as neighboring text blocks joined. Exact introduction quotations were retained with adjusted offsets. Audit records were updated for the inspected sections and removed figures, without changing exercise dependencies.

## Verification

- All 40 content tests pass, covering the complete exercise inventory, prerequisite records, figure mathematics, and reference/formula coverage.
- The dedicated outline test passes section navigation, exercise scroll tracking, and landscape-to-portrait restoration. Tablet screenshots were inspected in both orientations.
- All seven outline/tablet device tests pass, including continuous two-finger scrolling, pen persistence, undo/redo, answer reveal, quick checks, and rotation. Release compilation, unit tests, and lint pass.
- No physical tablet connection is needed for publication; this follows the owner's release preference.
