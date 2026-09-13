# Deterministic exercise grading

129 existing exercises now use explicitly authored single-choice answers. All 50 knowledge checks also join the graded sets at their existing teaching locations. Worked calculations, requested explanations, constructions, and proofs remain open-response; a yes/no word inside a multipart task is not a reason to discard the rest of that task.

The selection pass searched all 2,010 existing prompts and inspected finite-decision candidates against their complete instructions and solutions. This is a conservative conversion, not a claim that no other exercise could ever be redesigned as multiple choice. The source list in content/choice-exercises.json pins each converted prompt and solution and records its options, answer, and predefined feedback.

Choice submission is graded locally immediately, including offline. The server independently validates the option against its catalog and saves the same deterministic grade without a model job. Incorrect feedback stays hidden until requested. Choice attempts share exercise history, progress, and the lock after a correct result. Previous knowledge-check selections are drafts, not retroactive graded submissions.

## Converted exercises

Canonical IDs (display numbering also includes the former knowledge checks):

- propositional-logic: 9, 10, 11, 12, 13, 14, 70, 71, 76, 77, 78, 81, 82, 83, 84, 85, 86, 88, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 112, 113, 114, 115, 116, 117, 118, 145
- predicates-and-quantifiers: 6, 8, 9, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 63, 65, 71, 72, 78, 97, 98, 99
- sets-and-set-operations: 2, 3, 4, 6, 34, 52, 53
- relations: 2, 18, 20, 26, 29, 31, 44, 45, 47, 68, 70
- functions: 2, 3, 4, 21, 36, 52, 54, 57, 58, 70
- proof-by-contrapositive: 3, 4, 6, 68
- combinatorics: 56
- graph-theory: 5, 6, 7, 15, 28, 35, 36, 37, 43, 44, 76
- asymptotic-growth: 63, 79
- linear-algebra-transformations: 67
- sequences-and-summations: 20
- direct-proof: 6, 8
- mathematical-induction: 1, 7
- strong-induction: 4
- linear-algebra-eigenvalues: 10
- linear-algebra-svd: 16

The expanded pass includes 84 additional exercises: English and symbolic translations, quantifier scope and order, equivalence laws with the requested rule names, inference rules, and finite classifications. Multipart choices retain every requested fact. Each option has authored reasoning or a misconception-specific explanation; a keyword match alone does not authorize conversion.

Knowledge checks keep their existing content and section placements; their numeric exercise IDs are explicitly recorded in content/knowledge-check-exercises.json. New options introduce no new mathematical notation. Existing knowledge-check formula references retain their original source IDs.

## Verification

Feedback is authored per option in `content/choice-feedback.json`, with an explanation of the accepted reasoning or the selected distractor's misconception. It is checked against the current prompt and option text before building. This file overrides the older brief feedback in the conversion metadata; the client and server receive the same complete explanations. Existing deterministic attempts display the current explanation when their selected option and verdict still match, without changing their recorded grade. Correct feedback should teach why the choice works; incorrect feedback should offer a useful next step instead of copying the solution. Do not add praise, restate the option, or invent improvement advice merely to fill space.

All 179 choice exercises and their 492 option explanations are checked against their authored verdict and feedback in client tests. Go tests cover correct and incorrect results, invalid selections, stale content, duplicate submission requests, the correct-answer lock, and the absence of model jobs or AI rechecks. Browser checks cover offline retries, hidden incorrect feedback, history, mixed practice navigation, phone and desktop layouts, and chronological upload of offline attempts. Export/import includes choice selections and grades. The 47 curriculum tests, 13 client tests, Go suite, type checks, and TeX checks pass. No model calls were used for this work.
