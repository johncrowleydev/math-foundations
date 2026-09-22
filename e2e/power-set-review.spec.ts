import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withBrowser } from './support/browser.ts';
import { gradeAssessment } from '../shared/deterministic.ts';

await withBrowser('power-set-review', async ({ browser, baseURL, directory }) => {
  const templates = JSON.parse(await readFile('content/review-templates.json', 'utf8'));
  const template = templates.find((item: { id: string }) => item.id === 'df-power-set-term-review');
  const question = template.question;
  assert.ok(question.assessment);
  for (const [name, width, height] of [
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
      id: 'synthetic-power-set-session',
      kind: 'scheduled-review',
      mode: 'quick',
      instances: [
        {
          id: 'synthetic-power-set-instance',
          exercise: 'review-synthetic-power-set-instance',
          lesson: template.lesson,
          question,
          contentVersion: 'synthetic-power-set-version',
          sourceTarget: 'review:' + template.id,
          context: {
            instanceId: 'synthetic-power-set-instance',
            kind: 'scheduled-review',
            templateId: template.id,
            concept: template.concept,
            skill: template.skill,
            objective: template.objective,
            scheduledFor: Date.now(),
            presentedAt: Date.now(),
            intervalDays: 1,
          },
        },
      ],
    };
    // Use the canonical question in an isolated synthetic session. No live API calls.
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      let body: unknown = { records: [], attempts: [], cursor: 0, more: false };
      if (path.endsWith('/auth/session'))
        body = { email: 'power-set@example.test', expires: Date.now() + 86400000 };
      else if (path.endsWith('/review'))
        body = {
          due: 1,
          quick: 1,
          deeper: 0,
          targets: [],
          concepts: [{ id: template.concept, name: 'Power sets and subset counting' }],
          skills: [{ id: template.skill, name: 'Recall' }],
          lessons: [],
        };
      else if (path.endsWith('/attempts') && request.method() === 'POST') {
        const attempt = request.postDataJSON();
        const result = gradeAssessment(question.assessment, attempt.response);
        body = {
          ...attempt,
          presentation: { question },
          status: 'graded',
          verdict: result.verdict,
          grades: [{ ...result, model: 'deterministic', at: attempt.submitted }],
        };
      }
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
    });
    await page.goto(baseURL + '/#/review/sets-and-set-operations');
    await page.locator('.review-page').waitFor();
    await page.evaluate(async (saved) => {
      const { retainReviewSession } = await import(String('/src/reviewApi.ts'));
      await retainReviewSession(saved);
    }, session);
    await page.reload();
    const exercise = page.locator('.review-page .exercise');
    const answer = exercise.locator('.structured-answer input');
    await answer.fill('$\\mathcal{P}(B)$');
    await exercise.getByRole('button', { name: 'Submit', exact: true }).click();
    await exercise.getByText('Incorrect', { exact: true }).waitFor();
    await exercise.getByRole('button', { name: 'Try again', exact: true }).click();
    await answer.fill('$\\mathcal{P}(A)$');
    await exercise.getByRole('button', { name: 'Submit', exact: true }).click();
    await exercise.getByText('Correct', { exact: true }).waitFor();
    assert.equal(await exercise.locator('.submitted .katex').count(), 1);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${directory}/${name}-accepted.png`, fullPage: true });
    await context.close();
  }
  console.log(
    'Desktop and phone: power-set notation for A is accepted; notation for B is rejected.',
  );
});
