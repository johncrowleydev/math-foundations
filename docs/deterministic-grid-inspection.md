# Deterministic grid inspection

Inspected September 19, 2026, against all three lesson assessment catalogs and all dedicated Review variants.

The transpose grids in `linear-algebra-matrices-1` and `linear-algebra-matrices-3` through `linear-algebra-matrices-8` revealed the dimensions that the same prompts ask the learner to determine. All seven now use one ordinary math input named `transpose`, checked by the existing matrix validator. The learner enters rows separated by semicolons or ordinary matrix notation. The three scalar shape/entry fields, requested outputs, original prompts, exercise IDs, and original source pins are preserved.

Reinspected Deisenroth, Faisal, and Ong, _Mathematics for Machine Learning_, §2.2.2, Definition 2.4, printed p. 25 / [PDF p. 31](https://mml-book.github.io/book/mml-book.pdf#page=31): transposition exchanges the row and column indices and therefore exchanges the dimensions. This is already covered by the `mml-transpose` citation. The response layout supplies no matrix dimensions. Numerical values continue to come from the original linear-algebra generators; no second matrix bank was introduced.

The remaining 49 grid widgets in 47 lesson items were inspected:

- The 22 truth-table/evaluation grids and 11 assignment grids use explicitly given variables and requested formulas. The supplied truth-table rows implement the approved truth-table interaction.
- The six finite predicate countermodels have explicitly stated finite domains in their published conversion prompts.
- Five mapping grids across Direct Proof 59, Contrapositive 50, and Functions 76 use domains and codomains explicitly supplied in the published construction prompts.
- Relations 4 uses the specified three-element carrier and row/column order; Relations 11 and 22 list the properties explicitly requested; Relations 32 asks for four members explicitly.
- Strong Induction 21 asks for combinations for each of the four displayed amounts using the two displayed stamp denominations.

The five dedicated Review grids consist of three counterassignments with explicitly requested truth values and two relation constructions whose published prompts specify exactly two objects on each side. Neither the linear-algebra conversion catalog nor the algorithms conversion catalog has additional grid inputs. No remaining grid supplies an assessed matrix dimension or basis cardinality.

All 2,632 fixtures in the main lesson assessment catalog pass. The seven changed definitions preserve the previous correct/incorrect/missing-field cases and add accepted TeX matrix notation plus rejected wrong entries, wrong row counts, and wrong column counts. Their original source hashes are unchanged. The final browser inspection and regenerated coverage artifacts belong to the parent integration.
