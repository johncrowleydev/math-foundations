// Regression: primary draft restoration must finish before any empty editor is published.
// Build content first; this uses a temporary browser profile and mocked API.
// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const screenshotDirectory = join(root, 'output/e2e/draft-hydration-ui');
const notebook = JSON.parse(await readFile(join(root, 'web/public/notebook.json'), 'utf8'));
const listener = createServer();
listener.listen(0, '127.0.0.1');
await once(listener, 'listening');
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const vite = spawn(
  process.execPath,
  [join(root, 'web/node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(port)],
  {
    cwd: join(root, 'web'),
    stdio: 'ignore',
    env: { ...process.env, FOUNDATIONS_API_TARGET: 'http://127.0.0.1:9' },
  },
);
let browser;
try {
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(base);
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  await mkdir(screenshotDirectory, { recursive: true });
  browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN,
    headless: true,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
  const page = await context.newPage();
  const errors = [];
  const submitted = [];
  await page.addInitScript(() => {
    window.draftHydrationGate = new Promise((resolve) => {
      window.releaseDraftHydration = resolve;
    });
    window.draftHydrationStarted = false;
    window.draftHydrationWrites = [];
  });
  // Delay the primary legacy-record read, while permitting the concurrent draft reads.
  // This deterministically exposes the old early-empty-draft initialization race.
  await page.route('**/src/storage.ts', async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const original = 'return (await db).get(store, key);';
    assert.ok(source.includes(original), 'The storage get hook is present');
    const body = source.replace(
      original,
      `
      if (store === 'records' && key === 'text/linear-algebra-matrices-1') {
        window.draftHydrationStarted = true;
        await window.draftHydrationGate;
      }
      return (await db).get(store, key);
    `,
    );
    const put = 'await (await db).put(store, value, key);';
    assert.ok(body.includes(put), 'The storage put hook is present');
    await route.fulfill({
      response,
      body: body.replace(
        put,
        `
        if (store === 'drafts' && key === 'linear-algebra-matrices-1')
          window.draftHydrationWrites.push(value.response);
        await (await db).put(store, value, key);
      `,
      ),
    });
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/notebook.json', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(notebook) }),
  );
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    assert.ok(!/recheck|transcri|grading/.test(path), 'No model operations');
    if (path.endsWith('/attempts') && route.request().method() === 'POST') {
      submitted.push(route.request().postDataJSON());
      // Keep upload pending; local results and offline retries are the subject of this check.
      return route.fulfill({ status: 503, body: 'Synthetic offline server' });
    }
    return route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(
        path.endsWith('/auth/session')
          ? { email: 'synthetic@example.test', expires: Date.now() + 86400000 }
          : { records: [], attempts: [], cursor: 0, more: false },
      ),
    });
  });

  const exercise = () => page.locator('article.exercise:visible');
  await page.goto(base + '/#/practice/linear-algebra-matrices/1');
  await page.waitForFunction(() => window.draftHydrationStarted);
  // A frame boundary lets all initial effects finish, except the explicitly held read.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  assert.equal(
    await exercise().locator('.structured-answer').count(),
    0,
    'The legacy hydration effect must not expose an empty editor before initial restoration completes',
  );
  await exercise().getByText('Opening answer…', { exact: true }).waitFor();
  await page.evaluate(() => window.releaseDraftHydration());
  await exercise().locator('.structured-answer').waitFor();
  const entry = JSON.parse(
    await readFile(join(root, 'content/deterministic-exercises.json'), 'utf8'),
  ).find((e) => e.lesson === 'linear-algebra-matrices' && e.id === 1);
  const response = entry.fixtures.find(
    (f) => f.verdict === 'correct' && String(f.response.transpose).includes('begin'),
  ).response;
  const question = notebook.lessons
    .find((l) => l.slug === 'linear-algebra-matrices')
    .questions.find((q) => q.id === 1);
  // A saved draft also updates the hidden Learn view. Controlled editor updates
  // must not emit user edits from either copy and write partial snapshots back.
  await page.evaluate(
    async ({ question, response }) => {
      const { emptyDraft, put } = await import('/src/storage.ts');
      const { reconcileResponse } = await import('/src/structuredAnswer.ts');
      const restored = reconcileResponse(emptyDraft(), question);
      restored.response = response;
      window.draftHydrationWrites = [];
      await put('drafts', 'linear-algebra-matrices-1', restored);
    },
    { question, response },
  );
  for (const input of question.assessment.inputs) {
    await page.waitForFunction(
      ({ label, value }) =>
        [...document.querySelectorAll('article.exercise')]
          .filter((article) => article.checkVisibility())
          .some((article) =>
            [...article.querySelectorAll('[role="textbox"]')].some(
              (editor) =>
                editor.getAttribute('aria-label') === label + ' editor' &&
                editor.textContent === value,
            ),
          ),
      { label: input.label, value: response[input.id] },
    );
  }
  assert.equal(
    await page.evaluate(() => window.draftHydrationWrites.length),
    1,
    'Restored math values must not be written back as user edits',
  );
  // Change every field through real input after restoration, including clearing it.
  for (const input of question.assessment.inputs) {
    await exercise()
      .getByRole('textbox', { name: input.label + ' editor', exact: true })
      .fill('');
  }
  for (const input of question.assessment.inputs) {
    await exercise()
      .getByRole('textbox', { name: input.label + ' editor', exact: true })
      .fill(response[input.id]);
  }
  assert.equal(
    await exercise().getByRole('button', { name: 'Submit', exact: true }).isEnabled(),
    true,
  );
  await exercise().getByLabel('Unsure', { exact: true }).check();
  await page.waitForFunction(
    (expected) =>
      new Promise((resolve) => {
        const open = indexedDB.open('foundations-web');
        open.onsuccess = () => {
          const db = open.result;
          const get = db
            .transaction('drafts')
            .objectStore('drafts')
            .get('linear-algebra-matrices-1');
          get.onsuccess = () => {
            db.close();
            resolve(
              get.result?.unsure === true &&
                JSON.stringify(get.result?.response) === JSON.stringify(expected),
            );
          };
        };
      }),
    response,
  );
  await page.reload();
  await exercise().locator('.structured-answer').waitFor();
  await page.evaluate(() => window.releaseDraftHydration());
  assert.equal(await exercise().getByLabel('Unsure', { exact: true }).isChecked(), true);
  for (const input of question.assessment.inputs) {
    assert.equal(
      (
        await exercise()
          .getByRole('textbox', { name: input.label + ' editor', exact: true })
          .innerText()
      ).trim(),
      response[input.id],
    );
  }
  // Real keyboard input after restoration must likewise survive later record reads.
  const last = question.assessment.inputs.at(-1);
  const editor = exercise().getByRole('textbox', { name: last.label + ' editor', exact: true });
  await editor.press('ControlOrMeta+a');
  await page.keyboard.insertText('1,4;2,5;3,6');
  await page.waitForFunction(
    () =>
      document.querySelector('[aria-label="Rows of the transpose editor"]')?.textContent ===
      '1,4;2,5;3,6',
  );
  await exercise().getByRole('button', { name: 'Submit', exact: true }).click();
  await exercise().getByText('Correct', { exact: true }).waitFor();
  const savedAttempt = await page.evaluate(async () => {
    const { all } = await import('/src/storage.ts');
    return (await all('attempts')).find(
      (attempt) => attempt.exercise === 'linear-algebra-matrices-1',
    );
  });
  assert.equal(savedAttempt.unsure, true, 'Unsure survives deterministic submission');
  assert.deepEqual(errors, []);
  await page.screenshot({ path: join(screenshotDirectory, 'restored-typed-matrix.png') });
  console.log('Passed delayed draft hydration, rapid field edits, reload, and keyboard entry.');
} catch (error) {
  await browser
    ?.contexts()[0]
    ?.pages()[0]
    ?.screenshot({ path: join(screenshotDirectory, 'failure.png') });
  throw error;
} finally {
  await browser?.close();
  vite.kill('SIGTERM');
}
