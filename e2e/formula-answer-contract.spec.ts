import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withBrowser } from './support/browser.ts';
import { runWithWorkers } from './support/workers.ts';
import { gradeAssessment } from '../shared/deterministic.ts';
import type {
  Assessment,
  AnswerOption,
  AnswerValue,
  StructuredResponse,
} from '../shared/assessment.ts';

type Question = {
  id: number;
  answer?: string;
  assessment?: Assessment;
  choice?: {
    options: { id: string; text: string; feedback: string }[];
    correctOption: string;
  };
};

await withBrowser('formula-answer-contract', async ({ browser, baseURL, directory }) => {
  const notebook: { lessons: { slug: string; questions: Question[] }[] } = JSON.parse(
    await readFile('web/public/notebook.json', 'utf8'),
  );
  const templates = JSON.parse(await readFile('content/review-templates.json', 'utf8'));
  const relationTemplate = templates.find(
    (item: { id: string }) => item.id === 'df-symmetry-antisymmetry-distinction-review',
  );
  const cases: { name: string; lesson: string; question: Question; legacy?: boolean }[] = [
    ...[
      ['quantified', 'proof-by-contradiction', 6],
      ['boolean', 'proof-by-contrapositive', 11],
      ['set', 'sets-and-set-operations', 61],
      ['numeric-fields', 'asymptotic-growth', 52],
      ['selection', 'direct-proof', 1],
      ['grid', 'direct-proof', 59],
      ['interval', 'functions', 6],
      ['multiselect', 'graph-theory', 49],
      ['boolean-value', 'calculus-limits-continuity', 28],
    ].map(([name, slug, id]) => {
      const lesson = notebook.lessons.find((item) => item.slug === slug);
      const question = lesson?.questions.find((item) => item.id === id);
      assert.ok(lesson && question?.assessment, `${slug}-${id} must have an assessment`);
      return { name: String(name), lesson: lesson.slug, question };
    }),
    { name: 'choice', lesson: relationTemplate.lesson, question: relationTemplate.question },
  ];
  cases.push({ ...cases[0], name: 'legacy-quantified', legacy: true });
  const results = await runWithWorkers(
    cases,
    2,
    async ({ name, lesson, question: authoredQuestion, legacy }) => {
      const question = structuredClone(authoredQuestion);
      if (legacy) delete question.assessment!.solution;
      for (const [viewport, width, height] of [
        ['desktop', 1440, 1000],
        ['phone', 390, 844],
      ] as const) {
        const context = await browser.newContext({
          viewport: { width, height },
          serviceWorkers: 'block',
        });
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const session = {
          id: 'synthetic-answer-contract-session',
          kind: 'scheduled-review',
          mode: 'quick',
          instances: [
            {
              id: 'synthetic-answer-contract-instance',
              exercise: 'review-synthetic-answer-contract-instance',
              lesson,
              question,
              contentVersion: 'synthetic-answer-contract-version',
              context: {
                instanceId: 'synthetic-answer-contract-instance',
                kind: 'scheduled-review',
                templateId: 'synthetic-answer-contract',
                concept: 'synthetic-concept',
                skill: 'synthetic-skill',
                objective: 'synthetic-objective',
                scheduledFor: Date.now(),
                presentedAt: Date.now(),
                intervalDays: 1,
              },
            },
          ],
        };
        // Exercise canonical content in an isolated review session; never call the live API.
        await page.route('**/api/**', async (route) => {
          const request = route.request();
          const path = new URL(request.url()).pathname;
          let body: unknown = { records: [], attempts: [], cursor: 0, more: false };
          if (path.endsWith('/auth/session'))
            body = { email: 'answer-contract@example.test', expires: Date.now() + 86400000 };
          else if (path.endsWith('/review'))
            body = {
              due: 1,
              quick: 1,
              deeper: 0,
              targets: [],
              concepts: [],
              skills: [],
              lessons: [],
            };
          else if (path.endsWith('/attempts') && request.method() === 'POST') {
            const attempt = request.postDataJSON();
            if (question.choice) {
              const selected = question.choice.options.find(
                (option) => option.id === attempt.choiceId,
              );
              assert.ok(selected);
              const verdict =
                selected.id === question.choice.correctOption ? 'correct' : 'incorrect';
              body = {
                ...attempt,
                presentation: { question },
                status: 'graded',
                verdict,
                grades: [
                  {
                    verdict,
                    feedback: selected.feedback,
                    model: 'deterministic',
                    at: attempt.submitted,
                  },
                ],
              };
            } else {
              assert.ok(question.assessment);
              const result = gradeAssessment(question.assessment, attempt.response);
              body = {
                ...attempt,
                presentation: { question },
                status: 'graded',
                verdict: result.verdict,
                grades: [{ ...result, model: 'deterministic', at: attempt.submitted }],
              };
            }
          }
          await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
        });
        await page.goto(baseURL + '/#/review/' + lesson);
        await page.locator('.review-page').waitFor();
        await page.evaluate(async (saved) => {
          const { retainReviewSession } = await import(String('/src/reviewApi.ts'));
          await retainReviewSession(saved);
        }, session);
        await page.reload();
        const exercise = page.locator('.review-page .exercise');
        const reveal = exercise.locator('details').filter({
          has: page.locator('summary').filter({ hasText: /^Reveal answer$/ }),
        });
        if (question.assessment) {
          const assessment = question.assessment;
          const response: StructuredResponse | undefined = authoredQuestion.assessment?.solution;
          assert.ok(response, `${name}: canonical accepted answer must be supplied`);
          const formula = ['quantified', 'legacy-quantified', 'boolean', 'set'].includes(name);
          if (formula) {
            assert.equal(
              await exercise.locator('.formula-input-guidance').innerText(),
              'Enter a formula in TeX. Plain-English sentences cannot be graded in this field.',
            );
            await exercise.locator('.formula-input-guidance').scrollIntoViewIfNeeded();
            await page.screenshot({
              path: `${directory}/${name}-${viewport}-prompt.png`,
              fullPage: true,
            });
          }
          await reveal.locator('summary').click();
          const accepted = reveal.locator('.revealed-structured-answer');
          await accepted.getByText('Accepted answer', { exact: true }).waitFor();
          const editor = exercise.locator('.structured-answer:not(.readonly-answer)');
          if (formula) {
            const input = assessment.inputs[0];
            // Read the actual revealed notation a learner can enter, not a fixture-only answer.
            const answer = await accepted
              .locator('annotation[encoding="application/x-tex"]')
              .textContent();
            assert.ok(answer);
            assert.equal(answer, String(response[input.id]).replace(/^\$+|\$+$/g, ''));
            assert.equal(await accepted.locator('.katex-error, code').count(), 0);
            assert.equal(
              await accepted.getByRole('button', { name: 'Copy TeX', exact: true }).count(),
              1,
            );
            assert.equal(gradeAssessment(assessment, { [input.id]: answer }).verdict, 'correct');
            await exercise
              .getByRole('textbox', { name: input.label + ' editor', exact: true })
              .fill(answer);
          } else {
            for (const input of assessment.inputs) {
              const value: AnswerValue = response[input.id];
              if (input.kind === 'math' || input.kind === 'text') {
                assert.equal(typeof value, 'string');
                assert.ok(
                  (
                    await accepted
                      .locator('.literal-answer-value, annotation[encoding="application/x-tex"]')
                      .allTextContents()
                  ).includes(String(value)),
                );
                await editor
                  .getByRole('textbox', {
                    name: input.label + (input.kind === 'math' ? ' editor' : ''),
                    exact: true,
                  })
                  .fill(String(value));
              } else if (input.kind === 'select' || input.kind === 'multiselect') {
                const selected: (string | boolean | null)[] = Array.isArray(value)
                  ? value
                  : [value];
                for (const id of selected) {
                  const option: AnswerOption | undefined = input.options.find(
                    (candidate) => candidate.id === id,
                  );
                  assert.ok(option);
                  assert.ok((await accepted.innerText()).includes(option.label));
                  await editor
                    .getByRole(input.kind === 'select' ? 'radio' : 'checkbox', {
                      name: option.label,
                      exact: true,
                    })
                    .check();
                }
                if (!selected.length) {
                  assert.ok((await accepted.innerText()).includes(input.emptyLabel || 'Empty set'));
                  await editor
                    .getByRole('checkbox', { name: input.emptyLabel || 'None', exact: true })
                    .check();
                }
              } else if (input.kind === 'boolean') {
                assert.ok(
                  (await accepted.locator('.answer-value').innerText()).includes(value ? 'T' : 'F'),
                );
                const toggle = editor.getByRole('button', {
                  name: input.label + ': blank',
                  exact: true,
                });
                await toggle.click();
                if (!value)
                  await editor
                    .getByRole('button', { name: input.label + ': T', exact: true })
                    .click();
              } else if (input.kind === 'interval') {
                const interval = accepted.locator('.interval-input');
                assert.deepEqual(await interval.locator(':scope > span').allTextContents(), [
                  response[input.id + '.leftClosed'] ? '[' : '(',
                  ',',
                  response[input.id + '.rightClosed'] ? ']' : ')',
                ]);
                assert.deepEqual(
                  await interval
                    .locator('annotation[encoding="application/x-tex"]')
                    .allTextContents(),
                  [String(response[input.id + '.lower']), String(response[input.id + '.upper'])],
                );
                for (const side of ['lower', 'upper']) {
                  await editor
                    .getByRole('textbox', { name: `${input.label} ${side} endpoint`, exact: true })
                    .fill(String(response[input.id + '.' + side]));
                  const boundary = `${input.label} ${side} endpoint boundary`;
                  await editor
                    .getByRole('button', { name: boundary + ': blank', exact: true })
                    .click();
                  if (!response[input.id + (side === 'lower' ? '.leftClosed' : '.rightClosed')])
                    await editor
                      .getByRole('button', { name: boundary + ': included', exact: true })
                      .click();
                }
              } else if (input.kind === 'grid') {
                for (const [r, row] of input.rows.entries()) {
                  for (const [c, cell] of row.cells.entries()) {
                    if ('given' in cell) continue;
                    const value: AnswerValue = response[cell.id];
                    const label =
                      cell.label ||
                      `${input.label}, ${row.label || 'row ' + (r + 1)}, ${input.columns[c]}`;
                    const shown = accepted.locator('tbody tr').nth(r).locator('td').nth(c);
                    assert.equal(
                      await shown.innerText(),
                      typeof value === 'boolean' ? (value ? 'T' : 'F') : String(value),
                    );
                    if (cell.kind === 'boolean') {
                      await editor
                        .getByRole('button', { name: label + ': blank', exact: true })
                        .click();
                      if (!value)
                        await editor
                          .getByRole('button', { name: label + ': T', exact: true })
                          .click();
                    } else {
                      await editor
                        .getByRole('textbox', { name: label, exact: true })
                        .fill(String(value));
                    }
                  }
                }
              }
            }
          }
          // The app scrolls inside its reading column; fullPage alone does not reveal clipped content.
          await accepted.evaluate((element) => {
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            element.scrollIntoView({ block: 'center' });
          });
          const acceptedBounds = await accepted.boundingBox();
          assert.ok(
            acceptedBounds &&
              acceptedBounds.y >= 0 &&
              acceptedBounds.y + acceptedBounds.height <= height,
            `${name} ${viewport}: complete accepted answer must be visible in its screenshot`,
          );
          assert.ok(
            await accepted.locator('.katex-html > .base').evaluateAll((parts) =>
              parts.every((part) => {
                const bounds = part.getBoundingClientRect();
                return bounds.left >= 0 && bounds.right <= innerWidth;
              }),
            ),
            `${name} ${viewport}: rendered math must fit the screenshot width`,
          );
          await page.screenshot({
            path: `${directory}/${name}-${viewport}-revealed.png`,
            fullPage: true,
          });
          if (legacy) {
            const retained = await page.evaluate(async () => {
              const { cachedReviewSession } = await import(String('/src/reviewApi.ts'));
              return cachedReviewSession();
            });
            assert.deepEqual(
              retained?.instances,
              session.instances,
              'revealing the indexed answer must not rewrite frozen review instances',
            );
            assert.equal('solution' in retained.instances[0].question.assessment, false);
            assert.equal('solution' in question.assessment!, false);
          }
        } else {
          const choice = question.choice;
          assert.ok(choice);
          const correct = choice.options.find((option) => option.id === choice.correctOption);
          const wrong = choice.options.find((option) => option.id !== choice.correctOption);
          assert.ok(correct && wrong);
          await exercise.getByRole('radio', { name: wrong.text, exact: true }).check();
          await exercise.getByRole('button', { name: 'Submit', exact: true }).click();
          await exercise.getByText('Incorrect', { exact: true }).waitFor();
          await exercise.getByRole('button', { name: 'Try again', exact: true }).click();
          await reveal.locator('summary').click();
          const revealedChoice = reveal.locator('.revealed-choice-answer');
          assert.ok((await revealedChoice.innerText()).includes('Correct answer'));
          assert.ok((await revealedChoice.innerText()).includes(correct.text));
          assert.ok((await reveal.innerText()).includes(question.answer!));
          await revealedChoice.scrollIntoViewIfNeeded();
          await page.screenshot({
            path: `${directory}/${name}-${viewport}-revealed.png`,
            fullPage: true,
          });
          await exercise.getByRole('radio', { name: correct.text, exact: true }).check();
        }
        await exercise.getByRole('button', { name: 'Submit', exact: true }).click();
        await exercise.getByText('Correct', { exact: true }).waitFor();
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
          `${name} ${viewport}: no horizontal overflow`,
        );
        assert.deepEqual(errors, []);
        await exercise.getByText('Correct', { exact: true }).scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `${directory}/${name}-${viewport}-accepted.png`,
          fullPage: true,
        });
        await context.close();
      }
    },
  );
  for (const result of results) if (result.status === 'rejected') throw result.reason;
  console.log(
    'Desktop and phone: accepted answers render and submit across structured input types; choice reveals identify the answer after retry.',
  );
});
