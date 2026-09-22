import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('review-pause', async ({ page, baseURL, directory }) => {
  let planned = 0;
  let offline = false;
  let additional = false;
  const now = Date.now();
  const session = {
    id: 'paused-plan',
    kind: 'scheduled-review',
    mode: 'regular',
    estimatedMinutes: 25,
    instances: [0, 1].map((index) => ({
      id: 'paused-instance-' + index,
      exercise: 'review-paused-' + index,
      lesson: 'sets-and-set-operations',
      contentVersion: 'synthetic-pause',
      question: {
        id: 9000 + index,
        instructions: 'Explain this synthetic practice example.',
        section: 'Review',
        prompt: 'Synthetic response ' + index,
        answer: 'Synthetic answer.',
      },
      context: {
        instanceId: 'paused-instance-' + index,
        kind: 'scheduled-review',
        templateId: 'pause-fixture-' + index,
        concept: 'power-set',
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
    let body: unknown = { records: [], cursor: 0, more: false, attempts: [] };
    if (path.endsWith('/auth/session'))
      body = { email: 'pause@example.test', expires: now + 86400000 };
    else if (path.endsWith('/review/sessions')) {
      planned++;
      body = session;
    } else if (path.endsWith('/review'))
      body = {
        due: 2,
        quick: 0,
        deeper: 2,
        estimatedMinutes: planned ? (additional ? 2 : 0) : 25,
        reservedMinutes: planned ? (additional ? 23 : 25) : 0,
        remainingMinutes: planned ? 0 : 25,
        plannedQuick: additional ? 2 : 0,
        plannedApplication: 0,
        plannedDeep: planned ? 0 : 1,
        targets: [],
        concepts: [],
        skills: [],
        lessons: [],
      };
    else if (path.endsWith('/mutations'))
      body = {
        ...route.request().postDataJSON(),
        revision: 1,
        versions: [],
        conflicts: [],
        updated: now,
      };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  await page.goto(baseURL + '/#/review/sets-and-set-operations');
  const review = page.locator('.review-page');
  const editor = review.getByRole('textbox', { name: 'Answer editor', exact: true });
  await review.getByRole('button', { name: 'Start review', exact: true }).click();
  await review.getByRole('button', { name: 'Skip for now →', exact: true }).click();
  await review.getByText('Synthetic response 1', { exact: true }).waitFor();
  const draft = 'My unfinished second response';
  await editor.fill(draft);
  await page.waitForFunction(async (text) => {
    const storage = await import(String('/src/storage.ts'));
    return (await storage.get('drafts', 'review-paused-1'))?.text === text;
  }, draft);
  await review.getByRole('button', { name: 'Back to overview', exact: true }).click();
  await review.getByRole('button', { name: 'Continue review', exact: true }).waitFor();
  assert.equal(await review.getByRole('button', { name: 'Start review', exact: true }).count(), 0);
  await review.getByText('0 of 2 complete · 2 to do', { exact: true }).waitFor();
  assert.equal(await review.getByRole('button', { name: 'Quick review', exact: true }).count(), 0);
  assert.equal(
    await review.getByRole('button', { name: 'Start focused practice', exact: true }).count(),
    0,
  );
  // A fresh preview may contain more work, but the unfinished session stays primary.
  additional = true;
  await Promise.all([
    page.waitForResponse((response) => new URL(response.url()).pathname.endsWith('/review')),
    page.evaluate(() => window.dispatchEvent(new Event('online'))),
  ]);
  await page.waitForFunction(async () => {
    const { cachedReviewSummary } = await import(String('/src/reviewApi.ts'));
    return (await cachedReviewSummary())?.summary.estimatedMinutes === 2;
  });
  assert.equal(await review.getByRole('heading', { name: 'Today’s review' }).count(), 0);
  assert.equal(await review.getByRole('button', { name: 'Start review', exact: true }).count(), 0);
  assert.equal(await review.getByLabel('Next session breakdown').count(), 0);
  await page.screenshot({ path: directory + '/paused-desktop.png' });
  offline = true;
  await page.reload();
  await review.getByRole('button', { name: 'Continue review', exact: true }).waitFor();
  await review.getByText('Couldn’t check for review updates.', { exact: false }).waitFor();
  await review
    .getByText('Your saved session can still be continued offline.', { exact: false })
    .waitFor();
  await page.screenshot({ path: directory + '/cached-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: directory + '/paused-mobile.png' });
  await review.getByRole('button', { name: 'Continue review', exact: true }).click();
  await review.getByText('Synthetic response 1', { exact: true }).waitFor();
  // The question appears before the saved value finishes rendering in CodeMirror.
  await editor.scrollIntoViewIfNeeded();
  await editor.filter({ hasText: draft }).waitFor();
  assert.equal(await editor.innerText(), draft);
  await page.screenshot({ path: directory + '/resumed-mobile.png' });
  assert.equal(planned, 1, 'Resume reuses issued instances even when daily budget is reserved');
  await review.getByRole('button', { name: 'Back to overview', exact: true }).click();
  await review.getByRole('button', { name: 'End session', exact: true }).click();
  await review
    .getByText('Session closed. Your drafts and attempts are saved.', { exact: true })
    .waitFor();
  assert.equal(
    await review.getByRole('button', { name: 'Continue review', exact: true }).count(),
    0,
  );
  assert.equal(
    await review.getByRole('button', { name: 'Start focused practice', exact: true }).isEnabled(),
    true,
  );
  const savedDraft = await page.evaluate(async () => {
    const storage = await import(String('/src/storage.ts'));
    return (await storage.get('drafts', 'review-paused-1'))?.text;
  });
  assert.equal(savedDraft, draft, 'Explicit end does not delete unfinished work');
  console.log(
    'Review pause: reserved budget, second-item draft, overview/reload/offline resume, explicit end and desktop/mobile screenshots passed.',
  );
});
