import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { parse } from 'yaml';
// Synthetic browser smoke test; all API traffic is intercepted.
// Run with PLAYWRIGHT_MODULE and CHROME_BIN for the local browser runtime.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.argv[2] || 'http://127.0.0.1:4196';
const directory = 'docs/screenshots/react-mdx';
const manifest = parse(await readFile('content/curriculum.yaml', 'utf8'));
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  serviceWorkers: 'block',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let notebook;
await page.route('**/notebook.json', async (route) => {
  const response = await route.fetch();
  notebook = await response.json();
  // The browser must render canonical MDX even when the historical metadata
  // contains no prose or figure blocks. The old block renderer fails this check.
  const stripped = structuredClone(notebook);
  for (const lesson of stripped.lessons) {
    lesson.intro = '';
    lesson.introBlocks = [];
    for (const section of lesson.sections) {
      section.markdown = '';
      section.blocks = [];
    }
  }
  await route.fulfill({ response, json: stripped });
});
await page.route('**/api/**', async (route) => {
  const path = new URL(route.request().url()).pathname;
  const body = path.endsWith('/auth/session')
    ? { email: 'mdx-migration@example.test', expires: Date.now() + 86400000 }
    : path.endsWith('/mutations')
      ? {
          ...route.request().postDataJSON(),
          revision: 1,
          versions: [],
          conflicts: [],
          updated: Date.now(),
        }
      : { records: [], cursor: 0, more: false, attempts: [] };
  await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
});
await page.goto(baseURL + '/#/learn/calculus-definite-integrals');
await page.locator('.lesson-intro h1').waitFor();
assert.equal(
  await page.locator('.lesson-intro h1').textContent(),
  'Definite Integrals and Accumulation',
);
assert.match(await page.locator('.lesson-intro').innerText(), /A derivative starts with/);
const lesson = notebook.lessons.find((l) => l.slug === 'calculus-definite-integrals');
const sourceFile = manifest.lessons.find((l) => l.slug === lesson.slug).lesson;
const source = await readFile('content/' + sourceFile, 'utf8');
const expectedExerciseKeys = [...source.matchAll(/<(Exercise|QuickCheck)\s+id="([^"]+)"/g)].map(
  ([, component, id]) => {
    const numericId =
      component === 'Exercise'
        ? Number(id)
        : lesson.sections.flatMap((s) => s.quickChecks).find((q) => q.id === id).exerciseId;
    return (lesson.exerciseNamespace || lesson.slug) + '-' + numericId;
  },
);
assert.deepEqual(
  await page
    .locator('.reading-column:visible .exercise')
    .evaluateAll((nodes) => nodes.map((node) => node.dataset.exerciseKey)),
  expectedExerciseKeys,
  'MDX assessment tags must render the same persisted exercise keys in document order',
);
assert.ok((await page.locator('.reading-column:visible .katex').count()) > 0);
await page.locator('.reading-column:visible .term').first().click();
await page.getByRole('button', { name: 'Close reference', exact: true }).click();
const figure = page.locator('figure').filter({ hasText: 'Accumulation as signed area' });
assert.equal(await figure.locator('svg').count(), 1);
await figure.scrollIntoViewIfNeeded();
await figure.screenshot({ path: directory + '/calculus-figure-desktop.png' });
await figure.getByRole('button', { name: 'Expand', exact: true }).click();
await page.getByRole('button', { name: /close/i }).last().click();
const first = page.locator('.exercise').first();
await first.scrollIntoViewIfNeeded();
await page.screenshot({ path: directory + '/calculus-exercise-desktop.png' });
await first.getByRole('textbox').first().fill('2');
await first.getByRole('textbox').first().press('Tab');
await first.getByText('Reveal answer', { exact: true }).click();
await page.reload();
await first.getByRole('textbox').first().filter({ hasText: '2' }).waitFor();
assert.equal(await first.getByRole('textbox').first().innerText(), '2');
await first.scrollIntoViewIfNeeded();
await page.screenshot({ path: directory + '/calculus-exercise-desktop.png' });
const quick = lesson.questions.find((q) => q.quickSource);
const quickKey = (lesson.exerciseNamespace || lesson.slug) + '-' + quick.id;
const quickCheck = page.locator('[data-exercise-key="' + quickKey + '"]');
const choice = quickCheck.getByRole('radio').first();
await choice.check();
assert.equal(await choice.isChecked(), true);
await page.reload();
await choice.waitFor();
assert.equal(
  await choice.isChecked(),
  true,
  'MDX QuickCheck must restore the existing saved choice',
);
await page.goto(baseURL + '/#/learn/graph-theory');
await page.locator('.lesson-intro h1').waitFor();
const interactive = page
  .locator('figure')
  .filter({ has: page.getByRole('button', { name: 'Next', exact: true }) })
  .first();
await interactive.scrollIntoViewIfNeeded();
await interactive.getByRole('button', { name: 'Next', exact: true }).click();
await interactive.screenshot({ path: directory + '/graph-interaction-desktop.png' });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(baseURL + '/#/learn/calculus-definite-integrals');
await figure.scrollIntoViewIfNeeded();
await page.screenshot({ path: directory + '/calculus-figure-phone.png' });
await page.goto(baseURL + '/#/learn/probability-statistics-normal-distributions-transformations');
await page.locator('.lesson-intro h1').waitFor();
assert.equal(
  await page.locator('.lesson-intro h1').textContent(),
  'Normal Distributions and Transformations',
);
await page.locator('figure').first().scrollIntoViewIfNeeded();
await page.screenshot({ path: directory + '/probability-figure-phone.png' });
await page.goto(baseURL + '/#/learn/linear-algebra-rank-inverses');
await page.locator('.lesson-intro h1').waitFor();
await page.screenshot({ path: directory + '/linear-algebra-phone.png' });
assert.deepEqual(errors, []);
console.log(
  'React MDX browser checks passed with legacy lesson blocks removed; synthetic API only.',
);
await browser.close();
