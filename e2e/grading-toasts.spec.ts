import { withBrowser } from './support/browser.ts';

await withBrowser('grading-toasts', async ({ page, baseURL, directory }) => {
  // Synthetic local data only; no request reaches an account or grading service.
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        route.request().url().includes('/auth/session')
          ? { email: 'synthetic@example.test', expires: Date.now() + 86400000 }
          : { records: [], attempts: [], cursor: 0, more: false },
      ),
    }),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(baseURL + '/#/practice/propositional-logic/19');
  await page.locator('.practice-heading').waitFor();
  const save = async (id: string, status: 'grading' | 'graded', exercise = 19) => {
    await page.evaluate(
      async ({ id, status, exercise }) => {
        const { put } = await import(String('/src/storage.ts'));
        await put('attempts', id, {
          id,
          exercise: 'propositional-logic-' + exercise,
          submitted: Date.now(),
          contentVersion: 'test',
          mode: 'type',
          text: 'Synthetic answer',
          images: [],
          revealed: false,
          status,
          ...(status === 'graded' ? { verdict: 'correct' } : {}),
          grades:
            status === 'graded'
              ? [{ verdict: 'correct', feedback: 'Synthetic feedback', at: 1 }]
              : [],
        });
      },
      { id, status, exercise },
    );
    await page.waitForTimeout(150);
  };
  const silent = async () => {
    if (await page.locator('.grading-toast').count())
      throw Error('Unexpected foreground or duplicate toast');
  };
  await save('foreground', 'grading');
  await save('foreground', 'graded');
  await silent();
  await page.screenshot({ path: directory + '/grading-foreground.png' });
  await save('background', 'grading');
  await page.getByRole('button', { name: 'Next →', exact: true }).click();
  await save('background', 'graded');
  await page.locator('.grading-toast').waitFor();
  if (!(await page.locator('.grading-toast').innerText()).includes('Grading complete — Correct'))
    throw Error('Missing result');
  await page.screenshot({ path: directory + '/grading-background-desktop.png' });
  await page.getByRole('button', { name: 'Dismiss grading notification' }).click();
  await save('background', 'graded');
  await silent();
  // Returning to the original question before completion must also stay silent.
  await save('returned', 'grading');
  await page.getByRole('button', { name: '← Previous', exact: true }).click();
  await save('returned', 'graded');
  await silent();
  await page.setViewportSize({ width: 390, height: 844 });
  await save('phone', 'grading');
  await page.getByRole('button', { name: 'Next →', exact: true }).click();
  await save('phone', 'graded');
  await page.locator('.grading-toast').waitFor();
  await page.screenshot({ path: directory + '/grading-background-mobile.png' });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw Error('Mobile overflow');
  await page.locator('.grading-toast').waitFor({ state: 'detached', timeout: 10000 });
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  const inline = page.locator('[data-exercise-key]').first();
  await inline.scrollIntoViewIfNeeded();
  const inlineId = Number((await inline.getAttribute('data-exercise-key'))!.split('-').at(-1));
  await save('inline-visible', 'grading', inlineId);
  await save('inline-visible', 'graded', inlineId);
  await silent();
  await save('inline-background', 'grading', inlineId);
  await page.locator('#lesson-start').scrollIntoViewIfNeeded();
  await save('inline-background', 'graded', inlineId);
  await page.locator('.grading-toast').waitFor();
  console.log(
    'PASS: foreground, background, duplicate sync, return before completion, dismissal, expiry, desktop, mobile, visible and offscreen inline exercises',
  );
});
