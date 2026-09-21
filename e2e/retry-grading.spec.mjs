// Synthetic saved-work recovery against a local production preview. No live API calls.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { withBrowser } from './support/browser.ts';

await withBrowser(
  'retry-grading',
  async ({ browser, baseURL: base, directory }) => {
    const notebook = JSON.parse(await readFile('web/public/notebook.json', 'utf8'));
    const { version } = JSON.parse(await readFile('web/public/grading-version.json', 'utf8'));
    const lesson = notebook.lessons.find((l) => l.slug === 'sets-and-set-operations');
    const question = lesson.questions.find((q) => q.id === 25);
    assert.ok(question && !question.choice && !question.assessment);
    for (const [name, width, height] of [
      ['desktop', 1440, 1000],
      ['phone', 390, 844],
    ]) {
      const context = await browser.newContext({
        viewport: { width, height },
        serviceWorkers: 'block',
      });
      const page = await context.newPage();
      const errors = [];
      const submittedAt = Date.UTC(2026, 8, 21, 19, 24);
      page.on('pageerror', (e) => errors.push(e.message));
      const submitted = {
        id: 'synthetic-rejected-proof',
        exercise: (lesson.exerciseNamespace || lesson.slug) + '-' + question.id,
        contentVersion: version,
        mode: 'type',
        text: 'Synthetic saved proof used only to verify submission recovery.',
        images: [],
        revealed: false,
        submitted: submittedAt,
        startedAt: submittedAt - 1000,
        activeDurationMs: 500,
        status: 'queued',
        grades: [],
        presentation: { question },
      };
      let saved;
      let uploads = 0;
      let rechecks = 0;
      const record = () => ({
        key: 'attempt/' + submitted.id,
        revision: 1,
        id: 'synthetic-server-record',
        payload: saved,
        device: 'Grader',
        updated: submittedAt + 1000,
        versions: [],
        conflicts: [],
      });
      await page.route('**/api/**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        let body = { records: [], cursor: saved ? 1 : 0, more: false, attempts: [] };
        if (url.pathname.endsWith('/auth/session'))
          body = { email: 'retry-test@example.test', expires: Date.now() + 86400000 };
        else if (url.pathname.endsWith('/recheck')) {
          rechecks++;
          await route.fulfill({ status: 409, body: 'sql: no rows in result set' });
          return;
        } else if (url.pathname.endsWith('/attempts') && request.method() === 'POST') {
          const wire = request.postDataJSON();
          for (const key of [
            'id',
            'exercise',
            'contentVersion',
            'text',
            'submitted',
            'startedAt',
            'activeDurationMs',
          ])
            assert.deepEqual(wire[key], submitted[key], 'retry preserves ' + key);
          uploads++;
          saved = {
            ...submitted,
            ...wire,
            status: 'graded',
            verdict: 'correct',
            error: '',
            grades: [
              {
                at: submittedAt + 1000,
                verdict: 'correct',
                feedback: 'Synthetic grading completed.',
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
          body = { attempts: [{ key: 'attempt/' + submitted.id, revision: 1 }] };
        else if (url.pathname.endsWith('/attempts') && saved) body = { records: [record()] };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body),
        });
      });
      await page.goto(base + '/#/practice/sets-and-set-operations/' + question.id);
      await page.locator('.exercise').waitFor();
      await page.evaluate(async (a) => {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('foundations-web', 2);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const tx = db.transaction(['attempts', 'settings'], 'readwrite');
        tx.objectStore('attempts').put(
          { ...a, status: 'error', error: 'sql: no rows in result set', activeJob: 'old-retry' },
          a.id,
        );
        tx.objectStore('settings').put(
          {
            id: a.id,
            kind: 'attempt',
            data: a,
            error: 'Update the app before submitting this exercise',
          },
          'rejected:' + a.id,
        );
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      }, submitted);
      await page.reload();
      await page.getByRole('button', { name: 'Retry grading', exact: true }).waitFor();
      await page.screenshot({ path: `${directory}/${name}-before.png`, fullPage: true });
      await page.getByRole('button', { name: 'Retry grading', exact: true }).click();
      await page.getByText('Synthetic grading completed.', { exact: true }).waitFor();
      assert.equal(uploads, 1, 'exactly one original submission is uploaded');
      assert.equal(rechecks, 0, 'an unsubmitted answer must not request a recheck');
      assert.deepEqual(errors, []);
      await page.screenshot({ path: `${directory}/${name}-recovered.png`, fullPage: true });
      await context.close();
    }
    console.log(
      'Desktop and phone: retry uploads the unchanged saved answer and displays its grade.',
    );
  },
  'preview',
);
