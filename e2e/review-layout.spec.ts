// Synthetic issued session only; no account or grading service is contacted.
import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('review-layout', async ({ page, baseURL, directory }) => {
  const now = Date.now() - 10_000;
  const day = 86_400_000;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const concept =
    'Synthetic concept with a long descriptive label that must wrap beside its status';
  const session = {
    id: 'synthetic-layout-session',
    kind: 'scheduled-review',
    mode: 'regular',
    instances: Array.from({ length: 32 }, (_, index) => ({
      id: 'synthetic-layout-' + index,
      exercise: 'review-synthetic-layout-' + index,
      lesson: 'propositional-logic',
      contentVersion: 'synthetic-layout',
      question: {
        id: 930000 + index,
        instructions: 'Synthetic layout task ' + (index + 1) + '.',
        prompt: 'Explain your response.',
        section: 'review',
      },
      context: {
        instanceId: 'synthetic-layout-' + index,
        kind: 'scheduled-review',
        templateId: 'synthetic-layout',
        concept: 'synthetic-layout-concept',
        skill: 'justify',
        scheduledFor: now - day,
        presentedAt: now,
        intervalDays: 1,
      },
    })),
  };
  const summary = {
    due: 32,
    quick: 0,
    deeper: 32,
    targets: [],
    concepts: [{ id: 'synthetic-layout-concept', name: concept }],
    skills: [{ id: 'justify', name: 'Justify' }],
    lessons: [{ slug: 'propositional-logic', title: 'Propositional Logic' }],
  };
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let body: unknown;
    if (path.endsWith('/auth/session'))
      body = { email: 'synthetic-layout@example.test', expires: now + day };
    else if (path.endsWith('/review')) body = summary;
    else if (path.endsWith('/mutations'))
      body = { ...request.postDataJSON(), revision: 1, versions: [], conflicts: [], updated: now };
    else body = { records: [], cursor: 0, more: false, attempts: [] };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  await page.goto(baseURL + '/#/review/propositional-logic');
  await page.getByRole('button', { name: 'Start review', exact: true }).waitFor();
  await page.evaluate(async (saved) => {
    const module = '/src/reviewApi.ts';
    const { retainReviewSession } = await import(module);
    await retainReviewSession(saved);
  }, session);
  await page.reload();
  await page.getByText('Regular · 1 of 32', { exact: true }).waitFor();

  for (const width of [1920, 1440, 1100, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const sidebar = page.locator('.review-sidebar');
    const review = page.locator('.review-page');
    const compact = width <= 1100;
    if (compact) {
      assert.equal(await sidebar.isVisible(), false);
      await review.getByRole('button', { name: 'Exercises', exact: true }).click();
    }
    const panel = compact
      ? page.getByRole('dialog', { name: 'Review exercises', exact: true })
      : sidebar;
    await panel.waitFor();
    const navigation = panel.getByRole('navigation', { name: 'Review exercises', exact: true });
    assert.equal(await navigation.getByRole('button').count(), 32);
    const geometry = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const reader = document.getElementById('reader')!.getBoundingClientRect();
      const review = document.querySelector('.review-page')!.getBoundingClientRect();
      return {
        panelRight: rect.right,
        readerRight: reader.right,
        reviewWidth: review.width,
        centered: Math.abs(review.left - reader.left - (rect.left - review.right)) < 2,
        noOverflow: element.scrollWidth <= element.clientWidth,
        rows: Array.from(element.querySelectorAll('.exercise-link')).map((button) => {
          const row = button.getBoundingClientRect();
          const label = button.querySelector('.review-exercise-label')!.getBoundingClientRect();
          const status = button.querySelector('.progress-state')!.getBoundingClientRect();
          return {
            fits: status.right <= row.right && label.right <= status.left,
            wraps: button.querySelector('small')!.getBoundingClientRect().height > 20,
          };
        }),
      };
    });
    assert.equal(geometry.noOverflow, true, `No horizontal scrolling at ${width}px`);
    assert.ok(
      geometry.rows.every((row) => row.fits && (width === 1100 || row.wraps)),
      `Labels and status fit at ${width}px`,
    );
    if (!compact) {
      assert.ok(
        Math.abs(geometry.panelRight - geometry.readerRight) < 2,
        'Sidebar reaches right edge',
      );
      assert.ok(geometry.reviewWidth <= 980, 'Exercise column remains readable');
      assert.equal(geometry.centered, true, 'Exercise column is centered beside the sidebar');
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `${directory}/review-layout-${width}.png`, fullPage: true });
    await navigation.getByRole('button').last().click();
    if (compact) await panel.waitFor({ state: 'hidden' });
    await page.getByText('Regular · 32 of 32', { exact: true }).waitFor();
    if (compact) await review.getByRole('button', { name: 'Exercises', exact: true }).click();
    await navigation.getByRole('button').first().click();
    if (compact) await panel.waitFor({ state: 'hidden' });
    await page.getByText('Regular · 1 of 32', { exact: true }).waitFor();
  }
  assert.deepEqual(errors, []);
  console.log(
    'Review layout passed: aligned desktop sidebar, wrapping labels and visible statuses, compact navigation, and four viewport screenshots.',
  );
});
