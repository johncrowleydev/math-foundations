// Synthetic issued session only; no account or grading service is contacted.
import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('review-navigation', async ({ page, baseURL, directory }) => {
  const now = Date.now() - 10000;
  const day = 86400000;
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const skills = [
    'justify',
    'recall',
    'transform',
    'construct',
    'prove',
    'translate',
    'classify',
    'compare',
  ];
  const instances = skills.map((skill, index) => ({
    id: 'synthetic-nav-' + index,
    exercise: 'review-synthetic-nav-' + index,
    lesson: 'propositional-logic',
    contentVersion: 'synthetic-navigation',
    question: {
      id: 920000 + index,
      instructions: 'Synthetic navigation task ' + (index + 1) + '.',
      prompt: 'Explain your response for task ' + (index + 1) + '.',
      section: 'review',
    },
    context: {
      instanceId: 'synthetic-nav-' + index,
      kind: 'scheduled-review',
      templateId: 'synthetic-nav-' + skill,
      concept: 'distribution',
      skill,
      objective: 'factor',
      scheduledFor: now - day,
      presentedAt: now,
      intervalDays: 1,
    },
  }));
  const session = {
    id: 'synthetic-navigation-session',
    kind: 'scheduled-review',
    mode: 'regular',
    instances,
  };
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let body;
    if (path.endsWith('/auth/session'))
      body = { email: 'synthetic-navigation@example.test', expires: now + day };
    else if (path.endsWith('/review'))
      body = {
        due: 7,
        quick: 0,
        deeper: 7,
        targets: instances.map(({ context }, index) => ({
          id: context.skill,
          concept: context.concept,
          skill: context.skill,
          objective: context.objective,
          dueAt: index === 7 ? now + day : now - day,
          lastEvidenceAt: index === 7 ? now + 5000 : now - day,
          activatedAt: now - 2 * day,
          intervalDays: 1,
          evidenceLevel: 'production',
          quick: false,
          reason: 'Synthetic review state.',
        })),
        concepts: [{ id: 'distribution', name: 'Distribution and factoring' }],
        skills: skills.map((skill) => ({ id: skill, name: skill })),
        lessons: [{ slug: 'propositional-logic', title: 'Propositional Logic' }],
      };
    else if (path.endsWith('/mutations'))
      body = { ...request.postDataJSON(), revision: 1, versions: [], conflicts: [], updated: now };
    else body = { records: [], cursor: 0, more: false, attempts: [] };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  const review = page.locator('.review-page');
  const navigation = page
    .locator('.review-sidebar')
    .getByRole('navigation', { name: 'Review exercises', exact: true });
  const editor = review.getByRole('textbox', { name: 'Answer editor', exact: true });
  const task = (number) => review.getByText('Regular · ' + number + ' of 8', { exact: true });
  const draft = 'Keep this synthetic draft when I jump back to grading feedback.';
  await page.goto(baseURL + '/#/review/propositional-logic');
  await review.getByRole('button', { name: 'Start Regular review', exact: true }).waitFor();
  await page.evaluate(
    async ({ session, now }) => {
      const { retainReviewSession } = await import('/src/reviewApi.ts');
      const { put } = await import('/src/storage.ts');
      await retainReviewSession(session);
      for (const [index, status, verdict] of [
        [0, 'grading'],
        [3, 'graded', 'correct'],
        [4, 'graded', 'incorrect'],
        [5, 'not_graded'],
        [6, 'error'],
      ]) {
        const item = session.instances[index];
        await put('attempts', 'attempt-' + item.id, {
          id: 'attempt-' + item.id,
          exercise: item.exercise,
          submitted: now + 1000,
          contentVersion: item.contentVersion,
          mode: 'type',
          text: 'Synthetic submitted response ' + (index + 1) + '.',
          images: [],
          revealed: false,
          status,
          ...(verdict ? { verdict } : {}),
          grades: verdict ? [{ verdict, feedback: 'Synthetic feedback.', at: now + 1000 }] : [],
          review: item.context,
        });
      }
    },
    { session, now },
  );
  await page.reload();
  await task(1).waitFor();
  await navigation.getByRole('button', { name: /1.*Grading/i }).waitFor();
  assert.equal(await navigation.getByRole('button').count(), 8);
  for (const [number, status] of [
    [2, 'Not attempted'],
    [4, 'Correct'],
    [5, 'Incorrect'],
    [6, 'Needs revision'],
    [7, 'Grading failed'],
    [8, 'Covered'],
  ]) {
    await navigation
      .getByRole('button', { name: new RegExp(number + '.*' + status, 'i') })
      .waitFor();
  }

  await navigation.getByRole('button').nth(2).click();
  await task(3).waitFor();
  await editor.fill(draft);
  await page.waitForFunction(async (text) => {
    const { get } = await import('/src/storage.ts');
    return (await get('drafts', 'review-synthetic-nav-2'))?.text === text;
  }, draft);
  await navigation.getByRole('button', { name: /3.*Draft/i }).waitFor();
  await navigation.getByRole('button').first().click();
  await task(1).waitFor();
  await review.getByText('Synthetic submitted response 1.', { exact: true }).waitFor();
  await review.getByLabel('Grading in progress', { exact: true }).waitFor();
  await navigation.getByRole('button').nth(2).click();
  await task(3).waitFor();
  await page.waitForFunction(
    (text) =>
      document.querySelector('.review-page [aria-label="Answer editor"]')?.textContent === text,
    draft,
  );

  // A storage update models background grading while a different task is open.
  await page.evaluate(async () => {
    const { get, put } = await import('/src/storage.ts');
    const saved = await get('attempts', 'attempt-synthetic-nav-0');
    await put('attempts', saved.id, {
      ...saved,
      status: 'graded',
      verdict: 'correct',
      grades: [
        {
          verdict: 'correct',
          feedback: 'Background feedback is ready to revisit.',
          at: Date.now(),
        },
      ],
    });
  });
  await navigation.getByRole('button', { name: /1.*Correct/i }).waitFor();
  assert.equal(await editor.innerText(), draft);
  await navigation.getByRole('button').first().click();
  await review.getByText('Background feedback is ready to revisit.', { exact: true }).waitFor();
  await page.screenshot({ path: directory + '/review-navigation-desktop.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await review.getByRole('button', { name: 'Exercises', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Review exercises', exact: true });
  const mobileNav = dialog.getByRole('navigation', { name: 'Review exercises', exact: true });
  await mobileNav.getByRole('button', { name: /3.*Draft/i }).waitFor();
  await page.screenshot({ path: directory + '/review-navigation-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobileNav.getByRole('button').nth(2).click();
  await dialog.waitFor({ state: 'hidden' });
  await task(3).waitFor();
  await page.waitForFunction(
    (text) =>
      document.querySelector('.review-page [aria-label="Answer editor"]')?.textContent === text,
    draft,
  );
  await review.getByRole('button', { name: 'Exercises', exact: true }).click();
  await mobileNav.getByRole('button').last().click();
  await task(8).waitFor();
  await review.getByRole('button', { name: 'Next →', exact: true }).click();
  await review.getByRole('button', { name: 'Revisit tasks', exact: true }).waitFor();
  await review.getByRole('button', { name: 'Exercises', exact: true }).click();
  await mobileNav.getByRole('button').first().click();
  await task(1).waitFor();
  await review.getByText('Background feedback is ready to revisit.', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Review navigation passed: all statuses, background feedback, retained drafts, mobile menu, session-end access, and desktop/mobile screenshots.',
  );
});
