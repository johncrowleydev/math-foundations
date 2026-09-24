import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('review-loading', async ({ page, baseURL, directory }) => {
  const summary = {
    due: 1,
    quick: 1,
    deeper: 0,
    estimatedMinutes: 1,
    targets: [],
    concepts: [],
    skills: [],
    lessons: [],
  };
  let requests = 0;
  let fail = true;
  let releaseSummary!: () => void;
  let summaryGate = new Promise<void>((resolve) => (releaseSummary = resolve));
  let releasePlan!: () => void;
  const planGate = new Promise<void>((resolve) => (releasePlan = resolve));
  let releaseCatalog!: () => void;
  const catalogGate = new Promise<void>((resolve) => (releaseCatalog = resolve));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = { records: [], cursor: 0, more: false, attempts: [] };
    if (path.endsWith('/auth/session'))
      body = { email: 'loading@example.test', expires: Date.now() + 86400000 };
    else if (path.endsWith('/review')) {
      requests++;
      await summaryGate;
      if (fail) return route.fulfill({ status: 503, body: 'Review temporarily unavailable' });
      body = summary;
    } else if (path.endsWith('/review/sessions')) {
      await planGate;
      body = { id: 'loading-plan', kind: 'scheduled-review', mode: 'quick', instances: [] };
    } else if (path.endsWith('/review/catalog')) {
      await catalogGate;
      body = { items: [] };
    }
    await route.fulfill({ json: body });
  });
  const review = page.locator('.review-page');
  const loading = review.locator('.review-loading');
  await page.goto(baseURL + '/#/review/sets-and-set-operations');
  await loading.getByText('Loading review schedule…', { exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector('.review-loading .spinner'));
  assert.equal(
    await loading.locator('.spinner').evaluate((node) => getComputedStyle(node).animationName),
    'spin',
  );
  await page.screenshot({ path: directory + '/loading-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: directory + '/loading-mobile.png' });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal(requests, 1, 'Opening Review issues only one summary request');
  releaseSummary();
  await review.getByRole('alert').waitFor();
  await loading.waitFor({ state: 'hidden' });
  fail = false;
  summaryGate = new Promise<void>((resolve) => (releaseSummary = resolve));
  await review.getByRole('button', { name: 'Try again' }).click();
  await loading.waitFor();
  releaseSummary();
  await review.getByRole('button', { name: 'Quick review', exact: true }).waitFor();
  await loading.waitFor({ state: 'hidden' });
  assert.equal(requests, 2);

  // Cached plans remain usable while a slow refresh is still pending.
  summaryGate = new Promise<void>((resolve) => (releaseSummary = resolve));
  await page.reload();
  await review.getByRole('button', { name: 'Quick review', exact: true }).waitFor();
  await loading.getByText('Refreshing review schedule…', { exact: true }).waitFor();
  assert.equal(await review.getByRole('button', { name: 'Try again', exact: true }).count(), 0);
  await page.screenshot({ path: directory + '/refreshing-mobile.png' });
  releaseSummary();
  await loading.waitFor({ state: 'hidden' });
  assert.equal(requests, 3, 'Cached restoration also issues only one summary request');

  await review.getByRole('button', { name: 'Quick review', exact: true }).click();
  await loading.getByText('Planning your session…', { exact: true }).waitFor();
  await page.screenshot({ path: directory + '/planning-mobile.png' });
  // A summary refresh after planning must not keep the planning controls busy.
  summaryGate = new Promise<void>((resolve) => (releaseSummary = resolve));
  releasePlan();
  await loading.getByText('Refreshing review schedule…', { exact: true }).waitFor();
  assert.equal(
    await review.getByRole('button', { name: 'Start focused practice' }).isEnabled(),
    true,
  );
  releaseSummary();
  await loading.waitFor({ state: 'hidden' });
  await review.getByRole('link', { name: 'Review Library' }).click();
  const libraryLoading = page.locator('.review-library-page .review-loading');
  await libraryLoading.waitFor();
  assert.equal(await libraryLoading.locator('.spinner').count(), 1);
  await page.screenshot({ path: directory + '/library-loading-mobile.png' });
  releaseCatalog();
  await libraryLoading.waitFor({ state: 'hidden' });
  console.log(
    'Review loading: one initial request, animated status, retry, cached refresh, planning and library loading passed.',
  );
});
