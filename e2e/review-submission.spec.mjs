// Real UI + Go submission endpoint, using only a temporary synthetic notebook.
// Run after npm run web:build. Override PLAYWRIGHT_MODULE / CHROME_BIN as needed.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const screenshots = join(root, 'output/e2e/review-submission-ui');
const temporary = await mkdtemp(join(tmpdir(), 'foundations-review-submission-'));
const children = [];
let browser;
let page;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  assert.equal(result.status, 0, result.stderr || `${command} failed`);
  return result.stdout.trim();
}
async function unusedPort() {
  const listener = createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise((resolve, reject) =>
    listener.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}
function start(command, args, options) {
  const child = spawn(command, args, { stdio: 'ignore', ...options });
  children.push(child);
  return child;
}
async function ready(url, child) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    assert.equal(child.exitCode, null, 'Local test service exited before becoming ready');
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw Error('Local test service did not become ready');
}
function validEffort(attempt, label) {
  const { startedAt, activeDurationMs, submitted } = attempt;
  assert.ok(startedAt > 0 && startedAt <= submitted, `${label}: effort starts before submission`);
  assert.ok(
    activeDurationMs >= 0 && activeDurationMs <= submitted - startedAt,
    `${label}: active ${activeDurationMs}ms exceeds elapsed ${submitted - startedAt}ms`,
  );
}

