// Synthetic grading failures only: editing must preserve the submitted attempt.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { withBrowser } from './support/browser.ts';

await withBrowser('revise-failed-grading', async ({ browser, baseURL, directory }) => {
  const notebook = JSON.parse(await readFile('web/public/notebook.json', 'utf8'));
  const { version } = JSON.parse(await readFile('web/public/grading-version.json', 'utf8'));
  const lesson = notebook.lessons.find((lesson) => lesson.slug === 'sets-and-set-operations');
  const question = lesson.questions.find((question) => question.id === 40);
  assert.ok(question && !question.choice && !question.assessment);

  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['phone', 390, 844],
  ]) {
    for (const priorGrade of [false, true]) {
      const scenario = name + (priorGrade ? '-recheck' : '');
      const context = await browser.newContext({
        viewport: { width, height },
        serviceWorkers: 'block',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(30_000);
      const errors = [];
      const uploads = [];
      const rechecks = [];
      const submittedAt = Date.UTC(2026, 8, 21, 19, 24);
      const original = {
        id: 'synthetic-failed-proof',
        exercise: (lesson.exerciseNamespace || lesson.slug) + '-' + question.id,
        contentVersion: version,
        mode: 'type',
        text: 'Synthetic original response preserved after a grading service failure.',
        images: [],
        revealed: false,
        submitted: submittedAt,
        startedAt: submittedAt - 1000,
        activeDurationMs: 500,
        status: 'error',
        error:
          'Grading service returned an invalid response. Your submitted attempt is saved; retry grading.',
        ...(priorGrade
          ? { verdict: 'incorrect', recheckReason: 'Synthetic clarification retained in history.' }
          : {}),
        grades: priorGrade
          ? [
              {
                at: submittedAt + 1000,
                verdict: 'incorrect',
                feedback: 'Synthetic previous assessment retained after a failed recheck.',
              },
            ]
          : [],
        presentation: { question },
      };
      const edited = 'Synthetic revised response prepared before submitting a new attempt.';
      let saved;
      const record = () => ({
        key: 'attempt/' + saved.id,
        revision: 1,
        id: 'synthetic-server-record',
        payload: saved,
        device: 'Grader',
        updated: saved.submitted + 1000,
        versions: [],
        conflicts: [],
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('**/api/**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        let body = { records: [], cursor: saved ? 1 : 0, more: false, attempts: [] };
        if (url.pathname.endsWith('/auth/session'))
          body = { email: 'revise-test@example.test', expires: Date.now() + 86400000 };
        else if (url.pathname.endsWith('/recheck')) rechecks.push(request.postDataJSON());
        else if (url.pathname.endsWith('/attempts') && request.method() === 'POST') {
          const wire = request.postDataJSON();
          uploads.push(wire);
          const local = await page.evaluate(async (id) => {
            const { get } = await import('/src/storage.ts');
            return get('attempts', id);
          }, wire.id);
          saved = {
            ...local,
            ...wire,
            status: 'graded',
            verdict: 'correct',
            error: '',
            grades: [
              {
                at: wire.submitted + 1000,
                verdict: 'correct',
                feedback: 'Synthetic revised answer graded successfully.',
              },
            ],
          };
          body = saved;
        } else if (url.pathname.endsWith('/changes') && saved)
          body = {
            records: Number(url.searchParams.get('after')) < 1 ? [record()] : [],
            cursor: 1,
            more: false,
          };
        else if (url.pathname.endsWith('/status') && saved)
          body = { attempts: [{ key: 'attempt/' + saved.id, revision: 1 }] };
        else if (url.pathname.endsWith('/attempts') && saved) body = { records: [record()] };
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
      });

      try {
        await page.goto(baseURL + '/#/practice/' + lesson.slug + '/' + question.id);
        const exercise = page.locator('article.exercise:visible');
        await exercise.waitFor();
        await page.evaluate(async (attempt) => {
          const { put } = await import('/src/storage.ts');
          await put('attempts', attempt.id, attempt);
        }, original);
        await exercise.getByText('Could not grade', { exact: true }).waitFor();
        const retryLabel = priorGrade ? 'Retry recheck' : 'Retry grading';
        await exercise.getByRole('button', { name: retryLabel, exact: true }).waitFor();
        await exercise.getByRole('button', { name: 'Edit answer', exact: true }).waitFor();
        await page.screenshot({ path: `${directory}/${scenario}-error.png`, fullPage: true });

        await exercise.getByRole('button', { name: 'Edit answer', exact: true }).click();
        const editor = exercise.getByRole('textbox', { name: 'Answer editor', exact: true });
        await editor.waitFor();
        assert.equal(await editor.innerText(), original.text, 'the submitted answer is restored');
        assert.equal(await exercise.getByLabel('Response format').inputValue(), 'type');
        await editor.click();
        await editor.press('ControlOrMeta+a');
        await page.keyboard.insertText(edited);
        assert.equal(await editor.innerText(), edited, 'keyboard input replaces the original');
        await exercise.getByRole('button', { name: 'Back to latest attempt', exact: true }).click();
        assert.equal(await exercise.locator('.submitted').innerText(), original.text);
        await exercise.getByRole('button', { name: 'Continue draft', exact: true }).click();
        assert.equal(await editor.innerText(), edited, 'resuming does not overwrite the revision');
        await page.waitForFunction(
          async ({ exerciseKey, text }) => {
            const { get } = await import('/src/storage.ts');
            const draft = await get('drafts', exerciseKey);
            return draft?.text === text && draft.editing && draft.recovery;
          },
          { exerciseKey: original.exercise, text: edited },
        );
        await page.reload();
        await editor.waitFor();
        assert.equal(await editor.innerText(), edited, 'the revised draft survives reload');
        await page.getByText('Up to date', { exact: true }).waitFor();
        assert.equal(uploads.length, 0, 'editing does not submit or retry grading');
        assert.deepEqual(rechecks, [], 'editing does not start a recheck');
        await page.screenshot({ path: `${directory}/${scenario}-editing.png`, fullPage: true });

        await exercise.getByRole('button', { name: 'Submit', exact: true }).click();
        await exercise
          .getByText('Synthetic revised answer graded successfully.', { exact: true })
          .waitFor();
        assert.equal(uploads.length, 1, 'the revised answer is submitted once');
        assert.notEqual(uploads[0].id, original.id, 'editing creates a distinct attempt');
        assert.equal(uploads[0].text, edited);
        assert.equal(uploads[0].exercise, original.exercise);
        assert.equal(uploads[0].assistance.copiedFromRetry, true);
        assert.deepEqual(rechecks, [], 'new submissions do not retry the original grade');
        const attempts = await page.evaluate(async (exerciseKey) => {
          const { all } = await import('/src/storage.ts');
          return (await all('attempts')).filter((attempt) => attempt.exercise === exerciseKey);
        }, original.exercise);
        assert.equal(attempts.length, 2);
        assert.deepEqual(
          attempts.find((attempt) => attempt.id === original.id),
          original,
          'the original submission, grading error, and assessment history remain unchanged',
        );
        assert.equal(attempts.find((attempt) => attempt.id === uploads[0].id).text, edited);
        await page.screenshot({ path: `${directory}/${scenario}-resubmitted.png`, fullPage: true });

        await exercise.getByRole('button', { name: 'More ▾', exact: true }).click();
        await exercise.getByRole('button', { name: 'Previous attempts', exact: true }).click();
        const history = page.getByRole('dialog');
        await history.getByText(original.text, { exact: true }).waitFor();
        await history.getByText(edited, { exact: true }).waitFor();
        assert.equal(await history.locator('.history-item').count(), 2);
        assert.deepEqual(errors, []);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
          false,
          'the controls and history fit the viewport',
        );
      } catch (error) {
        await page.screenshot({ path: `${directory}/${scenario}-failure.png`, fullPage: true });
        throw error;
      } finally {
        await context.close();
      }
    }
  }
  console.log(
    'Desktop and phone: failed grading and rechecks allow persistent revisions, submit a new answer, and retain original history.',
  );
});
