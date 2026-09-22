# Sources for authored learning content

Foundations explanations, numerical examples, exercises, and figures are original teaching material. The bibliography is a retrospective verification of their mathematical background, **not** a claim that the wording, diagrams, or particular exercises came from those books. We link to sources; we do not bundle textbook text or images.

## Authoring policy

All new or changed learning content must have credible, specific source support before publication. This includes introductions, teaching sections, exercise instructions and solutions, choice feedback, glossary definitions and notation, mathematical figure explanations, formula contexts, and TeX instruction.

Prefer author/university-hosted textbooks, peer-reviewed scholarship, and official technical documentation. Read the relevant passage, not just a search result or book title. Record author, work, edition, stable URL, chapter/section (and a PDF page link where available), what it supports, and the date checked in `content/sources.json`. Describe convention differences explicitly. An original calculation follows from cited definitions/theorems; check the calculation independently rather than implying a book contains that exact example. Historical and software claims need their own sources. App-specific controls and study instructions describe this app; citations accompanying them support the mathematics/syntax, not a research claim about learning effectiveness.

Assignments are explicit for each lesson introduction, each stable teaching section, and each named exercise group. Mixed practice groups may cite several relevant passages. Glossary entries and figures reuse the citations at their authored teaching anchors. Formula context is reviewed with the same lesson. Every TeX construction has an explicit source assignment. There is no keyword-based source inference or catch-all citation for future lessons.

## Validation and updates

`tools/content/sources.ts` runs in every content build, including CI. Missing/dangling assignments, unknown sources, duplicate citations, non-HTTPS links, and unused citations fail the build. Review digests cover the full published lesson, exercises (including feedback), references, formula contexts, figures, and typing placements. A separate digest covers all TeX content. A content edit therefore requires source reinspection even when its section ID remains unchanged.

After checking changed claims against the cited passages, update only the corresponding digest using the functions exported by `tools/content/sources.ts`:

| Inspected record                       | Digest input                                 |
| -------------------------------------- | -------------------------------------------- |
| Lesson and its teaching/typing context | `lessonSourceHash(lesson, teaching, typing)` |
| TeX catalog                            | `sourceHash({ syntax, typing })`             |
| Review template                        | `sourceHash(template)`                       |
| Complete review variant bank           | `sourceHash(reviewVariants[id])`             |

Use the candidate published content objects from `tools/content/build.ts`; do not hash stale output from before an edit. Review source assignments must match their template's `sourceIds`. The builder has no auto-approve or skip-validation flag. A digest documents the inspected content version; it cannot prove that a citation supports a claim. Human/editorial source inspection remains necessary.

Run `npm run content:build`, `npm test`, and `npm run web:build`. Citation metadata is a separate bundled `sources.json`; it does not change exercise IDs, submitted context, grades, or grading content versions. Offline readers can open bibliographic details. Opening the external text requires connectivity.

## UI

Sources are closed by default under each teaching section and introduction, in full glossary entries, inside figure notes, within typing tutorials, and beneath revealed official exercise explanations. There are no inline superscripts, popovers, or source buttons beside answer choices. Native details/summary preserves keyboard and touch access. External links open separately and do not move the reading position.

## Bibliography and inspection records

`content/sources.json` is the current bibliography and pinpoint assignment catalog
for all four subjects. Keep source details there instead of duplicating book
lists or coverage counts in documentation. State convention differences in the
authored material; a citation does not override the notebook's stated conventions.

Downloaded research PDFs/HTML remain under ignored `output/source-research/` and are not shipped. Citation coverage and link validity are separate checks: network failures must be investigated, but ordinary builds/tests never depend on live external sites.

Historical inspection notes in `content/curriculum-audit.json` and
`content/tex-teaching.json` retain their original report paths and inspected hashes.
Those reports are available in Git at commit
`485bc5f4467a4cf8bbc6a527e8d69335fc6a5c89`; retrieve a referenced report with
`git show 485bc5f4467a4cf8bbc6a527e8d69335fc6a5c89:docs/<report>.md`.
These notes document prior inspections, not the current authoring workflow.
Do not rewrite them or refresh source digests as part of documentation maintenance.
