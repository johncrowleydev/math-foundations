import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('learning-efficiency', async ({ page, baseURL, directory }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const budgets: number[] = [];
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let body: unknown = { records: [], cursor: 0, more: false, attempts: [] };
    if (url.pathname.endsWith('/auth/session'))
      body = { email: 'efficiency@example.test', expires: Date.now() + 86400000 };
    else if (url.pathname.endsWith('/review')) {
      const budgetMinutes = Number(url.searchParams.get('budgetMinutes'));
      budgets.push(budgetMinutes);
      body = {
        due: 90,
        quick: 75,
        deeper: 15,
        budgetMinutes,
        estimatedMinutes: Math.min(budgetMinutes, 24),
        plannedQuick: 18,
        plannedApplication: 4,
        plannedDeep: budgetMinutes >= 25 ? 1 : 0,
        reservedMinutes: 0,
        remainingMinutes: budgetMinutes,
        targets: [],
        concepts: [],
        skills: [],
        lessons: [],
      };
    } else if (url.pathname.endsWith('/mutations'))
      body = {
        ...request.postDataJSON(),
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
  await review.getByText('~24 minutes', { exact: true }).waitFor();
  assert.equal(await review.getByLabel('Daily review target').inputValue(), '25');
  assert.equal(
    await review.getByText('90', { exact: true }).count(),
    0,
    'Backlog is not the main review summary',
  );
  await page.screenshot({ path: directory + '/review-desktop.png' });
  await review.getByLabel('Daily review target').selectOption('15');
  await review.getByText('~15 minutes', { exact: true }).waitFor();
  await page.reload();
  await review.getByText('~15 minutes', { exact: true }).waitFor();
  assert.equal(await review.getByLabel('Daily review target').inputValue(), '15');
  assert.ok(budgets.includes(15), 'Preview requests carry the persisted target');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: directory + '/review-mobile.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL + '/#/practice/sets-and-set-operations/1');
  await page.getByRole('navigation', { name: 'Exercise navigation' }).waitFor();
  assert.match(await page.locator('.practice-sidebar').innerText(), /Recommended practice/i);
  assert.equal(await page.locator('.extra-practice').getAttribute('open'), null);
  await page
    .getByRole('navigation', { name: 'Exercise navigation' })
    .getByRole('button', { name: 'Next →', exact: true })
    .click();
  assert.match(
    page.url(),
    /\/81$/,
    'Recommended sequence includes the colocated quick check before extra bank work',
  );
  await page.screenshot({ path: directory + '/practice-desktop.png' });

  // Existing exercise links still resolve into the optional bank. Two separate
  // first responses may suggest skipping a similar routine item, never delete it.
  await page.goto(baseURL + '/#/practice/sets-and-set-operations/13');
  await page.evaluate(async () => {
    const modulePath = '/src/storage.ts';
    const storage = await import(modulePath);
    for (const id of [11, 12])
      await storage.put('attempts', 'efficient-' + id, {
        id: 'efficient-' + id,
        exercise: 'sets-and-set-operations-' + id,
        submitted: 1000 + id,
        contentVersion: 'fixture',
        mode: 'type',
        text: 'Synthetic correct response',
        images: [],
        revealed: false,
        status: 'graded',
        verdict: 'correct',
        grades: [],
        activeDurationMs: 20_000,
        assistance: {
          answerPreviouslyRevealed: false,
          priorIncorrectFeedbackSeen: false,
          copiedFromRetry: false,
        },
      });
  });
  const visible = page
    .locator('.reading-column')
    .filter({ has: page.locator('.practice-heading') });
  await visible.getByRole('button', { name: 'Skip similar practice', exact: true }).click();
  await visible.getByRole('button', { name: 'Show exercise again', exact: true }).waitFor();
  assert.equal(await visible.locator('.exercise').count(), 0);
  await visible.getByRole('button', { name: 'Show exercise again', exact: true }).click();
  assert.ok(await visible.locator('.exercise').count());
  await page.screenshot({ path: directory + '/adaptive-practice.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: directory + '/practice-mobile.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await visible.getByRole('button', { name: 'Skip similar practice', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Exercise navigation' })
    .getByRole('button', { name: 'Next →', exact: true })
    .click();
  await visible.getByRole('button', { name: 'Skip similar practice', exact: true }).waitFor();
  assert.ok(
    await visible.locator('.exercise').count(),
    'Skipping one question does not hide the next question',
  );
  await page.goto(baseURL + '/#/learn/sets-and-set-operations/power-sets');
  const proofHeading = page.getByRole('heading', {
    name: 'Worked proof: a larger set allows every old selection',
  });
  await proofHeading.waitFor();
  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page
      .getByRole('heading', { name: 'Power sets', exact: true })
      .evaluate((node) => node.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: directory + '/sets-power-set-' + name + '.png' });
    await proofHeading.evaluate((node) => node.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: directory + '/sets-proof-' + name + '.png' });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  }
  assert.equal(await page.locator('.katex-error').count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    'Learning efficiency: budget persistence, bounded review summary, recommended/optional routing, adaptive skip/restore and desktop/mobile screenshots passed.',
  );
});