try {
  await mkdir(screenshots, { recursive: true });
  const binary = join(temporary, 'foundations-api');
  run('go', ['build', '-o', binary, '.'], { cwd: join(root, 'server') });
  const password = randomBytes(24).toString('hex');
  const hash = run(binary, ['hash-password'], { input: password });
  const apiPort = await unusedPort();
  const webPort = await unusedPort();
  const apiURL = `http://127.0.0.1:${apiPort}`;
  const baseURL = `http://localhost:${webPort}`;
  const api = start(binary, [], {
    env: {
      ...process.env,
      FOUNDATIONS_DATA: join(temporary, 'data'),
      FOUNDATIONS_ADDR: `127.0.0.1:${apiPort}`,
      FOUNDATIONS_ORIGIN: baseURL,
      FOUNDATIONS_EMAIL: 'submission-test@example.test',
      FOUNDATIONS_PASSWORD_HASH: hash,
      FOUNDATIONS_CATALOG: join(root, 'output/grading-catalog.json'),
      OPENROUTER_API_KEY: 'unused-isolated-test',
      // Free responses are cancelled after acceptance; never call a real provider.
      FOUNDATIONS_GRADING_URL: apiURL + '/unused-provider',
    },
  });
  await ready(apiURL + '/api/v1/auth/session', api);
  const web = start(
    process.execPath,
    [
      join(root, 'web/node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      String(webPort),
    ],
    { cwd: join(root, 'web'), env: { ...process.env, FOUNDATIONS_API_TARGET: apiURL } },
  );
  await ready(baseURL, web);
  browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || chromium.executablePath(),
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
  });
  page = await context.newPage();
  // Session hydration and queued synchronization can exceed 20s on CI browsers.
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const login = await context.request.post(baseURL + '/api/v1/auth/login', {
    headers: { Origin: baseURL },
    data: { email: 'submission-test@example.test', password },
  });
  assert.equal(login.status(), 200, 'Temporary local account signs in');
  const review = page.locator('.review-page');
  async function focused(mode, lesson, concept, skill) {
    const overview = review.getByRole('button', { name: 'Back to overview', exact: true });
    if (await overview.isVisible()) await overview.click();
    await review.getByLabel(/^Lesson/).selectOption(lesson);
    await review.getByLabel(/^Concept/).selectOption(concept);
    await review.getByLabel(/^Skill/).selectOption(skill);
    await review.getByLabel(/^Study mode/).selectOption(mode);
    const planned = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/review/sessions') &&
        response.request().method() === 'POST',
    );
    await review.getByRole('button', { name: 'Start focused practice', exact: true }).click();
    const response = await planned;
    assert.equal(response.status(), 201);
    const session = await response.json();
    assert.ok(session.instances.length > 0);
    await review.getByRole('button', { name: 'Submit', exact: true }).waitFor();
    return session;
  }
  async function select(instance, correct = true) {
    const choice = instance.question.choice;
    const index = choice.options.findIndex(
      (option) => (option.id === choice.correctOption) === correct,
    );
    await review.getByRole('radio').nth(index).check();
  }
  async function submit(label, verdict) {
    const completed = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/attempts') && response.request().method() === 'POST',
    );
    await review.getByRole('button', { name: 'Submit', exact: true }).click();
    const response = await completed;
    const sent = response.request().postDataJSON();
    const body = await response.text();
    assert.equal(response.status(), 201, `${label}: real API rejected submission: ${body}`);
    validEffort(sent, label);
    const saved = JSON.parse(body);
    assert.equal(saved.id, sent.id);
    if (verdict) {
      assert.equal(saved.status, 'graded', `${label}: server graded the choice`);
      assert.equal(saved.verdict, verdict);
      assert.equal(saved.grades.at(-1).model, 'deterministic');
      await review
        .locator('.attempt-status strong')
        .getByText(verdict === 'correct' ? 'Correct' : 'Incorrect', { exact: true })
        .waitFor();
    } else {
      assert.ok(['pending', 'grading'].includes(saved.status), `${label}: free response accepted`);
      assert.ok(saved.activeJob);
      const cancelled = await context.request.post(
        baseURL + `/api/v1/attempts/${saved.id}/cancel`,
        {
          headers: { Origin: baseURL },
          data: { job: saved.activeJob },
        },
      );
      assert.equal(cancelled.status(), 200, `${label}: queued grading cancelled`);
    }
    const persisted = await context.request.get(baseURL + `/api/v1/attempts/${saved.id}`);
    assert.equal(persisted.status(), 200);
    assert.equal((await persisted.json()).id, sent.id, `${label}: attempt persisted on server`);
    console.log(
      `Passed ${label}: active ${sent.activeDurationMs}ms / elapsed ${sent.submitted - sent.startedAt}ms`,
    );
    return sent;
  }
  async function millisecondBoundary() {
    // Make two Date.now reads cross a millisecond boundary reliably. Real user
    // interactions still drive all application state; submission is not mocked.
    await page.evaluate(() => {
      const realNow = Date.now;
      let last = realNow();
      Date.now = () => (last = Math.max(realNow(), last + 1));
    });
  }

  await page.goto(baseURL + '/#/review/propositional-logic');
  await review.getByRole('button', { name: 'Start focused practice', exact: true }).waitFor();
  const quick = await focused('quick', 'propositional-logic', 'propositions', 'recall');
  assert.ok(quick.instances.length >= 3, 'Quick session provides next-item and retry coverage');
  await select(quick.instances[0]);
  const first = await submit('Quick choice with normal clock', 'correct');

  await review.getByRole('button', { name: 'Next →', exact: true }).click();
  await review.getByRole('radio').first().waitFor();
  await millisecondBoundary();
  await select(quick.instances[1], false);
  const incorrect = await submit('Next Quick item across clock boundary', 'incorrect');
  assert.ok(incorrect.startedAt > first.submitted, 'Next item starts a fresh effort clock');
  await review.getByRole('button', { name: 'Try again', exact: true }).click();
  await select(quick.instances[1]);
  const retry = await submit('Quick retry', 'correct');
  assert.ok(retry.startedAt > incorrect.submitted, 'Retry starts a fresh effort clock');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await review.locator('.exercise').screenshot({ path: join(screenshots, 'quick-mobile.png') });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await review.getByRole('button', { name: 'Next →', exact: true }).click();
  const strandedInstance = quick.instances[2];
  await select(strandedInstance);
  const selected = strandedInstance.question.choice.options.find(
    (option) => option.id === strandedInstance.question.choice.correctOption,
  );
  const submitted = Date.now();
  const malformed = {
    ...first,
    id: randomBytes(16).toString('hex'),
    exercise: strandedInstance.exercise,
    review: strandedInstance.context,
    contentVersion: strandedInstance.contentVersion,
    submitted,
    startedAt: submitted - 200,
    activeDurationMs: 201,
    choiceId: selected.id,
    text: selected.text,
  };
  // Reproduce the previous client's durable rejection state using an actual
  // server rejection, then reload and let ordinary startup sync recover it.
  const rejected = await context.request.post(baseURL + '/api/v1/attempts', {
    headers: { Origin: baseURL },
    data: malformed,
  });
  assert.equal(rejected.status(), 400);
  assert.equal((await rejected.text()).trim(), 'Invalid effort metadata');
  const recoveredResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/attempts') &&
      response.request().method() === 'POST' &&
      response.request().postDataJSON().id === malformed.id,
  );
  await page.evaluate(
    async ({ malformed, choice }) => {
      const { put } = await import('/src/storage.ts');
      const { gradeChoice } = await import('/src/choiceGrading.ts');
      const original = gradeChoice({ ...malformed, status: 'queued', grades: [] }, choice);
      await put('settings', 'rejected:' + original.id, {
        id: original.id,
        kind: 'attempt',
        data: original,
        error: 'Invalid effort metadata',
      });
      await put('attempts', original.id, {
        ...original,
        status: 'error',
        error: 'Invalid effort metadata',
      });
    },
    { malformed, choice: strandedInstance.question.choice },
  );
  await page.reload();
  const recovered = await recoveredResponse;
  assert.equal(recovered.status(), 201, 'Previously rejected choice is accepted after reload');
  const saved = await recovered.json();
  assert.equal(saved.id, malformed.id);
  assert.equal(saved.text, malformed.text);
  assert.equal(saved.choiceId, malformed.choiceId);
  assert.equal(saved.submitted, malformed.submitted);
  assert.equal(saved.startedAt, malformed.startedAt);
  assert.deepEqual(saved.assistance, malformed.assistance);
  assert.equal(saved.activeDurationMs, 200);
  assert.equal(saved.status, 'graded');
  assert.equal(saved.verdict, 'correct');
  const retained = await page.evaluate(async (id) => {
    const { get } = await import('/src/storage.ts');
    return get('settings', 'rejected:' + id);
  }, malformed.id);
  assert.equal(retained.data.activeDurationMs, 201, 'Original rejected effort remains retained');
  assert.equal(retained.data.text, malformed.text);
  console.log(
    'Passed automatic recovery of rejected correct choice without resubmitting the answer',
  );

  // These targets are explicitly open reasoning families. Construct/transform
  // targets also include structured responses and cannot guarantee this editor.
  const typedSession = await focused(
    'regular',
    'predicates-and-quantifiers',
    'quantifier-order',
    'counterexample',
  );
  assert.ok(
    typedSession.instances.every((i) => !i.question.assessment && !i.question.choice),
    'The typed-response family remains free response',
  );
  const editor = review.getByRole('textbox', { name: 'Answer editor', exact: true });
  await editor.fill('For each integer x, choose y = -x.');
  const typed = await submit('Typed Regular response', undefined);
  assert.equal(typed.mode, 'type');

  const draftSession = await focused(
    'regular',
    'predicates-and-quantifiers',
    'uniqueness',
    'prove',
  );
  assert.ok(
    draftSession.instances.every((i) => !i.question.assessment && !i.question.choice),
    'The draft-restoration family remains free response',
  );
  await editor.fill('There exists an x for which P(x) is false.');
  // A real blur pauses and saves the draft before navigating away.
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.waitForTimeout(100);
  await page.reload();
  await editor.waitFor();
  assert.equal(await editor.innerText(), 'There exists an x for which P(x) is false.');
  await millisecondBoundary();
  const restored = await submit('Reloaded Regular draft', undefined);
  assert.equal(restored.text, 'There exists an x for which P(x) is false.');
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(
    'Review submission UI passed: actual API grading, next-item timing, retry, rejected-attempt recovery, typed response, and restored draft.',
  );
} catch (error) {
  if (page) await page.screenshot({ path: join(screenshots, 'failure.png') }).catch(() => {});
  throw error;
} finally {
  if (browser) await browser.close();
  for (const child of children.reverse()) {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill('SIGTERM');
      await exited;
    }
  }
  await rm(temporary, { recursive: true, force: true });
}
