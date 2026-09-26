// Synthetic browser data only; no request reaches an account or grading service.
import assert from 'node:assert/strict';
import type { Locator, Page } from 'playwright';
import { withBrowser } from './support/browser.ts';

// Finish user-initiated scrolling and the editor's deferred measurement before
// measuring a background update. Never settle after the transition under test.
async function settleEditor(page: Page) {
  await page.evaluate(async () => {
    let previous = '';
    let stableSince = performance.now();
    const deadline = stableSince + 3000;
    for (;;) {
      await new Promise(requestAnimationFrame);
      const box = document.querySelector('.cm-content')!.getBoundingClientRect();
      const current = JSON.stringify([
        box.x,
        box.y,
        box.width,
        box.height,
        document.querySelector('.reader')!.scrollTop,
      ]);
      if (current !== previous) {
        previous = current;
        stableSince = performance.now();
      }
      if (performance.now() - stableSince >= 500) return;
      if (performance.now() > deadline)
        throw Error('Editor failed to settle before background update');
    }
  });
}

async function positions(controls: Record<string, Locator>) {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(controls).map(async ([name, control]) => {
        const box = await control.boundingBox();
        assert.ok(box, `${name} must remain visible`);
        return [name, box];
      }),
    ),
  );
}

async function unchanged(
  before: Awaited<ReturnType<typeof positions>>,
  controls: Record<string, Locator>,
  transition: string,
) {
  const after = await positions(controls);
  for (const name of Object.keys(before)) {
    for (const dimension of ['x', 'y', 'width', 'height'] as const) {
      assert.ok(
        Math.abs(before[name][dimension] - after[name][dimension]) <= 1,
        `${transition}: ${name} ${dimension} moved from ${before[name][dimension]} to ${after[name][dimension]}`,
      );
    }
  }
}

