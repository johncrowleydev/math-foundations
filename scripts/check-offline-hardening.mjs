// Production PWA + real Go API, with failure injection against an isolated notebook.
// Run after npm run web:build: node scripts/check-offline-hardening.mjs
// Override PLAYWRIGHT_MODULE / CHROME_BIN for your local browser runtime.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const screenshots = join(root, 'output/offline-hardening');
const temporary = await mkdtemp(join(tmpdir(), 'foundations-offline-hardening-'));
const children = [];
let browser;

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
  const apiEnv = {
    ...process.env,
    FOUNDATIONS_DATA: join(temporary, 'data'),
    FOUNDATIONS_ADDR: `127.0.0.1:${apiPort}`,
    FOUNDATIONS_ORIGIN: baseURL,
    FOUNDATIONS_EMAIL: 'offline-test@example.test',
    FOUNDATIONS_PASSWORD_HASH: hash,
    FOUNDATIONS_CATALOG: join(root, 'output/grading-catalog.json'),
    OPENROUTER_API_KEY: 'unused-isolated-test',
    FOUNDATIONS_GRADING_URL: apiURL + '/unused-provider',
  };
  const api = start(binary, [], { env: apiEnv });
  await ready(apiURL + '/api/v1/auth/session', api);
  const web = start(
    process.execPath,
    [
      join(root, 'web/node_modules/vite/bin/vite.js'),
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(webPort),
    ],
    {
      cwd: join(root, 'web'),
      env: { ...process.env, FOUNDATIONS_API_TARGET: apiURL },
    },
  );
  await ready(baseURL, web);
  browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'allow',
  });
  let page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const login = await context.request.post(baseURL + '/api/v1/auth/login', {
    headers: { Origin: baseURL },
    data: { email: 'offline-test@example.test', password },
  });
  assert.equal(login.status(), 200, 'Temporary local account signs in');
  const readStore = (store) =>
    page.evaluate(
      (store) =>
        new Promise((resolve, reject) => {
          const request = indexedDB.open('foundations-web');
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const rows = db.transaction(store).objectStore(store).getAll();
            rows.onsuccess = () => {
              db.close();
              resolve(rows.result);
            };
            rows.onerror = () => {
              db.close();
              reject(rows.error);
            };
          };
        }),
      store,
    );
  const waitFor = async (check, message) => {
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (await check()) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.fail(message);
  };
  const exercise = () => page.locator('article.exercise:visible');
  const open = async (slug, id) => {
    await page.goto(`${baseURL}/#/practice/${slug}/${id}`);
    await exercise().locator('.structured-answer').waitFor();
  };
  const fillMatrix = async (entry = '6') => {
    for (const [label, value] of [
      ['Number of rows', '2'],
      ['Number of columns', '3'],
      ['Requested matrix entry', entry],
      ['Rows of the transpose', '1,4;2,5;3,6'],
    ])
      await exercise()
        .getByRole('textbox', { name: label + ' editor', exact: true })
        .fill(value);
  };
  const submit = async (verdict) => {
    await exercise().getByRole('button', { name: 'Submit', exact: true }).click();
    await exercise().getByText(verdict, { exact: true }).waitFor();
  };
  const serverAttempts = async () => {
    const response = await context.request.get(baseURL + '/api/v1/attempts');
    assert.equal(response.status(), 200);
    return (await response.json()).records.map((record) => record.payload);
  };
  await open('linear-algebra-matrices', 1);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await exercise().locator('.structured-answer').waitFor();
  await waitFor(async () => (await readStore('outbox')).length === 0, 'Initial sync settles');

  // A syntactically valid but malformed acknowledgement must never erase the
  // only durable copy of an answer. No request reaches the API in this phase.
  let malformedReplies = 0;
  await context.route('**/api/v1/attempts', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    malformedReplies++;
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
  });
  await fillMatrix();
  await submit('Correct');
  await waitFor(async () => malformedReplies > 0, 'Malformed acknowledgement was exercised');
  await page.waitForTimeout(300);
  const retained = (await readStore('attempts')).find(
    (a) => a.exercise === 'linear-algebra-matrices-1',
  );
  assert.ok(retained?.id, 'Malformed acknowledgement preserves the original attempt');
  assert.equal(
    (await readStore('outbox')).filter((op) => op.id === retained.id).length,
    1,
    'Malformed acknowledgement keeps the submission queued',
  );
  assert.equal(
    (await serverAttempts()).length,
    0,
    'The rejected acknowledgement did not persist remotely',
  );
  await page.reload();
  await exercise().getByText('Correct', { exact: true }).waitFor();
  assert.equal(
    (await readStore('attempts'))[0].id,
    retained.id,
    'Reload preserves the same attempt ID',
  );
  await context.unroute('**/api/v1/attempts');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitFor(
    async () => (await readStore('outbox')).length === 0,
    'Valid acknowledgement drains queue',
  );
  assert.equal((await serverAttempts()).filter((a) => a.id === retained.id).length, 1);
  console.log('Passed malformed acknowledgement, reload before sync, and idempotent reconnect');

  // Wrong answer and retry remain distinct, ordered immutable observations.
  await open('functions', 1);
  await context.setOffline(true);
  await exercise().getByRole('radio').first().check();
  await submit('Incorrect');
  await exercise().getByRole('button', { name: 'Try again', exact: true }).click();
  await exercise().getByRole('radio').last().check();
  await submit('Correct');
  await open('functions', 7);
  await exercise().getByRole('radio').first().check();
  await exercise().locator('.scratchwork summary').click();
  await exercise()
    .getByRole('textbox', { name: 'Scratchwork editor', exact: true })
    .fill('Unsynced scratchwork stays local across offline reopen.');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await waitFor(
    async () => (await readStore('drafts')).some((d) => d.text.includes('Unsynced scratchwork')),
    'Draft is durable before closing',
  );
  const beforeClose = await readStore('attempts');
  const offlineQueue = (await readStore('outbox')).filter((op) => op.kind === 'attempt');
  assert.equal(offlineQueue.length, 2);
  await page.close();
  page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', (error) => errors.push(error.message));
  await open('functions', 7);
  await exercise().locator('.scratchwork summary').click();
  assert.match(
    await exercise().getByRole('textbox', { name: 'Scratchwork editor', exact: true }).innerText(),
    /Unsynced scratchwork/,
  );
  assert.deepEqual(
    await readStore('attempts'),
    beforeClose,
    'Offline close/reopen retains all attempts',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: join(screenshots, 'offline-phone.png') });
  await page.goto(baseURL + '/#/practice/functions/1');
  await exercise().getByText('Correct', { exact: true }).waitFor();
  await page.goBack();
  await exercise().locator('.structured-answer').waitFor();
  await page.goForward();
  await exercise().getByText('Correct', { exact: true }).waitFor();
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitFor(async () => (await readStore('outbox')).length === 0, 'Offline retries upload');
  const functionAttempts = (await serverAttempts())
    .filter((a) => a.exercise === 'functions-1')
    .sort((a, b) => a.submitted - b.submitted);
  assert.deepEqual(
    functionAttempts.map((a) => a.verdict),
    ['incorrect', 'correct'],
  );
  assert.equal(new Set(functionAttempts.map((a) => a.id)).size, 2);
  console.log(
    'Passed offline retries, queued synchronization, close/reopen, scratchwork, history navigation, phone viewport',
  );

  // Lose the HTTP response after the server has committed, then submit the same
  // durable ID again. This reproduces a transport interruption, not a new attempt.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open('functions', 8);
  let interrupted;
  await context.route('**/api/v1/attempts', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    if (!interrupted) {
      const response = await route.fetch();
      assert.equal(response.status(), 201);
      interrupted = await response.json();
      return route.abort('connectionreset');
    }
    return route.continue();
  });
  await exercise().getByRole('radio').first().check();
  const button = exercise().getByRole('button', { name: 'Submit', exact: true });
  await button.evaluate((button) => {
    for (let i = 0; i < 8; i++) button.click();
  });
  await waitFor(async () => !!interrupted, 'Server committed before transport interruption');
  await context.unroute('**/api/v1/attempts');
  await page.reload();
  await waitFor(
    async () => (await readStore('outbox')).length === 0,
    'Interrupted response recovers',
  );
  assert.equal(
    (await serverAttempts()).filter((a) => a.exercise === 'functions-8').length,
    1,
    'Rapid submissions and interrupted acknowledgement create one attempt',
  );
  const confirmed = await serverAttempts();
  await exercise()
    .getByText(interrupted.verdict === 'correct' ? 'Correct' : 'Incorrect', { exact: true })
    .waitFor();
  await page.screenshot({ path: join(screenshots, 'single-submission-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(screenshots, 'single-submission-phone.png') });
  console.log('Passed interrupted response, repeat upload and rapid submissions');

  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export local work', exact: true }).click();
  const backup = await download;
  const backupPath = join(temporary, 'backup.json');
  await backup.saveAs(backupPath);
  await page.getByLabel('Import local work').setInputFiles(backupPath);
  await page
    .getByRole('status')
    .filter({ hasText: /^Imported/ })
    .waitFor();
  await waitFor(
    async () => (await readStore('outbox')).length === 0,
    'Imported backup synchronizes',
  );
  assert.deepEqual(
    await serverAttempts(),
    confirmed,
    'Import cannot rewrite confirmed server history',
  );
  assert.equal(
    (await readStore('attempts')).length,
    confirmed.length,
    'Backup restore adds no duplicates',
  );
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto(baseURL + '/#/review/propositional-logic');
  const review = page.locator('.review-page');
  await review.getByLabel(/^Lesson/).selectOption('propositional-logic');
  await review.getByLabel(/^Concept/).selectOption('propositions');
  await review.getByLabel(/^Skill/).selectOption('recall');
  await review.getByLabel(/^Study mode/).selectOption('quick');
  const planned = page.waitForResponse(
    (r) => r.url().endsWith('/review/sessions') && r.request().method() === 'POST',
  );
  await review.getByRole('button', { name: 'Start focused practice', exact: true }).click();
  const issued = await (await planned).json();
  const frozen = issued.instances[0];
  assert.ok(frozen.question.choice, 'The selected quick family is a choice');
  await review.getByRole('radio').first().waitFor();
  await waitFor(
    async () => (await readStore('records')).some((r) => r.key === 'review-instance/' + frozen.id),
    'Issued frozen definition is durable',
  );
  await context.setOffline(true);

  // Upgrade only the isolated server catalog, removing the issued dedicated
  // definitions. The cached client must continue to use its issued snapshot.
  const upgraded = JSON.parse(await readFile(apiEnv.FOUNDATIONS_CATALOG, 'utf8'));
  upgraded.version = 'offline-audit-next-content-version';
  upgraded.reviewTemplates = [];
  const catalogPath = join(temporary, 'next-catalog.json');
  await writeFile(catalogPath, JSON.stringify(upgraded));
  const stopped = once(api, 'exit');
  api.kill('SIGTERM');
  await stopped;
  const replacement = start(binary, [], { env: { ...apiEnv, FOUNDATIONS_CATALOG: catalogPath } });
  await ready(apiURL + '/api/v1/auth/session', replacement);
  await page.reload();
  await review.getByRole('radio').first().waitFor();
  const correctIndex = frozen.question.choice.options.findIndex(
    (o) => o.id === frozen.question.choice.correctOption,
  );
  await review.getByRole('radio').nth(correctIndex).check();
  await review.getByRole('button', { name: 'Submit', exact: true }).click();
  await review.getByText('Correct', { exact: true }).waitFor();
  const queuedReview = (await readStore('attempts')).find((a) => a.exercise === frozen.exercise);
  assert.ok(queuedReview.review && queuedReview.presentation);
  assert.deepEqual(queuedReview.analytics, frozen.analytics);
  const incompleteReview = structuredClone(queuedReview);
  delete incompleteReview.review;
  delete incompleteReview.presentation;
  delete incompleteReview.analytics;
  delete incompleteReview.startedAt;
  delete incompleteReview.activeDurationMs;
  delete incompleteReview.assistance;
  delete incompleteReview.unsure;
  let truncatedReplies = 0;
  await context.route('**/api/v1/attempts', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    truncatedReplies++;
    await route.fulfill({ status: 201, json: incompleteReview });
  });
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitFor(
    async () => truncatedReplies > 0,
    'Well-shaped truncated Review reply was exercised',
  );
  await page.reload();
  await waitFor(async () => truncatedReplies > 1, 'Reload retries the retained Review submission');
  assert.deepEqual(
    (await readStore('attempts')).find((a) => a.id === queuedReview.id),
    queuedReview,
  );
  assert.equal((await readStore('outbox')).filter((op) => op.id === queuedReview.id).length, 1);
  assert.equal((await serverAttempts()).filter((a) => a.id === queuedReview.id).length, 0);
  await context.unroute('**/api/v1/attempts');
  console.log(
    'Passed well-shaped truncated Review acknowledgement: original context and queue survive reload',
  );
  let delayed;
  await context.route('**/api/v1/attempts', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const response = await route.fetch();
    delayed = await response.json();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ response });
  });
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitFor(async () => !!delayed, 'Upgraded server graded frozen Review');
  assert.equal(
    (await readStore('outbox')).filter((op) => op.id === delayed.id).length,
    1,
    'Delayed acknowledgement leaves the durable submission queued',
  );
  await waitFor(
    async () => (await readStore('outbox')).length === 0,
    'Delayed Review reply drains queue',
  );
  await context.unroute('**/api/v1/attempts');
  assert.equal(delayed.contentVersion, frozen.contentVersion);
  assert.equal(delayed.verdict, 'correct');
  assert.equal(delayed.presentation.question.prompt, frozen.question.prompt);
  assert.equal((await serverAttempts()).filter((a) => a.id === delayed.id).length, 1);
  const priorById = new Map(confirmed.map((a) => [a.id, a]));
  for (const a of await serverAttempts())
    if (priorById.has(a.id)) assert.deepEqual(a, priorById.get(a.id));
  const schedule = await (await context.request.get(baseURL + '/api/v1/review')).json();
  await page.reload();
  // Session restoration resumes at its first unanswered item. Navigate back to
  // the completed item to verify its frozen answer is still available.
  await review.getByRole('button', { name: '← Previous', exact: true }).click();
  await review.getByText('Correct', { exact: true }).waitFor();
  const replayed = await (await context.request.get(baseURL + '/api/v1/review')).json();
  assert.deepEqual(
    replayed.targets,
    schedule.targets,
    'Reload does not change authoritative scheduling',
  );
  console.log(
    'Passed catalog upgrade, removed Review definitions, cached offline response, delayed sync and deterministic scheduling',
  );
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log(
    'Passed export/restore with immutable server history; offline hardening checks passed',
  );
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
