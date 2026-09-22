// Real Go API and browser recovery, with isolated synthetic work and a loopback provider.
// Run after npm run web:build. Never contacts production or an external grading provider.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer as httpServer } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'foundations-stale-submission-'));
const screenshots = join(root, 'output/e2e/stale-catalog-retry');
const children = [];
let browser;
let provider;
const providerErrors = [];
let providerCalls = 0;
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', ...options });
  assert.equal(result.status, 0, result.stderr || `${command} failed`);
  return result.stdout.trim();
}
async function port() {
  const listener = createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const value = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  return value;
}
function start(command, args, options) {
  const child = spawn(command, args, { stdio: 'ignore', ...options });
  children.push(child);
  return child;
}
async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  await exited;
}
async function ready(url, child) {
  for (let i = 0; i < 300; i++) {
    assert.equal(child.exitCode, null, 'Local test service exited');
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
  const notebook = JSON.parse(await readFile(join(root, 'web/public/notebook.json'), 'utf8'));
  const catalog = JSON.parse(await readFile(join(root, 'output/grading-catalog.json'), 'utf8'));
  const lesson = notebook.lessons.find((item) => item.slug === 'sets-and-set-operations');
  const question = lesson.questions.find((item) => item.id === 25);
  const exercise = (lesson.exerciseNamespace || lesson.slug) + '-' + question.id;
  assert.ok(question && !question.choice && !question.assessment);
  const originalTeaching = structuredClone(catalog.exercises[exercise]);
  const originalVersion = 'a'.repeat(64);
  assert.notEqual(originalVersion, catalog.version);
  const historical = join(temporary, 'historical.json');
  await writeFile(
    historical,
    JSON.stringify({ version: originalVersion, exercises: { [exercise]: originalTeaching } }),
  );
  // Today has a different question and grading context. The saved answer must use the archive.
  catalog.exercises[exercise].question.prompt =
    'Synthetic replacement question, never shown to the saved-answer author.';
  catalog.exercises[exercise].question.officialAnswer = 'Synthetic replacement answer.';
  catalog.exercises[exercise].introduction = 'Synthetic replacement teaching.';
  const current = join(temporary, 'current.json');
  await writeFile(current, JSON.stringify(catalog));
  provider = httpServer(async (request, response) => {
    try {
      let body = '';
      for await (const chunk of request) body += chunk;
      const sent = JSON.parse(body);
      const context = JSON.parse(sent.messages[1].content[0].text);
      assert.deepEqual(
        context.exercise,
        originalTeaching,
        'Provider receives the original full context',
      );
      providerCalls++;
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  verdict: 'correct',
                  feedback: 'Synthetic grading completed against the original catalog.',
                  issue: '',
                  improvement: '',
                  transcription: '',
                  requirements: [
                    {
                      id: 'synthetic',
                      description: 'Synthetic original requirement.',
                      satisfied: true,
                    },
                  ],
                  diagnosis: [],
                  confidence: 'high',
                  notGradedReason: '',
                }),
              },
            },
          ],
        }),
      );
    } catch (error) {
      providerErrors.push(error.message);
      response.writeHead(500).end();
    }
  });
  provider.listen(0, '127.0.0.1');
  await once(provider, 'listening');
  const providerURL = `http://127.0.0.1:${provider.address().port}`;
  const binary = join(temporary, 'foundations-api');
  run('go', ['build', '-o', binary, '.'], { cwd: join(root, 'server') });
  const password = randomBytes(24).toString('hex');
  const hash = run(binary, ['hash-password'], { input: password });
  const apiPort = await port();
  const webPort = await port();
  const apiURL = `http://127.0.0.1:${apiPort}`;
  const baseURL = `http://localhost:${webPort}`;
  const web = start(
    process.execPath,
    [
      join(root, 'web/node_modules/vite/bin/vite.js'),
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(webPort),
      '--strictPort',
    ],
    {
      cwd: join(root, 'web'),
      env: { ...process.env, FOUNDATIONS_API_TARGET: apiURL },
    },
  );
  await ready(baseURL, web);
  browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || chromium.executablePath(),
    headless: true,
  });
  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['phone', 390, 844],
  ]) {
    const archive = join(temporary, name, 'catalogs');
    await mkdir(archive, { recursive: true });
    const api = start(binary, [], {
      env: {
        ...process.env,
        FOUNDATIONS_DATA: join(temporary, name, 'data'),
        FOUNDATIONS_ADDR: `127.0.0.1:${apiPort}`,
        FOUNDATIONS_ORIGIN: baseURL,
        FOUNDATIONS_EMAIL: 'stale-test@example.test',
        FOUNDATIONS_PASSWORD_HASH: hash,
        FOUNDATIONS_CATALOG: current,
        FOUNDATIONS_CATALOG_ARCHIVE: archive,
        OPENROUTER_API_KEY: 'synthetic-local-only',
        FOUNDATIONS_GRADING_URL: providerURL,
      },
    });
    await ready(apiURL + '/api/v1/auth/session', api);
    const context = await browser.newContext({
      viewport: { width, height },
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let uploads = 0;
    let rechecks = 0;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().endsWith('/api/v1/attempts')) uploads++;
      if (request.url().endsWith('/recheck')) rechecks++;
    });
    const login = await context.request.post(baseURL + '/api/v1/auth/login', {
      headers: { Origin: baseURL },
      data: { email: 'stale-test@example.test', password },
    });
    assert.equal(login.status(), 200);
    const submittedAt = Date.UTC(2026, 8, 21, 19, 24);
    const submission = {
      id: 'synthetic-stale-proof-' + name,
      exercise,
      contentVersion: originalVersion,
      mode: 'type',
      text: 'Synthetic saved proof used only to verify historical-catalog recovery.',
      images: [],
      revealed: false,
      submitted: submittedAt,
      startedAt: submittedAt - 1000,
      activeDurationMs: 500,
    };
    const rejection = await context.request.post(baseURL + '/api/v1/attempts', {
      headers: { Origin: baseURL },
      data: submission,
    });
    assert.equal(rejection.status(), 409, 'Unknown original catalog is safely rejected');
    const error = await rejection.text();
    const saved = { ...submission, status: 'queued', grades: [], presentation: { question } };
    await page.goto(baseURL + '/#/practice/sets-and-set-operations/' + question.id);
    // Learn remains mounted but hidden beside Practice; target the saved answer's card.
    const exerciseCard = page.locator(`article.exercise[data-exercise-key="${exercise}"]:visible`);
    await exerciseCard.waitFor();
    await page.evaluate(
      async ({ saved, error }) => {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open('foundations-web', 2);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const tx = db.transaction(['attempts', 'settings'], 'readwrite');
        tx.objectStore('attempts').put({ ...saved, status: 'error', error }, saved.id);
        tx.objectStore('settings').put(
          { id: saved.id, kind: 'attempt', data: saved, error },
          'rejected:' + saved.id,
        );
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      },
      { saved, error },
    );
    await page.reload();
    await exerciseCard.getByRole('button', { name: 'Retry grading', exact: true }).waitFor();
    await page.screenshot({ path: join(screenshots, name + '-before.png'), fullPage: true });
    await writeFile(join(archive, originalVersion + '.json'), await readFile(historical));
    const acknowledgement = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/attempts') && response.request().method() === 'POST',
    );
    await exerciseCard.getByRole('button', { name: 'Retry grading', exact: true }).click();
    const accepted = await acknowledgement;
    assert.equal(
      accepted.status(),
      201,
      'The real API accepts the original catalog after retention',
    );
    assert.deepEqual(accepted.request().postDataJSON(), submission, 'Original upload is unchanged');
    await exerciseCard
      .getByText('Synthetic grading completed against the original catalog.', { exact: true })
      .waitFor();
    const result = await (
      await context.request.get(baseURL + '/api/v1/attempts/' + submission.id)
    ).json();
    for (const [key, value] of Object.entries(submission))
      assert.deepEqual(result[key], value, key);
    assert.equal(result.presentation.question.prompt, question.prompt);
    assert.equal(result.presentation.question.answer, question.answer);
    assert.equal(result.grades.length, 1);
    const duplicate = await context.request.post(baseURL + '/api/v1/attempts', {
      headers: { Origin: baseURL },
      data: submission,
    });
    assert.equal(duplicate.status(), 200, 'Duplicate retry is idempotent');
    assert.equal((await duplicate.json()).grades.length, 1);
    assert.equal(uploads, 1);
    assert.equal(rechecks, 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(providerErrors, []);
    await page.screenshot({ path: join(screenshots, name + '-recovered.png'), fullPage: true });
    await context.close();
    await stop(api);
  }
  assert.equal(providerCalls, 2, 'Each original answer is graded once');
  console.log(
    'Desktop and phone: real API recovers stale submissions with exact original context and immutable identity.',
  );
} finally {
  await browser?.close();
  for (const child of children.reverse()) await stop(child);
  if (provider) await new Promise((resolve) => provider.close(resolve));
  await rm(temporary, { recursive: true, force: true });
}
