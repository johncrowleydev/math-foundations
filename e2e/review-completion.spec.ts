import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('review-completion', async ({ page, baseURL, directory }) => {
  const now = Date.now() - 10_000;
  let offline = false;
  let issued = 0;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const session = {
    id: 'completed-session',
    kind: 'scheduled-review',
    mode: 'regular',
    instances: Array.from({ length: 32 }, (_, index) => ({
      id: 'completion-' + index,
      exercise: 'review-completion-' + index,
      lesson: 'sets-and-set-operations',
      contentVersion: 'synthetic-completion',
      question: {
        id: 9400 + index,
        section: 'Review',
        instructions: 'Explain your reasoning.',
        prompt: 'Saved question ' + (index + 1),
      },
      context: {
        instanceId: 'completion-' + index,
        kind: 'scheduled-review',
        templateId: 'fixture-' + index,
        concept: 'concept-' + index,
        skill: 'explain',
        scheduledFor: now - 1000,
        presentedAt: now,
        intervalDays: 1,
      },
    })),
  };
  await page.route('**/api/**', async (route) => {
    if (offline) return route.abort('internetdisconnected');
    const path = new URL(route.request().url()).pathname;
    let body: unknown = { records: [], attempts: [], cursor: 0, more: false };
    if (path.endsWith('/auth/session'))
      body = { email: 'completion@example.test', expires: now + 86400000 };
    else if (path.endsWith('/review'))
      body = {
        due: 0,
        quick: 0,
        deeper: 0,
        estimatedMinutes: 0,
        concepts: [],
        skills: [],
        lessons: [],
        targets: [],
      };
    else if (path.endsWith('/review/sessions')) {
      issued++;
      throw Error('Inspecting saved work must not issue a session');
    } else if (path.endsWith('/mutations'))
      body = {
        ...route.request().postDataJSON(),
        revision: 1,
        updated: now,
        versions: [],
        conflicts: [],
      };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto(baseURL + '/#/review/sets-and-set-operations');
  const review = page.locator('.review-page');
  await review.getByRole('heading', { name: 'You’re caught up for now', exact: true }).waitFor();
  await page.evaluate(
    async ({ saved, now }) => {
      const { retainReviewSession } = await import(String('/src/reviewApi.ts'));
      const { put, emptyDraft } = await import(String('/src/storage.ts'));
      for (const instance of saved.instances)
        await put('attempts', instance.id, {
          id: instance.id,
          exercise: instance.exercise,
          status: 'graded',
          verdict: 'correct',
          submitted: now,
          contentVersion: instance.contentVersion,
          mode: 'type',
          text: 'My saved answer',
          images: [],
          revealed: false,
          grades: [],
        });
      await put('drafts', saved.instances[0].exercise, {
        ...emptyDraft(),
        text: 'My saved scratchwork',
      });
      await retainReviewSession(saved, { paused: true, index: 31 });
    },
    { saved: session, now },
  );
  await page.reload();
  await review.getByRole('heading', { name: 'Review complete', exact: true }).waitFor();
  await review.getByText('32 of 32 complete', { exact: true }).waitFor();
  assert.equal(await review.getByText(/unfinished/).count(), 0);
  assert.equal(
    await review.getByRole('button', { name: 'Continue review', exact: true }).count(),
    0,
  );
  await page.screenshot({ path: directory + '/complete-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: directory + '/complete-mobile.png' });
  await page.setViewportSize({ width: 1920, height: 1000 });

  // A completed session remains inspectable, and completion survives an offline reload.
  await review.getByRole('button', { name: 'Review answers', exact: true }).click();
  await review.getByText('Regular · 32 of 32', { exact: true }).waitFor();
  await review.getByRole('heading', { name: 'Review complete', exact: true }).waitFor();
  await page.screenshot({ path: directory + '/completed-answers-desktop.png' });
  await review.getByRole('button', { name: 'Next →', exact: true }).click();
  await review.getByRole('button', { name: 'Revisit questions', exact: true }).waitFor();
  await review.getByRole('heading', { name: 'Review complete', exact: true }).waitFor();
  await review.getByRole('button', { name: 'Back to overview', exact: true }).click();
  await review.getByRole('button', { name: 'Review answers', exact: true }).waitFor();
  offline = true;
  await page.reload();
  await review.getByRole('heading', { name: 'Review complete', exact: true }).waitFor();
  await review.getByText('32 of 32 complete', { exact: true }).waitFor();

  // Pending and failed/incorrect answers must not be mistaken for completion.
  await page.evaluate(async () => {
    const { get, put } = await import(String('/src/storage.ts'));
    const saved = await get('attempts', 'completion-31');
    await put('attempts', saved.id, { ...saved, status: 'grading', verdict: undefined });
  });
  await review.getByRole('heading', { name: 'Answers awaiting grading', exact: true }).waitFor();
  await review.getByText('31 of 32 complete · 1 awaiting grading', { exact: true }).waitFor();
  assert.equal(await review.getByText(/unfinished/).count(), 0);
  await page.screenshot({ path: directory + '/awaiting-grading-desktop.png' });
  await page.evaluate(async () => {
    const { get, put } = await import(String('/src/storage.ts'));
    const saved = await get('attempts', 'completion-31');
    await put('attempts', saved.id, { ...saved, status: 'graded', verdict: 'incorrect' });
  });
  await review.getByRole('heading', { name: 'Continue your review', exact: true }).waitFor();
  await review.getByText('31 of 32 complete · 1 to do', { exact: true }).waitFor();
  await review.getByRole('button', { name: 'Continue review', exact: true }).click();
  await review.getByText('Regular · 32 of 32', { exact: true }).waitFor();
  // A new grading result updates completion without requiring navigation/reload.
  await page.evaluate(async () => {
    const { get, put } = await import(String('/src/storage.ts'));
    const saved = await get('attempts', 'completion-31');
    await put('attempts', saved.id, { ...saved, verdict: 'correct' });
  });
  await review.getByRole('heading', { name: 'Review complete', exact: true }).waitFor();
  await review.getByRole('button', { name: 'Close session', exact: true }).click();
  await review.getByRole('heading', { name: 'You’re caught up for now', exact: true }).waitFor();
  const retained = await page.evaluate(async () => {
    const { all, get } = await import(String('/src/storage.ts'));
    const { cachedReviewSession } = await import(String('/src/reviewApi.ts'));
    return {
      attempts: (await all('attempts')).length,
      draft: (await get('drafts', 'review-completion-0')).text,
      active: await cachedReviewSession(),
    };
  });
  assert.equal(retained.attempts, 32);
  assert.equal(retained.draft, 'My saved scratchwork');
  assert.equal(retained.active, undefined);
  assert.equal(issued, 0);
  assert.deepEqual(errors, []);
});
