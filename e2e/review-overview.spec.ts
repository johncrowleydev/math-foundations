import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('review-overview', async ({ page, baseURL, directory }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let offline = false;
  let empty = false;
  let issued = 0;
  const budgets: string[] = [];
  const summary = {
    due: 11,
    quick: 8,
    deeper: 3,
    estimatedMinutes: 12,
    plannedQuick: 8,
    plannedApplication: 2,
    plannedDeep: 1,
    targets: [],
    concepts: [],
    skills: [],
    lessons: [],
  };
  await page.route('**/api/**', async (route) => {
    if (offline) return route.abort('internetdisconnected');
    const url = new URL(route.request().url());
    let body: unknown = { records: [], cursor: 0, more: false, attempts: [] };
    if (url.pathname.endsWith('/auth/session'))
      body = { email: 'overview@example.test', expires: Date.now() + 86400000 };
    else if (url.pathname.endsWith('/review')) {
      budgets.push(url.searchParams.get('budgetMinutes') || '');
      body = empty ? { ...summary, due: 0, quick: 0, estimatedMinutes: 0 } : summary;
    } else if (url.pathname.endsWith('/review/sessions')) {
      issued++;
      // The server may have no work left by the time a preview is started.
      empty = true;
      body = { id: 'empty-session', ...route.request().postDataJSON(), instances: [] };
    } else if (url.pathname.endsWith('/mutations'))
      body = {
        ...route.request().postDataJSON(),
        revision: 1,
        versions: [],
        conflicts: [],
        updated: Date.now(),
      };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  await page.goto(baseURL + '/#/review/sets-and-set-operations');
  const review = page.locator('.review-page');
  await review.getByRole('heading', { name: 'Today’s review', exact: true }).waitFor();
  await review.getByText('About 12 minutes', { exact: true }).waitFor();
  assert.deepEqual(await review.locator('.review-counts strong').allTextContents(), [
    '8',
    '2',
    '1',
  ]);
  assert.equal(
    await review.getByRole('button', { name: 'Start review', exact: true }).isEnabled(),
    true,
  );
  assert.equal(
    await review.getByRole('button', { name: 'Quick review', exact: true }).isEnabled(),
    true,
  );
  assert.equal(
    await review.getByRole('button', { name: /Refresh|Try again|Check for updates/ }).count(),
    0,
  );
  assert.equal(await review.locator('.review-targets').getAttribute('open'), null);
  await page.screenshot({ path: directory + '/due-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: directory + '/due-mobile.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith('/review?budgetMinutes=15')),
    review.getByLabel('Daily review target').selectOption('15'),
  ]);
  assert.ok(budgets.includes('15'));

  // Cached status without an issued session must not promise offline questions.
  offline = true;
  await page.reload();
  await review.getByText('Couldn’t check for review updates.', { exact: false }).waitFor();
  await review
    .getByText('Starting a review or focused practice session needs a connection.', { exact: true })
    .waitFor();
  assert.equal(await review.getByText('saved session', { exact: false }).count(), 0);
  await page.screenshot({ path: directory + '/cached-without-session-desktop.png' });
  offline = false;
  empty = true;
  await review.getByRole('button', { name: 'Try again', exact: true }).click();
  await review.getByRole('heading', { name: 'You’re caught up for now', exact: true }).waitFor();
  assert.equal(
    await review.getByRole('button', { name: /^(Start review|Quick review)$/ }).count(),
    0,
  );
  assert.equal(await review.getByRole('button', { name: 'Try again', exact: true }).count(), 0);
  assert.equal(
    await review.getByRole('button', { name: 'Start focused practice', exact: true }).isEnabled(),
    true,
  );
  assert.equal(await review.getByLabel('Daily review target').inputValue(), '15');
  await page.screenshot({ path: directory + '/caught-up-desktop.png' });

  // Online events refresh status without exposing a permanent Refresh control.
  empty = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await review.getByRole('button', { name: 'Start review', exact: true }).click();
  await review.getByRole('heading', { name: 'You’re caught up for now', exact: true }).waitFor();
  assert.equal(issued, 1);
  const saved = await page.evaluate(async () => {
    const { cachedReviewSession } = await import(String('/src/reviewApi.ts'));
    return cachedReviewSession();
  });
  assert.equal(saved, undefined, 'An empty server session cannot block the overview');
  await page.reload();
  await review.getByRole('heading', { name: 'You’re caught up for now', exact: true }).waitFor();
  assert.equal(
    await review.getByRole('button', { name: 'Continue review', exact: true }).count(),
    0,
  );
  assert.deepEqual(errors, []);
});
