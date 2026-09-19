# Deterministic grid inspection

Inspected September 19, 2026, against all three lesson assessment catalogs and all dedicated Review variants.

The transpose grids in `linear-algebra-matrices-1` and `linear-algebra-matrices-3` through `linear-algebra-matrices-8` revealed the dimensions that the same prompts ask the learner to determine. All seven now use one ordinary math input named `transpose`, checked by the existing matrix validator. The learner enters rows separated by semicolons or ordinary matrix notation. The three scalar shape/entry fields, requested outputs, original prompts, exercise IDs, and original source pins are preserved.

Reinspected Deisenroth, Faisal, and Ong, _Mathematics for Machine Learning_, §2.2.2, Definition 2.4, printed p. 25 / [PDF p. 31](https://mml-book.github.io/book/mml-book.pdf#page=31): transposition exchanges the row and column indices and therefore exchanges the dimensions. This is already covered by the `mml-transpose` citation. The response layout supplies no matrix dimensions. Numerical values continue to come from the original linear-algebra generators; no second matrix bank was introduced.

The remaining 45 grid widgets in 42 lesson items were inspected:

- The 22 truth-table/evaluation grids and 11 assignment grids use explicitly given variables and requested formulas. The supplied truth-table rows implement the approved truth-table interaction.
- Five mapping grids across Direct Proof 59, Contrapositive 50, and Functions 76 use domains and codomains explicitly supplied in the published construction prompts.
- Relations 4 uses the specified three-element carrier and row/column order; Relations 11 and 22 list the properties explicitly requested; Relations 32 asks for four members explicitly.
- Strong Induction 21 asks for combinations for each of the four displayed amounts using the two displayed stamp denominations.
- Matrix 29 uses two result grids for AB and BA. It asks for the products and transformation order, without assessing dimensions. Matrix 30–36 retain typed answers because they explicitly assess product shapes. The [linear algebra inspection log](deterministic-linear-source-inspection.md) records the supporting multiplication passage and independently checked products.

The three dedicated Review grids are counterassignments with explicitly requested truth values. Six finite predicate countermodels and two dedicated Review relation constructions now use ordinary member checkboxes with explicit None; absent members do not need false-entry work. The [member-selection inspection](deterministic-relation-selection-inspection.md) records that final simplification. The algorithms conversion catalog has no additional grid inputs. No remaining grid supplies an assessed matrix dimension or basis cardinality.

All 2,728 fixtures in the final main lesson assessment catalog pass. The seven changed transpose definitions preserve the previous correct/incorrect/missing-field cases and add accepted TeX matrix notation plus rejected wrong entries, wrong row counts, and wrong column counts. Their original source hashes are unchanged. The [validation record](deterministic-grading-validation.md) and regenerated coverage artifacts document final integration.
