# Sources for authored learning content

Foundations explanations, numerical examples, exercises, and figures are original teaching material. The bibliography is a retrospective verification of their mathematical background, **not** a claim that the wording, diagrams, or particular exercises came from those books. We link to sources; we do not bundle textbook text or images.

## Authoring policy

All new or changed learning content must have credible, specific source support before publication. This includes introductions, teaching sections, exercise instructions and solutions, choice feedback, glossary definitions and notation, mathematical figure explanations, formula contexts, and TeX instruction.

Prefer author/university-hosted textbooks, peer-reviewed scholarship, and official technical documentation. Read the relevant passage, not just a search result or book title. Record author, work, edition, stable URL, chapter/section (and a PDF page link where available), what it supports, and the date checked in `content/sources.json`. Describe convention differences explicitly. An original calculation follows from cited definitions/theorems; check the calculation independently rather than implying a book contains that exact example. Historical and software claims need their own sources. App-specific controls and study instructions describe this app; citations accompanying them support the mathematics/syntax, not a research claim about learning effectiveness.

Assignments are explicit for each lesson introduction, each stable teaching section, and each named exercise group. Mixed practice groups may cite several relevant passages. Glossary entries and figures reuse the citations at their authored teaching anchors. Formula context is reviewed with the same lesson. Every TeX construction has an explicit source assignment. There is no keyword-based source inference or catch-all citation for future lessons.

## Validation and updates

`tools/content/sources.ts` runs in every content build, including CI. Missing/dangling assignments, unknown sources, duplicate citations, non-HTTPS links, and unused citations fail the build. Review digests cover the full published lesson, exercises (including feedback), references, formula contexts, figures, and typing placements. A separate digest covers all TeX content. A content edit therefore requires source reinspection even when its section ID remains unchanged.

After checking changed claims against the cited passages, update only the corresponding digest using the exported `lessonSourceHash(lesson, teaching, typing)` or `sourceHash({ syntax, typing })` functions. Use the candidate published content objects from `tools/content/build.ts`; do not hash stale output from before an edit. The builder deliberately has no auto-approve or skip-validation flag. A digest documents the inspected content version; it cannot prove that a citation supports a claim. Human/editorial source inspection remains necessary.

Run `npm run content:build`, `npm test`, and `npm run web:build`. Citation metadata is a separate bundled `sources.json`; it does not change exercise IDs, submitted context, grades, or grading content versions. Offline readers can open bibliographic details. Opening the external text requires connectivity.

## UI

Sources are closed by default under each teaching section and introduction, in full glossary entries, inside figure notes, within typing tutorials, and beneath revealed official exercise explanations. There are no inline superscripts, popovers, or source buttons beside answer choices. Native details/summary preserves keyboard and touch access. External links open separately and do not move the reading position.

## Initial source selection

- Lehman, Leighton, Meyer, _Mathematics for Computer Science_, MIT (2018): discrete structures, proofs, sums, counting, graph theory, asymptotics, recurrences.
- Hammack, _Book of Proof_, third edition/revision 3.4: sets, logic, proof methods, relations, functions.
- Levin, _Discrete Mathematics: An Open Introduction_, fourth edition: overview, sequence growth, rooted trees.
- Margalit and Rabinoff, _Interactive Linear Algebra_, Georgia Tech (2019): vectors through least squares and eigenvalues.
- Deisenroth, Faisal, Ong, _Mathematics for Machine Learning_, Cambridge (2020; author PDF 2024): affine maps, SVD, modeling limitations.
- Stanford STATS305C: low-rank approximation in Frobenius norm. This is distinct from the spectral-norm statement in MML §4.6.
- MIT 6.006 notes: computation models and BFS/DFS.
- LAPACK and NumPy documentation: numerical least squares and rank tolerances.
- Stanford Encyclopedia of Philosophy and the University of the Pacific Euler Archive: historical notes. The archive provides Euler’s original paper and an English translation; it also avoids reliance on the older MAA site, which was unavailable during link checking.
- KaTeX and MDN: supported syntax and JavaScript semantics.

Books sometimes use different conventions: MIT permits partial functions unless totality is specified; this notebook defaults to total functions. Graph walk terminology also varies. The notebook states its own conventions; citations support the underlying results rather than overriding those conventions.

Downloaded research PDFs/HTML remain under ignored `output/source-research/` and are not shipped. Citation coverage and link validity are separate checks: network failures must be investigated, but ordinary builds/tests never depend on live external sites.

## Initial coverage and verification

The September 2026 source pass covers 27 lessons (including both introductions), 269 reading units, 2,060 exercises, 479 reference entries, 46 figures, and 119 TeX constructions. The catalog contains 89 pinpoint references to 13 works. Coverage counts describe source assignments, not a claim that the external books contain the app's exact exercises.

Content validation, root tests, web tests, typechecking, formatting, and the production PWA build pass. Browser checks cover collapsed/expanded citations, keyboard access, phone wrapping, exercise explanations, reference entries, figure notes, and a production service-worker offline reload. Screenshot records are in `docs/screenshots/sources/`.