await withBrowser('review-layout-stability', async ({ browser, baseURL, directory }) => {
  for (const viewport of [
    { width: 1440, height: 1000, name: 'desktop' },
    { width: 390, height: 844, name: 'mobile' },
  ]) {
    const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    try {
      const now = Date.now() - 10_000;
      const day = 86_400_000;
      let complete = false;
      let covered = false;
      let heldSummary: Promise<void> | undefined;
      let releaseSummary: (() => void) | undefined;
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const instances = ['recall', 'transform'].map((skill, index) => ({
        id: `synthetic-layout-${skill}`,
        exercise: `review-synthetic-layout-${skill}`,
        lesson: 'propositional-logic',
        contentVersion: 'synthetic-layout',
        question: {
          id: 920000 + index,
          instructions: 'Synthetic layout test task.',
          prompt: 'Describe your response.',
          section: 'review',
        },
        context: {
          instanceId: `synthetic-layout-${skill}`,
          kind: 'scheduled-review',
          templateId: `synthetic-layout-${skill}`,
          concept: 'distribution',
          skill,
          objective: 'factor',
          scheduledFor: now - day,
          presentedAt: now,
          intervalDays: 1,
        },
      }));
      const session = {
        id: 'synthetic-layout-session',
        kind: 'scheduled-review',
        mode: 'regular',
        instances,
      };
      await page.route('**/api/**', async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        let body;
        if (path.endsWith('/auth/session')) {
          body = { email: 'synthetic-layout@example.test', expires: now + day };
        } else if (path.endsWith('/review')) {
          if (heldSummary) await heldSummary;
          body = {
            due: complete ? 0 : 2,
            quick: complete ? 0 : 1,
            deeper: complete ? 0 : 1,
            estimatedMinutes: complete ? 0 : 5,
            plannedQuick: complete ? 0 : 1,
            plannedApplication: complete ? 0 : 1,
            plannedDeep: 0,
            reservedMinutes: complete ? 25 : 0,
            targets: instances.map(({ context: item }) => ({
              id: item.skill,
              concept: item.concept,
              skill: item.skill,
              objective: item.objective,
              dueAt: covered && item.skill === 'recall' ? now + day : now - day,
              lastEvidenceAt: covered && item.skill === 'recall' ? now + 5000 : now - day,
              activatedAt: now - 2 * day,
              intervalDays: 1,
              evidenceLevel: 'production',
              quick: item.skill === 'recall',
              reason: 'Synthetic review state.',
            })),
            concepts: [{ id: 'distribution', name: 'Distribution and factoring' }],
            skills: instances.map(({ context: item }) => ({ id: item.skill, name: item.skill })),
            lessons: [{ slug: 'propositional-logic', title: 'Propositional Logic' }],
          };
        } else if (path.endsWith('/mutations')) {
          body = {
            ...request.postDataJSON(),
            revision: 1,
            versions: [],
            conflicts: [],
            updated: now,
          };
        } else {
          body = { records: [], attempts: [], cursor: 0, more: false };
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body),
        });
      });
      const review = page.locator('.review-page');
      const start = review.getByRole('button', { name: 'Start review', exact: true });
      const refresh = () => page.evaluate(() => window.dispatchEvent(new Event('online')));
      await page.goto(baseURL + '/#/review/propositional-logic');
      await start.waitFor();
      const overviewControls = {
        lesson: review.locator('.review-filters select').nth(0),
        concept: review.locator('.review-filters select').nth(1),
        skill: review.locator('.review-filters select').nth(2),
        mode: review.locator('.review-filters select').nth(3),
        focused: review.getByRole('button', { name: 'Start focused practice', exact: true }),
      };
      await overviewControls.lesson.scrollIntoViewIfNeeded();
      const duePositions = await positions(overviewControls);
      complete = true;
      await refresh();
      await review
        .getByRole('heading', { name: 'You’re caught up for now', exact: true })
        .waitFor();
      await unchanged(duePositions, overviewControls, `${viewport.name}: overview completed`);
      await page.screenshot({
        path: `${directory}/overview-complete-${viewport.name}.png`,
        fullPage: true,
      });
      complete = false;
      await refresh();
      await start.waitFor();
      await page.evaluate(async (saved) => {
        const { retainReviewSession } = await import(String('/src/reviewApi.ts'));
        await retainReviewSession(saved);
      }, session);
      heldSummary = new Promise<void>((resolve) => {
        releaseSummary = resolve;
      });
      await page.reload();
      const editor = review.getByRole('textbox', { name: 'Answer editor', exact: true });
      await editor.waitFor();
      await page.locator('#lesson-start').waitFor({ state: 'attached' });
      await page.evaluate(() => document.fonts.ready);
      const cachedNotice = review.getByRole('complementary', { name: 'Review status updates' });
      await cachedNotice.waitFor();
      const navigation = review.getByRole('navigation', { name: 'Review navigation' });
      const taskControls = {
        previous: navigation.locator('button').nth(0),
        next: navigation.locator('button').nth(1),
        editor,
      };
      await editor.focus();
      await editor.scrollIntoViewIfNeeded();
      // CodeMirror measures its editor and scrolls its selection on animation frames.
      await settleEditor(page);
      const cachedPositions = await positions(taskControls);
      heldSummary = undefined;
      releaseSummary!();
      await cachedNotice.waitFor({ state: 'detached' });
      await unchanged(cachedPositions, taskControls, `${viewport.name}: saved plan refreshed`);
      const refreshing = review.getByText('Refreshing review schedule…', { exact: true });
      await refreshing.waitFor({ state: 'hidden' });
      const idlePositions = await positions(taskControls);
      heldSummary = new Promise<void>((resolve) => {
        releaseSummary = resolve;
      });
      await refresh();
      await refreshing.waitFor();
      await unchanged(idlePositions, taskControls, `${viewport.name}: refresh indicator appeared`);
      heldSummary = undefined;
      releaseSummary!();
      await refreshing.waitFor({ state: 'hidden' });
      await unchanged(
        idlePositions,
        taskControls,
        `${viewport.name}: refresh indicator disappeared`,
      );
      await editor.fill('A synthetic draft retained through background updates.');
      await review
        .locator('.preview')
        .getByText('A synthetic draft retained through background updates.', { exact: true })
        .waitFor();
      await settleEditor(page);
      const uncoveredPositions = await positions(taskControls);
      covered = true;
      await refresh();
      await review
        .getByText('This review target is already covered by recent work.', { exact: false })
        .waitFor();
      await unchanged(uncoveredPositions, taskControls, `${viewport.name}: coverage arrived`);
      assert.equal(
        await editor.innerText(),
        'A synthetic draft retained through background updates.',
      );
      await page.screenshot({ path: `${directory}/covered-${viewport.name}.png`, fullPage: true });
      covered = false;
      await refresh();
      await navigation.getByRole('button', { name: 'Skip for now →', exact: true }).waitFor();
      const unansweredNavigation = await positions({
        previous: taskControls.previous,
        next: taskControls.next,
      });
      async function save(
        status: 'pending' | 'grading' | 'graded',
        item = instances[0],
        verdict: 'incorrect' | 'correct' = 'incorrect',
      ) {
        await page.evaluate(
          async ({ item, status, verdict }) => {
            const { put } = await import(String('/src/storage.ts'));
            await put('attempts', 'synthetic-layout-answer-' + item.id, {
              id: 'synthetic-layout-answer-' + item.id,
              exercise: item.exercise,
              submitted: item.context.presentedAt + 1000,
              contentVersion: item.contentVersion,
              mode: 'type',
              text: 'Synthetic submitted response.',
              images: [],
              revealed: false,
              status,
              ...(status !== 'pending'
                ? { transcription: 'Synthetic expanded response.\n\n'.repeat(12) }
                : {}),
              ...(status === 'graded' ? { verdict } : {}),
              grades:
                status === 'graded'
                  ? [
                      {
                        verdict,
                        feedback: 'Synthetic feedback.\n\n'.repeat(10),
                        at: Date.now(),
                      },
                    ]
                  : [],
              review: item.context,
            });
          },
          { item, status, verdict },
        );
      }
      await save('pending');
      const more = review.getByRole('button', { name: 'More ▾', exact: true });
      await more.waitFor();
      await navigation
        .getByRole('button', { name: 'Continue while grading →', exact: true })
        .waitFor();
      await unchanged(
        unansweredNavigation,
        { previous: taskControls.previous, next: taskControls.next },
        `${viewport.name}: submission started`,
      );
      await page.screenshot({ path: `${directory}/pending-${viewport.name}.png`, fullPage: true });
      await more.scrollIntoViewIfNeeded();
      const gradingControls = { previous: taskControls.previous, next: taskControls.next, more };
      const pendingPositions = await positions(gradingControls);
      await save('grading');
      await review.getByText('Synthetic expanded response.', { exact: false }).first().waitFor();
      await unchanged(pendingPositions, gradingControls, `${viewport.name}: transcription arrived`);
      await save('graded');
      await review.getByRole('button', { name: 'Show feedback', exact: true }).waitFor();
      await unchanged(pendingPositions, gradingControls, `${viewport.name}: grade arrived`);
      await review.getByRole('button', { name: 'Show feedback', exact: true }).click();
      await review.getByRole('button', { name: 'Hide feedback', exact: true }).waitFor();
      await unchanged(pendingPositions, gradingControls, `${viewport.name}: feedback expanded`);
      await page.screenshot({ path: `${directory}/graded-${viewport.name}.png`, fullPage: true });
      await save('graded', instances[1], 'correct');
      const beforeCompletion = await positions(gradingControls);
      await save('graded', instances[0], 'correct');
      await review.getByRole('region', { name: 'Session completion' }).waitFor();
      await unchanged(
        beforeCompletion,
        gradingControls,
        `${viewport.name}: session completion appeared`,
      );
      await page.screenshot({
        path: `${directory}/session-complete-${viewport.name}.png`,
        fullPage: true,
      });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        'No horizontal overflow',
      );
      if (viewport.name === 'desktop') {
        const exercise = review.locator('.exercise');
        const originalHeight = (await exercise.boundingBox())!.height;
        for (const size of [{ width: 390, height: 844 }, viewport]) {
          await page.setViewportSize(size);
          // Allow ResizeObserver to release the old width's retained height.
          await page.evaluate(async () => {
            for (let frame = 0; frame < 3; frame++) await new Promise(requestAnimationFrame);
          });
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            false,
            'Resizing does not overflow',
          );
        }
        assert.ok(
          Math.abs((await exercise.boundingBox())!.height - originalHeight) <= 1,
          'Returning to desktop releases the height retained at mobile width',
        );
      }
      assert.deepEqual(errors, []);
    } catch (error) {
      await page.screenshot({ path: `${directory}/failure-${viewport.name}.png`, fullPage: true });
      throw error;
    } finally {
      await context.close();
    }
  }
  console.log(
    'Review controls retain their viewport geometry through refresh, coverage, completion, grading, transcription, and feedback on desktop and mobile.',
  );
});
