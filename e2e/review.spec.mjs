// Synthetic notebook only: every API request is intercepted before navigation.
// Run after npm run web:build: npm run test:e2e -- review
// Override PLAYWRIGHT_MODULE / CHROME_BIN when using another local runtime.
import assert from 'node:assert/strict';
import { withBrowser } from './support/browser.ts';

await withBrowser('review', async ({ page, baseURL, directory }) => {
  // Allow slower CI browsers to hydrate each new session and finish synchronization.
  page.setDefaultTimeout(60000);
  const review = page.locator('.review-page');
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const now = Date.now();
  const day = 86400000;
  const concepts = [
    { id: 'quantifier-order', name: 'Quantifier order' },
    { id: 'existential-quantification', name: 'Existential quantification' },
    { id: 'set-inclusion', name: 'Set inclusion' },
  ];
  const skills = [
    { id: 'recall', name: 'Recall' },
    { id: 'construct', name: 'Construct' },
    { id: 'prove', name: 'Prove' },
  ];
  const lessons = [
    { slug: 'propositional-logic', title: 'Propositional Logic' },
    { slug: 'sets', title: 'Sets' },
  ];
  const targets = [
    {
      id: 'definition',
      concept: 'existential-quantification',
      skill: 'recall',
      objective: 'witness-definition',
      dueAt: now - day,
      intervalDays: 6,
      lastReviewedAt: now - 7 * day,
      activatedAt: now - 14 * day,
      reason: 'A clean first response scheduled a recall check after six days.',
      evidenceLevel: 'recognition',
      quick: true,
    },
    {
      id: 'construction',
      concept: 'quantifier-order',
      skill: 'construct',
      dueAt: now - day,
      intervalDays: 2,
      lastReviewedAt: now - 3 * day,
      activatedAt: now - 14 * day,
      reason: 'An earlier substantive error calls for another construction attempt.',
      evidenceLevel: 'production',
      quick: false,
    },
    {
      id: 'proof',
      concept: 'set-inclusion',
      skill: 'prove',
      dueAt: now - 2 * day,
      intervalDays: 6,
      lastReviewedAt: now - 8 * day,
      activatedAt: now - 14 * day,
      reason: 'Your previous unassisted proof is ready for delayed retrieval.',
      evidenceLevel: 'reasoning',
      quick: false,
    },
  ];
  let quickCompleted = false;
  let apiOffline = false;
  let serial = 0;
  const submissions = [];
  const plans = [];
  const records = [];
  const instances = new Map();
  const deepDueDates = targets.filter((t) => !t.quick).map((t) => t.dueAt);
  function summary() {
    return {
      budgetMinutes: 25,
      estimatedMinutes: quickCompleted ? 0 : 11,
      remainingMinutes: quickCompleted ? 0 : 25,
      reservedMinutes: quickCompleted ? 25 : 0,
      plannedQuick: quickCompleted ? 0 : 1,
      plannedApplication: 0,
      plannedDeep: quickCompleted ? 0 : 1,
      due: quickCompleted ? 2 : 3,
      quick: quickCompleted ? 0 : 1,
      deeper: 2,
      targets,
      concepts,
      skills,
      lessons,
    };
  }
  function instance(request) {
    const quick = request.mode === 'quick';
    const target = quick ? targets[0] : targets[2];
    const id = 'synthetic-instance-' + ++serial;
    const issued = {
      id,
      exercise: 'review-' + id,
      lesson: quick ? 'propositional-logic' : 'sets',
      contentVersion: 'synthetic-fixture',
      analytics: {
        version: 'synthetic-evidence',
        provenance: 'submission',
        concepts: [{ concept: target.concept, role: 'primary' }],
        skills: [{ skill: target.skill, role: 'primary' }],
        representations: [],
        conceptDefinitions: [],
        skillDefinitions: [],
        representationDefinitions: [],
      },
      question: quick
        ? {
            id: 900001,
            instructions: 'Recall the terminology.',
            prompt: 'What do we call a value demonstrating that an existential statement is true?',
            section: 'review',
            answer: 'Such a value is a witness.',
            choice: {
              correctOption: 'witness',
              options: [
                {
                  id: 'witness',
                  text: 'A witness',
                  feedback: 'A witness satisfies the existential condition.',
                },
                {
                  id: 'counterexample',
                  text: 'A counterexample',
                  feedback: 'A counterexample refutes a universal claim.',
                },
                {
                  id: 'domain',
                  text: 'A domain',
                  feedback: 'The domain contains the permitted values.',
                },
              ],
            },
          }
        : {
            id: 900002,
            instructions: 'Give a proof using an arbitrary element.',
            prompt: 'Prove that if $A \\subseteq B$ and $B \\subseteq C$, then $A \\subseteq C$.',
            section: 'review',
            answer:
              'If $x \\in A$, the first inclusion gives $x \\in B$, and the second gives $x \\in C$.',
          },
      context: {
        instanceId: id,
        kind: request.kind,
        templateId: quick ? 'witness-definition-variants' : 'set-inclusion-proof',
        concept: target.concept,
        skill: target.skill,
        ...(target.objective ? { objective: target.objective } : {}),
        scheduledFor: target.dueAt,
        presentedAt: now,
        previousReviewAt: target.lastReviewedAt,
        intervalDays: target.intervalDays,
        seed: 'synthetic-42',
        parameters: { variant: 0 },
      },
    };
    instances.set(id, issued);
    return issued;
  }
  await page.route('**/api/**', async (route) => {
    if (apiOffline) return route.abort('internetdisconnected');
    const request = route.request();
    const path = new URL(request.url()).pathname;
    let body;
    if (path.endsWith('/auth/session'))
      body = { email: 'synthetic-review@example.test', expires: now + day };
    else if (path.endsWith('/review/sessions')) {
      const plan = request.postDataJSON();
      plans.push(plan);
      body = {
        id: 'synthetic-session-' + (serial + 1),
        kind: plan.kind,
        mode: plan.mode,
        instances: [instance(plan)],
      };
    } else if (path.endsWith('/review')) body = summary();
    else if (path.endsWith('/attempts') && request.method() === 'POST') {
      const attempt = request.postDataJSON();
      submissions.push(attempt);
      if (attempt.review.kind === 'scheduled-review' && attempt.mode === 'choice')
        quickCompleted = true;
      body = {
        ...attempt,
        presentation: { question: instances.get(attempt.review.instanceId).question },
        analytics: instances.get(attempt.review.instanceId).analytics,
        status: 'graded',
        verdict: 'correct',
        grades: [
          {
            verdict: 'correct',
            feedback: 'Correct. This response demonstrates the requested knowledge.',
            at: Date.now(),
          },
        ],
      };
      records.push({
        key: 'attempt/' + attempt.id,
        revision: records.length + 1,
        id: 'saved-' + attempt.id,
        payload: body,
        device: 'server',
        updated: Date.now(),
        versions: [],
        conflicts: [],
      });
    } else if (path.endsWith('/status'))
      body = { attempts: records.map((r) => ({ key: r.key, revision: r.revision })) };
    else if (path.endsWith('/mutations'))
      body = {
        ...request.postDataJSON(),
        revision: 1,
        versions: [],
        conflicts: [],
        updated: Date.now(),
      };
    else body = { records, cursor: records.length, more: false, attempts: [] };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  async function screenshot(name) {
    await page.locator('#reader').evaluate((element) => {
      element.scrollTop = 0;
    });
    await page.screenshot({ path: directory + '/' + name + '.png' });
    console.log('Captured ' + name);
  }
  async function overview() {
    await review.getByRole('button', { name: 'Back to overview', exact: true }).click();
    await review.getByRole('button', { name: 'Start Regular review', exact: true }).waitFor();
  }
  async function waitForAttemptUpload(id) {
    await page.waitForFunction(async (id) => {
      const storage = await import('/src/storage.ts');
      const confirmed = await storage.get('records', 'attempt/' + id);
      return (
        confirmed?.revision > 0 &&
        confirmed.payload.id === id &&
        !(await storage.all('outbox')).some((operation) => operation.kind === 'attempt')
      );
    }, id);
  }
  try {
    await page.goto(baseURL + '/#/review/propositional-logic');
    await review.getByRole('button', { name: 'Start Quick review', exact: true }).waitFor();
    await screenshot('landing');
    await review.getByRole('button', { name: 'Start Regular review', exact: true }).click();
    await review.getByLabel('Response format').waitFor();
    await review.getByText('Why am I seeing this?', { exact: true }).click();
    await screenshot('regular');
    await review.getByLabel('Response format').selectOption('pen');
    assert.ok(await review.locator('canvas').count(), 'Existing pen input remains available');
    await review.getByLabel('Response format').selectOption('photo');
    assert.ok(
      await review.locator('input[type=file]').count(),
      'Existing photo input remains available',
    );
    await overview();
    await review.getByRole('button', { name: 'Start Quick review', exact: true }).click();
    await review.getByRole('radiogroup', { name: 'Answer choices' }).waitFor();
    await screenshot('quick');
    await review.getByRole('radio', { name: 'A witness', exact: true }).check();
    const uploaded = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname.endsWith('/attempts') &&
        response.request().method() === 'POST' &&
        response.ok(),
    );
    await review.getByRole('button', { name: 'Submit', exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector('.attempt-status strong')?.textContent === 'Correct',
    );
    // A local Correct verdict precedes synchronization; wait for its acknowledgement
    // and durable queue removal instead of assuming the network finishes in 300ms.
    const acknowledged = await uploaded;
    await waitForAttemptUpload(acknowledged.request().postDataJSON().id);
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0].review.kind, 'scheduled-review');
    assert.equal(submissions[0].review.templateId, 'witness-definition-variants');
    assert.equal(submissions[0].review.seed, 'synthetic-42');
    assert.deepEqual(submissions[0].review.parameters, { variant: 0 });
    assert.equal(submissions[0].exercise, 'review-' + submissions[0].review.instanceId);
    assert.equal(
      submissions[0].analytics,
      undefined,
      'Server retains authority over evidence snapshots',
    );
    await review.getByRole('button', { name: 'Next →', exact: true }).click();
    await page
      .getByText('You can stop here for today. Other work can wait for a later session.', {
        exact: true,
      })
      .waitFor();
    assert.deepEqual(
      targets.filter((t) => !t.quick).map((t) => t.dueAt),
      deepDueDates,
    );
    await screenshot('deferred');
    await review.getByRole('button', { name: 'Return to overview', exact: true }).click();
    await review.getByLabel('Lesson', { exact: false }).selectOption('propositional-logic');
    await review.getByLabel('Concept', { exact: false }).selectOption('existential-quantification');
    await review.getByLabel('Skill', { exact: false }).selectOption('recall');
    await review.getByLabel('Study mode', { exact: false }).selectOption('quick');
    await screenshot('practice');
    await review.getByRole('button', { name: 'Start focused practice', exact: true }).click();
    await review.getByRole('radiogroup', { name: 'Answer choices' }).waitFor();
    assert.deepEqual(plans.at(-1), {
      kind: 'focused-practice',
      mode: 'quick',
      budgetMinutes: 25,
      lesson: 'propositional-logic',
      concept: 'existential-quantification',
      skill: 'recall',
    });
    // API-unavailable reload checks cached session/summary and queued review context.
    // Assets remain online: this does not claim to test production service-worker caching.
    apiOffline = true;
    await page.reload();
    await review.getByText('Saved review plan', { exact: false }).waitFor();
    await review.getByRole('radio', { name: 'A witness', exact: true }).check();
    await review.getByRole('button', { name: 'Submit', exact: true }).click();
    const queued = await page.waitForFunction(async () => {
      const storage = await import('/src/storage.ts');
      return (await storage.all('outbox')).find(
        (op) => op.kind === 'attempt' && op.data.review?.kind === 'focused-practice',
      );
    });
    const { id: queuedID } = await queued.jsonValue();
    assert.equal(submissions.length, 1, 'Offline response was retained locally');
    // sync() can return while a background sync is already busy. Observe this
    // exact request's acknowledgment and confirmed record, not just queue size.
    const reconnected = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname.endsWith('/attempts') &&
        response.request().method() === 'POST' &&
        response.request().postDataJSON().id === queuedID &&
        response.ok(),
    );
    apiOffline = false;
    await page.evaluate(async () => {
      const sync = await import('/src/sync.ts');
      await sync.sync();
    });
    await reconnected;
    await waitForAttemptUpload(queuedID);
    assert.equal(submissions.length, 2);
    assert.equal(submissions[1].id, queuedID, 'Reconnect uploads the retained attempt');
    assert.equal(submissions[1].review.kind, 'focused-practice');
    await overview();
    await page.setViewportSize({ width: 390, height: 844 });
    await screenshot('mobile');
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
      false,
      'No 390px viewport overflow',
    );
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    console.log(
      'Review UI: six screenshots; Regular inputs, Quick submission/context, deferred deep work, focused filters, cached API-offline session and queued sync, and mobile overflow passed.',
    );
  } catch (error) {
    console.error(await review.innerText());
    throw error;
  }
});
