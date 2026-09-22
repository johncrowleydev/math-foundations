import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('review-pause', async ({ page, baseURL, directory }) => {
  let planned = 0;
  let offline = false;
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
        estimatedMinutes: planned ? 0 : 25,
        reservedMinutes: planned ? 25 : 0,
        remainingMinutes: planned ? 0 : 25,
        plannedQuick: 0,
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
  await review.getByRole('button', { name: 'Start Regular review', exact: true }).click();
  await review.getByRole('button', { name: 'Skip for now →', exact: true }).click();
  const draft = 'My unfinished second response';
  await review.getByRole('textbox', { name: 'Answer editor', exact: true }).fill(draft);
  await page.waitForFunction(async (text) => {
    const storage = await import(String('/src/storage.ts'));
    return (await storage.get('drafts', 'review-paused-1'))?.text === text;
  }, draft);
  await review.getByRole('button', { name: 'Back to overview', exact: true }).click();
  await review.getByRole('button', { name: 'Resume planned session', exact: true }).waitFor();
  assert.equal(
    await review.getByRole('button', { name: 'Start Regular review', exact: true }).isDisabled(),
    true,
  );
  await page.screenshot({ path: directory + '/paused-desktop.png' });
  offline = true;
  await page.reload();
  await review.getByRole('button', { name: 'Resume planned session', exact: true }).waitFor();
  await review.getByText('Saved review plan', { exact: false }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: directory + '/paused-mobile.png' });
  await review.getByRole('button', { name: 'Resume planned session', exact: true }).click();
  await review.getByText('Synthetic response 1', { exact: true }).waitFor();
  assert.equal(
    await review.getByRole('textbox', { name: 'Answer editor', exact: true }).innerText(),
    draft,
  );
  assert.equal(planned, 1, 'Resume reuses issued instances even when daily budget is reserved');
  await review.getByRole('button', { name: 'Back to overview', exact: true }).click();
  await review.getByRole('button', { name: 'End session', exact: true }).click();
  await review
    .getByText('Session closed. Your drafts and attempts are saved.', { exact: true })
    .waitFor();
  assert.equal(
    await review.getByRole('button', { name: 'Resume planned session', exact: true }).count(),
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
