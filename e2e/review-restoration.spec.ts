import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('review-restoration', async ({ page, baseURL, directory }) => {
  const now = Date.now() - 10000;
  let offline = false;
  let allCovered = false;
  let issued = 0;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const instances = Array.from({ length: 32 }, (_, index) => ({
    id: 'restored-' + index,
    exercise: 'review-restored-' + index,
    lesson: 'sets-and-set-operations',
    contentVersion: 'synthetic-restoration',
    question: {
      id: 9200 + index,
      section: 'Review',
      instructions: 'Explain your reasoning.',
      prompt: 'Saved question ' + (index + 1),
    },
    context: {
      instanceId: 'restored-' + index,
      kind: 'scheduled-review',
      templateId: 'fixture-' + index,
      concept: 'concept-' + index,
      skill: 'explain',
      scheduledFor: now - 1000,
      presentedAt: now,
      intervalDays: 1,
    },
  }));
  const session = { id: 'saved-session', kind: 'scheduled-review', mode: 'regular', instances };
  await page.route('**/api/**', async (route) => {
    if (offline) return route.abort('internetdisconnected');
    const path = new URL(route.request().url()).pathname;
    let body: unknown = { records: [], attempts: [], cursor: 0, more: false };
    if (path.endsWith('/auth/session'))
      body = { email: 'restoration@example.test', expires: now + 86400000 };
    else if (path.endsWith('/review'))
      body = {
        due: allCovered ? 0 : 1,
        quick: 0,
        deeper: allCovered ? 0 : 1,
        estimatedMinutes: allCovered ? 0 : 2,
        concepts: [],
        skills: [],
        lessons: [],
        targets: instances.map((item, index) => ({
          id: item.context.concept,
          concept: item.context.concept,
          skill: 'explain',
          dueAt: !allCovered && index === 11 ? now - 1000 : now + 86400000,
          lastEvidenceAt: now + 1000,
          activatedAt: now - 1000,
          intervalDays: 1,
          reason: 'Synthetic server coverage.',
          evidenceLevel: 'production',
          quick: false,
        })),
      };
    else if (path.endsWith('/review/sessions')) {
      issued++;
      throw Error('Restoring must not issue another session');
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
  await review.getByRole('heading', { name: 'Today’s review', exact: true }).waitFor();
  await page.evaluate(async (saved) => {
    const { retainReviewSession } = await import(String('/src/reviewApi.ts'));
    const { put, emptyDraft } = await import(String('/src/storage.ts'));
    await put('drafts', saved.instances[11].exercise, {
      ...emptyDraft(),
      text: 'My unfinished explanation',
    });
    await retainReviewSession(saved, { paused: false, index: saved.instances.length });
  }, session);
  await page.reload();
  await review.getByText('Regular · 12 of 32', { exact: true }).waitFor();
  const editor = review.getByRole('textbox', { name: 'Answer editor', exact: true });
  assert.equal(await editor.innerText(), 'My unfinished explanation');
  assert.equal(await review.getByRole('heading', { name: 'End of the question list' }).count(), 0);
  await page.screenshot({ path: directory + '/restored-unfinished-desktop.png' });

  // Explicit navigation persists position; going past the last item does not end the session.
  const navigation = page
    .locator('.review-sidebar')
    .getByRole('navigation', { name: 'Review exercises' });
  await navigation.getByRole('button').last().click();
  await review.getByText('Regular · 32 of 32', { exact: true }).waitFor();
  const position = await page.evaluate(async () => {
    const { cachedReviewSessionState } = await import(String('/src/reviewApi.ts'));
    return (await cachedReviewSessionState()).index;
  });
  assert.equal(position, 31);
  await review.getByRole('button', { name: 'Next →', exact: true }).click();
  await review.getByRole('heading', { name: 'End of the question list', exact: true }).waitFor();
  await review.getByText('Your session is still open.', { exact: false }).waitFor();
  await review.getByRole('button', { name: 'Back to overview', exact: true }).click();
  await review.getByRole('button', { name: 'Continue review', exact: true }).waitFor();
  offline = true;
  await page.reload();
  await review.getByRole('button', { name: 'Continue review', exact: true }).click();
  await review.getByText('Regular · 12 of 32', { exact: true }).waitFor();
  assert.equal(await editor.innerText(), 'My unfinished explanation');
  await page.reload();
  await review.getByText('Regular · 12 of 32', { exact: true }).waitFor();

  // Even when server evidence covers every question, opening saved work shows a question.
  offline = false;
  allCovered = true;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await review
    .getByText('This review target is already covered by recent work.', { exact: false })
    .waitFor();
  await page.reload();
  await review.getByText('Regular · 12 of 32', { exact: true }).waitFor();
  assert.equal(await review.getByRole('heading', { name: 'End of the question list' }).count(), 0);
  assert.equal(await editor.innerText(), 'My unfinished explanation');
  assert.equal(issued, 0);
  assert.deepEqual(errors, []);
});
