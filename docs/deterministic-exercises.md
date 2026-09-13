# Deterministic exercise grading

45 existing exercises now use explicitly authored single-choice answers. All 50 knowledge checks also join the graded sets at their existing teaching locations. Written calculations, translations, explanations, constructions, and proofs remain open-response; a yes/no word inside a multipart task is not a reason to discard the rest of that task.

The selection pass searched all 2,010 existing prompts and inspected finite-decision candidates against their complete instructions and solutions. This is a conservative conversion, not a claim that no other exercise could ever be redesigned as multiple choice. The source list in content/choice-exercises.json pins each converted prompt and solution and records its options, answer, and predefined feedback.

Choice submission is graded locally immediately, including offline. The server independently validates the option against its catalog and saves the same deterministic grade without a model job. Incorrect feedback stays hidden until requested. Choice attempts share exercise history, progress, and the lock after a correct result. Previous knowledge-check selections are drafts, not retroactive graded submissions.

## Converted exercises

- propositional-logic: 76, 77, 70, 71, 116, 82
- predicates-and-quantifiers: 63, 65, 71, 72, 97, 98, 99
- sets-and-set-operations: 52, 53, 3, 4, 34
- relations: 26, 47, 68, 70, 20
- functions: 2, 3, 4, 52, 54, 57, 58, 21
- proof-by-contrapositive: 6, 68
- combinatorics: 56
- graph-theory: 5, 7, 28, 37, 43, 44, 76
- asymptotic-growth: 63, 79
- linear-algebra-transformations: 67
- sequences-and-summations: 20

Knowledge checks keep their existing content and section placements; their numeric exercise IDs are explicitly recorded in content/knowledge-check-exercises.json. New options introduce no new mathematical notation. Existing knowledge-check formula references retain their original source IDs.

## Verification

Feedback is authored per option in `content/choice-feedback.json`, with an explanation of the accepted reasoning or the selected distractor's misconception. It is checked against the current prompt and option text before building. This file overrides the older brief feedback in the conversion metadata; the client and server receive the same complete explanations. Existing deterministic attempts display the current explanation when their selected option and verdict still match, without changing their recorded grade. Correct feedback should teach why the choice works; incorrect feedback should offer a useful next step instead of copying the solution. Do not add praise, restate the option, or invent improvement advice merely to fill space.

All 95 choice exercises and every option are checked against their authored verdict and feedback in client tests. Go tests cover correct and incorrect results, invalid selections, stale content, duplicate submission requests, the correct-answer lock, and the absence of model jobs or AI rechecks. Browser checks cover offline retries, hidden incorrect feedback, history, mixed practice navigation, phone and desktop layouts, and chronological upload of offline attempts. Export/import includes choice selections and grades. The 47 curriculum tests, 11 client tests, Go suite, type checks, and TeX checks pass. No model calls were used for this work.
