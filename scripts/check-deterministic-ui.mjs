// Real compiled curriculum + Go API, isolated temporary learner database.
// Run after npm run web:build: node scripts/check-deterministic-ui.mjs
// Override PLAYWRIGHT_MODULE / CHROME_BIN for your local browser runtime.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const screenshots = join(root, 'docs/screenshots/deterministic');
const temporary = await mkdtemp(join(tmpdir(), 'foundations-deterministic-ui-'));
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
  const api = start(binary, [], {
    env: {
      ...process.env,
      FOUNDATIONS_DATA: join(temporary, 'data'),
      FOUNDATIONS_ADDR: `127.0.0.1:${apiPort}`,
      FOUNDATIONS_ORIGIN: baseURL,
      FOUNDATIONS_EMAIL: 'deterministic-test@example.test',
      FOUNDATIONS_PASSWORD_HASH: hash,
      FOUNDATIONS_CATALOG: join(root, 'output/grading-catalog.json'),
      OPENROUTER_API_KEY: 'unused-isolated-test',
      FOUNDATIONS_GRADING_URL: apiURL + '/unused-provider',
    },
  });
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
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  const mutations = [];
  const submissions = [];
  const operations = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    operations.push(path);
    if (path === '/api/v1/attempts' && request.method() === 'POST')
      submissions.push(request.postDataJSON());
    if (request.method() !== 'GET' && new URL(request.url()).pathname.startsWith('/api/v1/review'))
      mutations.push(request.url());
  });
  const login = await context.request.post(baseURL + '/api/v1/auth/login', {
    headers: { Origin: baseURL },
    data: { email: 'deterministic-test@example.test', password },
  });
  assert.equal(login.status(), 200, 'Temporary local account signs in');
  const response = await context.request.get(baseURL + '/api/v1/review/catalog');
  assert.equal(response.status(), 200, 'Real catalog endpoint is available');
  const catalog = await response.json();
  assert.ok(catalog.items.some((item) => item.provenance === 'lesson-exercise'));
  assert.ok(catalog.items.some((item) => item.provenance === 'review-template'));

  const notebook = JSON.parse(await readFile(join(root, 'web/public/notebook.json'), 'utf8'));
  const definitions = (
    await Promise.all(
      ['deterministic-exercises', 'deterministic-linear', 'deterministic-algorithms'].map(
        async (name) => JSON.parse(await readFile(join(root, 'content', name + '.json'), 'utf8')),
      ),
    )
  ).flat();
  const exercise = () => page.locator('article.exercise:visible');
  const question = (slug, id) =>
    notebook.lessons.find((l) => l.slug === slug).questions.find((q) => q.id === id);
  const definition = (slug, id) => definitions.find((e) => e.lesson === slug && e.id === id);
  const responseFor = (slug, id, alternate = false) => {
    const fixtures = definition(slug, id).fixtures.filter((f) => f.verdict === 'correct');
    return fixtures[alternate && fixtures.length > 1 ? 1 : 0].response;
  };
  const open = async (slug, id) => {
    const authored = definition(slug, id);
    const lesson = notebook.lessons.find((l) =>
      l.questions.some(
        (q) => q.id === id && JSON.stringify(q.assessment) === JSON.stringify(authored.assessment),
      ),
    );
    assert.ok(lesson, 'Published exercise for ' + slug + '/' + id);
    await page.goto(baseURL + `/#/practice/${lesson.slug}/${id}`);
    await exercise().locator('.structured-answer').waitFor();
    return question(lesson.slug, id);
  };
  const noOverflow = async () => {
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      'No horizontal page overflow',
    );
    assert.equal(
      await exercise().evaluate((e) => e.scrollWidth > e.clientWidth),
      false,
      'Exercise fits viewport',
    );
  };
  const shot = async (name, target = exercise()) => {
    await target.evaluate((e) => e.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: join(screenshots, name + '.png') });
    console.log('Captured ' + name);
  };
  const enterMath = async (label, value) => {
    const editor = exercise().getByRole('textbox', { name: label + ' editor', exact: true });
    // Use native selection/input so CodeMirror sees the replacement selection.
    await editor.click();
    await editor.press('ControlOrMeta+a');
    await page.keyboard.insertText(value);
    await editor.press('Tab');
  };
  const fill = async (q, response) => {
    let selection = 0;
    for (const input of q.assessment.inputs) {
      if (input.kind === 'grid') {
        for (const [r, row] of input.rows.entries())
          for (const [c, cell] of row.cells.entries()) {
            if ('given' in cell) continue;
            const label =
              cell.label || `${input.label}, ${row.label || 'row ' + (r + 1)}, ${input.columns[c]}`;
            if (cell.kind === 'boolean')
              await exercise()
                .getByRole('button', {
                  name: new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':'),
                })
                .press(response[cell.id] ? 't' : 'f');
            else
              await exercise()
                .getByRole('textbox', { name: label, exact: true })
                .fill(response[cell.id]);
          }
      } else if (input.kind === 'interval') {
        for (const side of ['lower', 'upper'])
          await exercise()
            .getByRole('textbox', { name: input.label + ' ' + side + ' endpoint', exact: true })
            .fill(response[input.id + '.' + side]);
        for (const [side, name] of [
          ['leftClosed', 'lower'],
          ['rightClosed', 'upper'],
        ])
          await exercise()
            .getByRole('button', {
              name: new RegExp('^' + input.label + ' ' + name + ' endpoint boundary:'),
            })
            .press(response[input.id + '.' + side] ? 't' : 'f');
      } else if (input.kind === 'select' || input.kind === 'multiselect') {
        const options = exercise()
          .locator('.assessment-selection')
          .nth(selection++)
          .locator('input');
        for (const [i, option] of input.options.entries()) {
          const checked =
            input.kind === 'select'
              ? response[input.id] === option.id
              : response[input.id].includes(option.id);
          if (checked || input.kind === 'multiselect') await options.nth(i).setChecked(checked);
        }
        if (input.kind === 'multiselect' && !response[input.id].length)
          await options.last().check();
      } else if (input.kind === 'boolean') {
        await exercise()
          .getByRole('button', { name: new RegExp('^' + input.label + ':') })
          .press(response[input.id] ? 't' : 'f');
      } else if (input.kind === 'math') await enterMath(input.label, response[input.id]);
      else
        await exercise()
          .getByRole('textbox', {
            name: input.label,
            exact: true,
          })
          .fill(response[input.id]);
    }
  };
  const submit = async (verdict = 'Correct') => {
    await exercise().getByRole('button', { name: 'Submit', exact: true }).click();
    await exercise().getByText(verdict, { exact: true }).waitFor();
  };
  // Blank remains unanswered; keyboard and taps both set or clear truth values.
  let q = await open('propositional-logic', 40);
  assert.equal(
    await exercise().getByRole('button', { name: 'Submit', exact: true }).isEnabled(),
    false,
  );
  assert.equal(await exercise().locator('.scratchwork').getAttribute('open'), null);
  const firstTruth = exercise().locator('.boolean-cell').first();
  await firstTruth.click();
  assert.equal(await firstTruth.innerText(), 'T');
  await firstTruth.click();
  assert.equal(await firstTruth.innerText(), 'F');
  await firstTruth.click();
  assert.equal(await firstTruth.innerText(), 'T');
  await firstTruth.press('Delete');
  assert.equal(await firstTruth.innerText(), '—');
  await shot('truth-table-desktop');
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await noOverflow();
    await shot('truth-table-' + width);
  }
  await fill(
    q,
    definition('propositional-logic', 40).fixtures.find((f) => f.verdict === 'incorrect').response,
  );
  await exercise().locator('.scratchwork summary').click();
  await exercise()
    .getByRole('textbox', { name: 'Scratchwork editor', exact: true })
    .fill('Local scratchwork survives grading and reload.');
  // Optional handwriting and photos remain local scratchwork, even in photo mode.
  await exercise().getByLabel('Scratchwork format').selectOption('pen');
  const canvas = exercise().getByLabel('Handwriting canvas');
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  await page.mouse.move(bounds.x + 20, bounds.y + 20);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 100, bounds.y + 50, { steps: 8 });
  await page.mouse.up();
  assert.equal(
    await exercise().getByRole('button', { name: 'Undo', exact: true }).isEnabled(),
    true,
  );
  await exercise().getByLabel('Scratchwork format').selectOption('photo');
  await exercise()
    .getByLabel('Add photos')
    .setInputFiles({
      name: 'synthetic.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aG1cAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  await exercise().locator('.photo img').waitFor();
  await exercise().locator('.scratchwork summary').click();
  await exercise().getByLabel('Unsure', { exact: true }).check();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Reload after the asynchronous local save, rather than after the checkbox paint.
  await page.waitForFunction(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open('foundations-web');
        open.onsuccess = () => {
          const db = open.result;
          const saved = db
            .transaction('drafts')
            .objectStore('drafts')
            .get('propositional-logic-40');
          saved.onsuccess = () => {
            db.close();
            resolve(saved.result?.unsure === true);
          };
        };
      }),
  );
  await page.reload();
  await exercise().locator('.structured-answer').waitFor();
  assert.equal(
    await exercise().getByLabel('Unsure', { exact: true }).isChecked(),
    true,
    'Saved Unsure survives reload before offline submission',
  );
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await submit('Incorrect');
  assert.equal(
    await exercise().locator('.feedback').count(),
    0,
    'Incorrect feedback remains hidden',
  );
  await exercise().getByRole('button', { name: 'Show feedback', exact: true }).click();
  await shot('incorrect-feedback-phone');
  await exercise().getByRole('button', { name: 'Try again', exact: true }).click();
  await fill(q, responseFor('propositional-logic', 40));
  await submit();
  await page.reload();
  await exercise().getByText('Correct', { exact: true }).waitFor();
  await exercise().locator('.scratchwork summary').click();
  await exercise().getByLabel('Scratchwork format').selectOption('photo');
  await exercise().locator('.photo img').waitFor();
  await exercise().getByLabel('Scratchwork format').selectOption('pen');
  assert.equal(
    await exercise().getByRole('button', { name: 'Undo', exact: true }).isEnabled(),
    true,
  );
  await exercise().getByLabel('Scratchwork format').selectOption('type');
  assert.ok(
    (
      await exercise().getByRole('textbox', { name: 'Scratchwork editor', exact: true }).innerText()
    ).includes('Local scratchwork survives grading and reload.'),
  );
  await shot('offline-scratchwork-phone', exercise().locator('.scratchwork'));
  await exercise().locator('.scratchwork summary').click();
  await context.setOffline(false);
  await exercise().getByRole('button', { name: 'More' }).click();
  assert.equal(await exercise().getByText('Request recheck', { exact: true }).count(), 0);
  await exercise().getByRole('button', { name: 'Previous attempts', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  assert.equal(await page.getByRole('dialog').locator('.history-item').count(), 2);
  await page.getByRole('dialog').locator('.submitted-question summary').first().click();
  await page.screenshot({ path: join(screenshots, 'attempt-history-phone.png') });
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();

  // Real authored forms, including mathematically different accepted answers.
  const cases = [
    ['linear-algebra-matrices', 1, 'matrix-shape-desktop', 1440],
    ['linear-algebra-matrices', 29, 'matrix-grid-desktop', 1440],
    ['functions', 6, 'interval-phone', 320],
    ['graph-theory', 49, 'spanning-tree-phone', 390],
    ['graph-theory', 74, 'graph-route-phone', 390],
    ['recurrence-relations', 36, 'recurrence-desktop', 1440],
    ['sets-and-set-operations', 1, 'finite-set-phone', 390],
    ['predicates-and-quantifiers', 83, 'finite-model-phone', 390],
    ['asymptotic-growth', 34, 'truth-and-value-phone', 390],
    ['linear-algebra-bases', 23, 'basis-desktop', 1440],
    ['linear-algebra-systems', 43, null, 390],
    ['linear-algebra-eigenvalues', 11, null, 390],
    ['linear-algebra-eigenvalues', 45, 'typed-formula-and-reason-phone', 390],
    ['linear-algebra-svd', 23, null, 390],
  ];
  for (const [slug, id, name, width] of cases) {
    await page.setViewportSize({ width, height: width > 500 ? 1000 : 844 });
    q = await open(slug, id);
    await fill(q, responseFor(slug, id, true));
    await noOverflow();
    if (slug === 'recurrence-relations') {
      // Compact mode keeps the existing syntax helper and ordinary math preview.
      await exercise()
        .getByRole('button', { name: 'Symbols and syntax for F(0)', exact: true })
        .click();
      await page.getByRole('dialog', { name: 'Symbols & TeX syntax' }).waitFor();
      await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
      await enterMath('F(0)', '$1$');
      await exercise().locator('.compact .preview .katex').waitFor();
    }
    if (name) await shot(name);
    if (slug === 'linear-algebra-matrices' && id === 1) {
      assert.equal(
        await exercise().locator('.answer-grid').count(),
        0,
        'An assessed matrix shape is not revealed by its transpose input',
      );
    }
    if (slug === 'linear-algebra-matrices' && id === 29) {
      await page.setViewportSize({ width: 320, height: 844 });
      await noOverflow();
      await shot('matrix-grid-phone');
      // A reduced visual viewport approximates the space available above a phone keyboard.
      await page.setViewportSize({ width: 320, height: 420 });
      const lastCell = exercise().locator('.answer-grid input').last();
      await lastCell.focus();
      await lastCell.scrollIntoViewIfNeeded();
      const box = await lastCell.boundingBox();
      assert.ok(
        box && box.y >= 0 && box.y + box.height <= 420,
        'Focused matrix cell remains visible in a keyboard-sized viewport',
      );
      await noOverflow();
      await page.screenshot({ path: join(screenshots, 'matrix-keyboard-viewport.png') });
      await page.setViewportSize({ width: 1440, height: 1000 });
      // Multiple edits in one event loop must not overwrite other fields through stale props.
      await exercise()
        .locator('.structured-answer')
        .evaluate((answer) => {
          const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          for (const [i, input] of [...answer.querySelectorAll('.answer-grid input')].entries()) {
            setValue.call(input, ['4/2', '2/2', '0/2', '2/2', '4/2', '4/2', '0/2', '2/2'][i]);
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      assert.deepEqual(
        await exercise()
          .locator('.answer-grid input')
          .evaluateAll((inputs) => inputs.map((input) => input.value)),
        ['4/2', '2/2', '0/2', '2/2', '4/2', '4/2', '0/2', '2/2'],
      );
      assert.equal(
        await exercise().getByRole('radio', { name: 'B', exact: true }).isChecked(),
        true,
      );
      const first = exercise().getByRole('textbox', {
        name: 'AB, Row 1, Column 1',
        exact: true,
      });
      await first.fill('not a number');
      await exercise().getByRole('button', { name: 'Submit', exact: true }).click();
      await exercise().getByRole('alert').waitFor();
      assert.equal(
        await exercise().locator('.attempt').count(),
        0,
        'Input error does not create attempt',
      );
      await first.fill('2');
    }
    await submit();
    console.log('Graded ' + slug + '/' + id);
  }
  // Authoring preview is read-only; inspecting the library creates no review work.
  await page.setViewportSize({ width: 390, height: 844 });
  const structured = catalog.items.find(
    (item) => item.provenance === 'review-template' && item.question?.assessment,
  );
  assert.ok(structured, 'Catalog has authored structured review templates');
  await page.goto(baseURL + '/#/review-library/' + structured.lesson);
  const library = page.locator('.review-library-page');
  await library.getByRole('heading', { name: 'Review Library', exact: true }).waitFor();
  await library.getByLabel('Search catalog').fill(structured.id);
  const item = library.locator(`[data-template-id="${structured.id}"]`);
  await item.locator('summary').first().click();
  await item.locator('.structured-answer').first().waitFor();
  assert.equal(await item.locator('.structured-answer input').count(), 0);
  await item
    .locator('.library-question')
    .first()
    .evaluate((e) => e.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: join(screenshots, 'review-library-phone.png') });
  const relationTemplate = catalog.items.find(
    (entry) => entry.sourceTarget === 'review:quantifier-order-countermodel-variants',
  );
  assert.ok(relationTemplate, 'Finite relation template is in the Review catalog');
  await page.goto(baseURL + '/#/review-library/' + relationTemplate.lesson);
  await library.getByRole('heading', { name: 'Review Library', exact: true }).waitFor();
  await library.getByLabel('Search catalog').fill(relationTemplate.id);
  const relationPreview = library.locator(`[data-template-id="${relationTemplate.id}"]`);
  await relationPreview.locator('summary').first().click();
  await relationPreview.locator('.structured-answer').first().waitFor();
  assert.equal(await relationPreview.locator('.structured-answer input').count(), 0);
  await relationPreview
    .locator('.library-question')
    .first()
    .evaluate((e) => e.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: join(screenshots, 'finite-relation-review-phone.png') });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(mutations, [], 'Library inspection creates no review mutations');
  assert.deepEqual(errors, [], 'No browser runtime errors');
  const uploadDeadline = Date.now() + 30000;
  while (
    new Set(submissions.map((a) => a.id)).size < cases.length + 2 &&
    Date.now() < uploadDeadline
  )
    await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(
    new Set(submissions.map((a) => a.id)).size,
    cases.length + 2,
    'Every real deterministic attempt uploaded',
  );
  for (const a of submissions) {
    assert.equal(a.mode, 'structured');
    assert.equal(a.text, '');
    assert.deepEqual(a.images, []);
    for (const field of ['photos', 'ink', 'presentation', 'grades', 'transcription'])
      assert.equal(field in a, false, 'Submission excludes ' + field);
  }
  assert.equal(
    operations.some((path) => /recheck|transcri|unused-provider/.test(path)),
    false,
    'No model/recheck/transcription calls',
  );
  assert.ok(
    submissions.some((a) => a.unsure === true),
    'Unsure survives deterministic submission',
  );
  assert.ok(
    submissions.some((a) => a.assistance?.priorIncorrectFeedbackSeen === true),
    'Viewing feedback remains assistance evidence',
  );
  assert.equal(
    operations.some((path) => path.startsWith('/api/v1/media/')),
    false,
    'Scratchwork photos are never uploaded',
  );

  // Export/import restores structured answers, snapshots and all local scratch modes.
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Export local work', exact: true })
    .click();
  const download = await downloadPromise;
  const backupFile = join(temporary, 'synthetic-backup.json');
  await download.saveAs(backupFile);
  const backup = JSON.parse(await readFile(backupFile, 'utf8'));
  const truthDraft = backup.drafts.find(
    ([, d]) => d.text === 'Local scratchwork survives grading and reload.',
  )[1];
  assert.ok(truthDraft.strokes.length);
  assert.equal(truthDraft.photos.length, 1);
  assert.ok(Object.keys(truthDraft.response).length);
  assert.equal(backup.media.length, 1);
  assert.ok(backup.attempts.every(([, a]) => a.presentation?.question?.assessment));
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  const restoredContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await restoredContext.request.post(baseURL + '/api/v1/auth/login', {
    headers: { Origin: baseURL },
    data: { email: 'deterministic-test@example.test', password },
  });
  const restored = await restoredContext.newPage();
  await restored.goto(baseURL + '/#/practice/propositional-logic/40');
  await restored.getByRole('button', { name: 'Settings', exact: true }).click();
  await restored
    .getByRole('dialog')
    .getByLabel('Import local work', { exact: true })
    .setInputFiles(backupFile);
  await restored.getByRole('dialog').getByRole('status').filter({ hasText: 'Imported' }).waitFor();
  await restored.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  const restoredExercise = restored.locator('article.exercise:visible');
  await restoredExercise.getByText('Correct', { exact: true }).waitFor();
  await restoredExercise.locator('.scratchwork summary').click();
  assert.ok(
    (
      await restoredExercise
        .getByRole('textbox', { name: 'Scratchwork editor', exact: true })
        .innerText()
    ).includes(truthDraft.text),
  );
  await restoredExercise.getByLabel('Scratchwork format').selectOption('photo');
  await restoredExercise.locator('.photo img').waitFor();
  await restoredExercise.getByLabel('Scratchwork format').selectOption('pen');
  assert.equal(
    await restoredExercise.getByRole('button', { name: 'Undo', exact: true }).isEnabled(),
    true,
  );
  await restoredContext.close();
  const ids = [...new Set(submissions.map((a) => a.id))];
  for (const id of ids) {
    const answer = await context.request.get(baseURL + '/api/v1/attempts/' + id);
    assert.equal(answer.status(), 200);
    const attempt = await answer.json();
    assert.equal(attempt.status, 'graded', 'Server grades deterministically');
    assert.equal(attempt.grades.at(-1).model, 'deterministic');
    assert.equal(
      attempt.grades.at(-1).verdict,
      id === ids[0] ? 'incorrect' : 'correct',
      'Authoritative server grade agrees with the expected offline result',
    );
    assert.ok(attempt.presentation?.question?.assessment, 'Server freezes the historic question');
  }
  console.log(
    `Passed published deterministic UI checks (${ids.length} server-verified attempts); screenshots: ${screenshots}`,
  );
} catch (error) {
  if (browser)
    for (const context of browser.contexts())
      for (const page of context.pages())
        await page
          .screenshot({ path: join(root, 'output/deterministic-ui-failure.png') })
          .catch(() => {});
  console.error('Failure screenshot: output/deterministic-ui-failure.png');
  throw error;
} finally {
  await browser?.close();
  for (const child of children) child.kill('SIGTERM');
  // Only synthetic learner data belongs to this script.
  await rm(temporary, { recursive: true, force: true });
}
