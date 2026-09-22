// Synthetic issued session only; all API traffic is intercepted.
import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('review-session-progress', async ({ page, baseURL, directory }) => {
  const now = Date.now() - 10000;
  const day = 86400000;
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const review = page.locator('.review-page');
  const instances = ['justify', 'recall', 'transform', 'construct'].map((skill, index) => {
    const id = 'synthetic-' + skill;
    return {
      id,
      exercise: 'review-' + id,
      lesson: 'propositional-logic',
      contentVersion: 'synthetic-session-progress',
      question: {
        id: 910000 + index,
        instructions: 'Synthetic ' + skill + ' review task.',
        prompt: 'Show your work for task ' + (index + 1) + '.',
        section: 'review',
      },
      context: {
        instanceId: id,
        kind: 'scheduled-review',
        templateId: 'synthetic-' + skill,
        concept: 'distribution',
        skill,
        objective: 'factor',
        scheduledFor: now - day,
        presentedAt: now,
        intervalDays: 1,
      },
    };
  });
  const session = {
    id: 'synthetic-existing-session',
    kind: 'scheduled-review',
    mode: 'regular',
    instances,
  };
  let covered = false;
  let offline = false;
  let heldReview;
  let submissions = 0;
  function summary() {
    return {
      due: covered ? 2 : 3,
      quick: 0,
      deeper: covered ? 2 : 3,
      targets: instances.map(({ context }) => ({
        id: context.skill,
        concept: context.concept,
        skill: context.skill,
        objective: context.objective,
        dueAt: covered && context.skill === 'transform' ? now + day : now - day,
        lastEvidenceAt: covered && context.skill === 'transform' ? now + 5000 : now - day,
        activatedAt: now - 2 * day,
        intervalDays: 1,
        evidenceLevel: 'production',
        quick: false,
        reason: 'Synthetic server review state.',
      })),
      concepts: [{ id: 'distribution', name: 'Distribution and factoring' }],
      skills: instances.map(({ context }) => ({ id: context.skill, name: context.skill })),
      lessons: [{ slug: 'propositional-logic', title: 'Propositional Logic' }],
    };
  }
  await page.route('**/api/**', async (route) => {
    if (offline) return route.abort('internetdisconnected');
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let body;
    if (path.endsWith('/auth/session'))
      body = { email: 'synthetic-progress@example.test', expires: now + day };
    else if (path.endsWith('/review')) {
      if (heldReview) await heldReview;
      body = summary();
    } else if (path.endsWith('/attempts') && request.method() === 'POST') {
      submissions++;
      throw Error('Skipping a covered task must not fabricate a submission');
    } else if (path.endsWith('/status')) body = { attempts: [] };
    else if (path.endsWith('/mutations'))
      body = { ...request.postDataJSON(), revision: 1, versions: [], conflicts: [], updated: now };
    else body = { records: [], cursor: 0, more: false, attempts: [] };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  async function markAnswered(instance) {
    await page.evaluate(async (item) => {
      const storage = await import('/src/storage.ts');
      await storage.put('attempts', 'answered-' + item.id, {
        id: 'answered-' + item.id,
        exercise: item.exercise,
        submitted: item.context.presentedAt + 1000,
        contentVersion: item.contentVersion,
        mode: 'type',
        text: 'Previously completed synthetic response.',
        images: [],
        revealed: false,
        status: 'graded',
        verdict: 'correct',
        grades: [
          { verdict: 'correct', feedback: 'Synthetic grade.', at: item.context.presentedAt + 1000 },
        ],
        review: item.context,
      });
    }, instance);
  }
  async function atTask(number) {
    await review.getByText('Regular · ' + number + ' of 4', { exact: true }).waitFor();
  }
  async function savedState() {
    return page.evaluate(async () => {
      const storage = await import('/src/storage.ts');
      const { cachedReviewSession } = await import('/src/reviewApi.ts');
      return {
        session: await cachedReviewSession(),
        draft: await storage.get('drafts', 'review-synthetic-transform'),
        attempts: await storage.all('attempts'),
      };
    });
  }

  await page.goto(baseURL + '/#/review/propositional-logic');
  await review.getByRole('button', { name: 'Start review', exact: true }).waitFor();
  await page.evaluate(async (saved) => {
    const { retainReviewSession } = await import('/src/reviewApi.ts');
    await retainReviewSession(saved);
  }, session);
  await markAnswered(instances[0]);
  let releaseReview;
  heldReview = new Promise((resolve) => {
    releaseReview = resolve;
  });
  await page.reload();
  await atTask(2);
  await review.getByText('Showing review status', { exact: false }).waitFor();
  assert.ok(heldReview, 'Saved work renders while the online summary request is still pending');
  heldReview = undefined;
  releaseReview();
  await review.getByRole('button', { name: 'Skip for now →', exact: true }).click();
  await atTask(3);
  const editor = review.getByRole('textbox', { name: 'Answer editor', exact: true });
  const draft = 'My existing draft must survive the server update.';
  await editor.fill(draft);
  await page.waitForFunction(async (text) => {
    const storage = await import('/src/storage.ts');
    return (await storage.get('drafts', 'review-synthetic-transform'))?.text === text;
  }, draft);

  // A server acknowledgement can retain an already-correct local verdict.
  // Sync writes the newly server-stamped grade to the same attempt; that change
  // must refresh the summary even without navigation or an online event.
  covered = true;
  await page.evaluate(async (item) => {
    const storage = await import('/src/storage.ts');
    const saved = await storage.get('attempts', 'answered-' + item.id);
    await storage.put('attempts', saved.id, {
      ...saved,
      grades: saved.grades.map((grade) => ({ ...grade, at: item.context.presentedAt + 5000 })),
    });
  }, instances[0]);
  const notice = review.getByText('This review target is already covered by recent work.', {
    exact: false,
  });
  await notice.waitFor();
  assert.equal(await editor.innerText(), draft, 'A summary refresh preserves the visible editor');
  await page.screenshot({ path: directory + '/covered-draft-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: directory + '/covered-draft-mobile.png', fullPage: true });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await review.getByRole('button', { name: 'Next →', exact: true }).click();
  await atTask(4);
  await review.getByRole('button', { name: '← Previous', exact: true }).click();
  await atTask(3);
  assert.equal(
    await editor.innerText(),
    draft,
    'Previous keeps the covered task and draft accessible',
  );
  await review.getByRole('button', { name: '← Previous', exact: true }).click();
  await atTask(2);
  await review.getByRole('button', { name: 'Skip for now →', exact: true }).click();
  await atTask(4);

  await markAnswered(instances[1]);
  await page.reload();
  await atTask(4);
  offline = true;
  await page.reload();
  await atTask(4);
  await review.getByText('Showing review status', { exact: false }).waitFor();
  assert.equal(
    (await savedState()).draft.text,
    draft,
    'Offline resume preserves the skipped draft',
  );
  offline = false;
  await review.getByRole('button', { name: 'Skip for now →', exact: true }).click();
  await review.getByRole('button', { name: 'Revisit questions', exact: true }).click();
  await atTask(1);
  await review.getByText('Previously completed synthetic response.', { exact: true }).waitFor();
  const retained = await savedState();
  assert.deepEqual(
    retained.session,
    session,
    'All originally issued session records remain intact',
  );
  assert.equal(retained.attempts.length, 2, 'Coverage does not create or remove attempts');
  assert.equal(submissions, 0);

  // An explicit focused-practice request is unaffected by due-state coverage.
  const focused = {
    ...session,
    kind: 'focused-practice',
    instances: instances.map((item) => ({
      ...item,
      context: { ...item.context, kind: 'focused-practice' },
    })),
  };
  await page.evaluate(async (saved) => {
    const { retainReviewSession } = await import('/src/reviewApi.ts');
    await retainReviewSession(saved);
  }, focused);
  await page.reload();
  await atTask(3);
  await review.getByRole('heading', { name: 'Focused Practice', exact: true }).waitFor();
  assert.equal(await notice.count(), 0);
  assert.equal(await editor.innerText(), draft);
  await review.getByRole('button', { name: 'Skip for now →', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Issued-session coverage: live notice, draft retention, forward/resume/offline skipping, revisit history, focused-practice exemption, desktop/mobile screenshots passed.',
  );
});
