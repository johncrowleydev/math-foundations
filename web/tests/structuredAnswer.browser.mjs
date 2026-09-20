// Isolated deterministic-answer UI checks. Build content first; no real API or model calls.
// PLAYWRIGHT_MODULE may point to an existing Playwright installation.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const screenshotDirectory = join(root, 'output/structured-answer-ui');
const notebook = JSON.parse(await readFile(join(root, 'web/public/notebook.json'), 'utf8'));
const evidence = { level: 'production', interactionCost: 'medium', inputCapabilities: ['tap'] };
const feedback = {
  correct: 'The values satisfy the requested conditions.',
  incorrect: 'Check each requested value.',
};
const rows = [
  [true, true],
  [true, false],
  [false, true],
  [false, false],
];
const truth = {
  version: 1,
  inputs: [
    {
      id: 'truth',
      kind: 'grid',
      label: 'Truth table',
      columns: [
        '$p$',
        '$q$',
        '$p \\land q$',
        '$p \\lor q$',
        '$p \\to q$',
        '$p \\leftrightarrow q$',
      ],
      rows: rows.map(([p, q], i) => ({
        cells: [
          { given: p },
          { given: q },
          ...[0, 1, 2, 3].map((j) => ({ id: `v${i}${j}`, kind: 'boolean' })),
        ],
      })),
    },
  ],
  requirements: [
    {
      id: 'values',
      description: 'Evaluate every connective',
      validator: 'boolean',
      fields: rows.flatMap((_, i) => [0, 1, 2, 3].map((j) => `v${i}${j}`)),
      params: { expected: rows.flatMap(([p, q]) => [p && q, p || q, !p || q, p === q]) },
    },
  ],
  feedback,
  evidence,
};
const matrix = {
  version: 1,
  inputs: [
    {
      id: 'matrix',
      kind: 'grid',
      label: 'Resulting matrix',
      columns: ['Column 1', 'Column 2'],
      rows: [
        {
          label: 'Row 1',
          cells: [
            { id: 'a', kind: 'text' },
            { id: 'b', kind: 'text' },
          ],
        },
        {
          label: 'Row 2',
          cells: [
            { id: 'c', kind: 'text' },
            { id: 'd', kind: 'text' },
          ],
        },
      ],
    },
  ],
  requirements: [
    {
      id: 'matrix',
      description: 'Find each entry',
      validator: 'matrix',
      fields: ['a', 'b', 'c', 'd'],
      params: {
        expected: [
          ['1/2', '0'],
          ['-2', '3'],
        ],
      },
    },
  ],
  feedback,
  evidence: { ...evidence, inputCapabilities: ['short-text'] },
};
const selection = {
  version: 1,
  inputs: [
    {
      id: 'edges',
      kind: 'multiselect',
      label: 'Select the edges in your spanning tree.',
      options: ['AB', 'AC', 'BC'].map((id) => ({ id, label: id })),
      emptyLabel: 'No edges',
    },
  ],
  requirements: [
    {
      id: 'edges',
      description: 'Select the requested tree',
      validator: 'selection',
      fields: ['edges'],
      params: { expected: ['AB', 'AC'] },
    },
  ],
  feedback,
  evidence,
};
const interval = {
  version: 1,
  inputs: [{ id: 'range', kind: 'interval', label: 'Interval' }],
  requirements: [
    {
      id: 'range',
      description: 'Find the interval',
      validator: 'interval',
      fields: ['range.lower', 'range.upper', 'range.leftClosed', 'range.rightClosed'],
      params: { lower: '-1', upper: '3', leftClosed: true, rightClosed: false },
    },
  ],
  feedback,
  evidence,
};
const formula = {
  version: 1,
  inputs: [
    {
      id: 'formula',
      kind: 'math',
      label: 'Equivalent formula',
      hint: 'Use the same ordinary math notation as in the lesson.',
    },
  ],
  requirements: [
    {
      id: 'formula',
      description: 'Negate the conjunction',
      validator: 'boolean-formula',
      fields: ['formula'],
      params: { expected: '!p | !q', variables: ['p', 'q'], form: 'nnf' },
    },
  ],
  feedback,
  evidence: { ...evidence, inputCapabilities: ['math-text'] },
};
const lesson = notebook.lessons.find((lesson) => lesson.slug === 'propositional-logic');
for (const [offset, assessment] of [truth, matrix, selection, interval, formula].entries()) {
  const q = lesson.questions.find((q) => q.id === 40 + offset);
  Object.assign(q, {
    instructions: 'Complete the answer.',
    prompt:
      offset === 0
        ? 'Evaluate the connectives for each given assignment.'
        : 'Synthetic input demonstration.',
    assessment,
    answer: 'See the supplied definition.',
  });
  delete q.math;
  delete q.choice;
}

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
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
  const page = await context.newPage();
  const errors = [];
  const submitted = [];
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
  const open = async (id) => {
    await page.goto(base + `/#/practice/propositional-logic/${id}`);
    await exercise().locator('.structured-answer').waitFor();
  };
  await open(40);
  assert.equal(
    await exercise().getByRole('button', { name: 'Submit', exact: true }).isEnabled(),
    false,
  );
  const buttons = exercise().locator('.boolean-cell');
  assert.equal(await buttons.count(), 16);
  await buttons.nth(0).click();
  assert.equal(await buttons.nth(0).innerText(), 'T');
  await buttons.nth(0).click();
  assert.equal(await buttons.nth(0).innerText(), 'F');
  await buttons.nth(0).press('Delete');
  assert.equal(await buttons.nth(0).innerText(), '—');
  for (let i = 0; i < 16; i++) await buttons.nth(i).press('f');
  await page.screenshot({ path: join(screenshotDirectory, 'truth-table-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await exercise().scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const grid = exercise().locator('.answer-grid-scroll');
  await page.setViewportSize({ width: 320, height: 844 });
  assert.equal(await grid.evaluate((node) => node.scrollWidth > node.clientWidth), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: join(screenshotDirectory, 'truth-table-narrow-phone.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(screenshotDirectory, 'truth-table-phone.png') });
  await exercise().locator('.scratchwork summary').click();
  await exercise()
    .getByRole('textbox', { name: 'Scratchwork editor' })
    .fill('Preserve these personal notes.');
  await exercise().locator('.scratchwork summary').click();
  await context.setOffline(true);
  await exercise().getByRole('button', { name: 'Submit', exact: true }).click();
  await exercise().getByText('Incorrect', { exact: true }).waitFor();
  assert.equal(await exercise().locator('.feedback').count(), 0);
  await exercise().getByRole('button', { name: 'More' }).click();
  assert.equal(await exercise().getByText('Request recheck', { exact: true }).count(), 0);
  await exercise().getByRole('button', { name: 'More' }).click();
  await exercise().getByRole('button', { name: 'Try again' }).click();
  for (let i = 0; i < 16; i++)
    await buttons.nth(i).press(truth.requirements[0].params.expected[i] ? 't' : 'f');
  await exercise().getByRole('button', { name: 'Submit', exact: true }).click();
  await exercise().getByText('Correct', { exact: true }).waitFor();
  await context.setOffline(false);
  await page.reload();
  await exercise().getByText('Correct', { exact: true }).waitFor();
  assert.equal(await exercise().getByRole('button', { name: 'Try again' }).count(), 0);
  await exercise().locator('.scratchwork summary').click();
  assert.ok(
    (await exercise().getByRole('textbox', { name: 'Scratchwork editor' }).innerText()).includes(
      'Preserve these personal notes.',
    ),
  );
  await page.screenshot({
    path: join(screenshotDirectory, 'graded-scratchwork-phone.png'),
    fullPage: true,
  });

  await open(41);
  const first = exercise().getByRole('textbox', { name: 'Resulting matrix, Row 1, Column 1' });
  await first.evaluate((element) => {
    const data = new DataTransfer();
    data.setData('text/plain', '1/2\t0\n-2\t3');
    element.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: data }));
  });
  await page.waitForFunction(
    () =>
      document.querySelector('input[aria-label="Resulting matrix, Row 1, Column 1"]')?.value ===
      '1/2',
  );
  assert.equal(await first.inputValue(), '1/2');
  assert.equal(
    await exercise()
      .getByRole('textbox', { name: 'Resulting matrix, Row 2, Column 2' })
      .inputValue(),
    '3',
  );
  await page.screenshot({ path: join(screenshotDirectory, 'matrix-phone.png') });
  await first.fill('not a number');
  await exercise().getByRole('button', { name: 'Submit', exact: true }).click();
  await exercise().getByRole('alert').waitFor();
  assert.equal(await exercise().getByText('Incorrect', { exact: true }).count(), 0);
  await first.fill('1/2');
  await exercise().getByRole('button', { name: 'Submit', exact: true }).click();
  await exercise().getByText('Correct', { exact: true }).waitFor();
  for (const [id, file] of [
    [42, 'selection-phone'],
    [43, 'interval-phone'],
    [44, 'formula-phone'],
  ]) {
    await open(id);
    await page.screenshot({ path: join(screenshotDirectory, file + '.png') });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
  }
  assert.deepEqual(errors, []);
  for (const a of submitted) {
    assert.equal(a.mode, 'structured');
    assert.equal(a.text, '');
    assert.deepEqual(a.images, []);
    for (const field of ['photos', 'ink', 'presentation', 'grades'])
      assert.equal(field in a, false);
  }
  console.log(`Passed deterministic UI checks; screenshots: ${screenshotDirectory}`);
} finally {
  await browser?.close();
  vite.kill('SIGTERM');
}
