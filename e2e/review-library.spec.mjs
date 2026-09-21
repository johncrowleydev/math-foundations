// Real compiled curriculum + Go API, isolated temporary learner database.
// Run after npm run web:build: npx tsx e2e/review-library.spec.mjs
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
const screenshots = join(root, 'output/e2e/review-library');
const temporary = await mkdtemp(join(tmpdir(), 'foundations-review-library-'));
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
      FOUNDATIONS_EMAIL: 'library-test@example.test',
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
    executablePath: process.env.CHROME_BIN,
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  const mutations = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.method() !== 'GET' && new URL(request.url()).pathname.startsWith('/api/v1/review'))
      mutations.push(request.url());
  });
  const login = await context.request.post(baseURL + '/api/v1/auth/login', {
    headers: { Origin: baseURL },
    data: { email: 'library-test@example.test', password },
  });
  assert.equal(login.status(), 200, 'Temporary local account signs in');
  const response = await context.request.get(baseURL + '/api/v1/review/catalog');
  assert.equal(response.status(), 200, 'Real catalog endpoint is available');
  const catalog = await response.json();
  assert.ok(catalog.items.some((item) => item.provenance === 'lesson-exercise'));
  assert.ok(catalog.items.some((item) => item.provenance === 'review-template'));

  // UI assertions are below; API reads above intentionally use no learner history.
  await page.goto(baseURL + '/#/review-library/predicates-and-quantifiers');
  const library = page.locator('.review-library-page');
  const items = library.locator('.review-library-item');
  await library.getByRole('heading', { name: 'Review Library', exact: true }).waitFor();
  await items.first().waitFor();
  const count = library.locator('.library-results-heading [role=status]');
  async function expectCount(expected) {
    await page.waitForFunction(
      (prefix) =>
        document
          .querySelector('.library-results-heading [role=status]')
          ?.textContent?.startsWith(prefix),
      `${expected} of ${catalog.items.length} templates`,
    );
  }
  async function screenshot(name, target = library) {
    await target.scrollIntoViewIfNeeded();
    if (target === library)
      await page.locator('#reader').evaluate((element) => {
        element.scrollTop = 0;
      });
    await page.screenshot({ path: join(screenshots, name + '.png') });
    console.log('Captured ' + name);
  }
  async function filtersOpen() {
    const details = library.locator('.library-filters');
    if (!(await details.evaluate((element) => element.open)))
      await details.locator('summary').click();
  }
  async function clear() {
    const button = library.getByRole('button', { name: 'Clear filters', exact: true });
    if (await button.isEnabled()) await button.click();
    await expectCount(catalog.items.length);
  }
  async function assertNoOverflow() {
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      'No page overflow',
    );
    assert.equal(
      await library.evaluate((element) => element.scrollWidth > element.clientWidth),
      false,
      'No library overflow',
    );
  }
  await expectCount(catalog.items.length);
  assert.ok((await items.count()) <= 40, 'Large catalog list is bounded');
  await screenshot('overview');
  const firstID = await items.first().getAttribute('data-template-id');
  await library.getByRole('button', { name: 'Next templates', exact: true }).click();
  await page.waitForFunction(
    (previous) =>
      document.querySelector('.review-library-item')?.getAttribute('data-template-id') !== previous,
    firstID,
  );
  await library.getByRole('button', { name: 'Previous templates', exact: true }).click();
  assert.equal(
    await items.first().getAttribute('data-template-id'),
    firstID,
    'Catalog pages preserve ordering',
  );

  await filtersOpen();
  await library.getByLabel(/^Quick compatibility/).selectOption('yes');
  await expectCount(catalog.items.filter((item) => item.quick).length);
  await library.getByLabel(/^Provenance/).selectOption('review-template');
  await expectCount(
    catalog.items.filter((item) => item.quick && item.provenance === 'review-template').length,
  );
  await library.getByLabel(/^Skill/).selectOption('recall');
  await library.getByLabel(/^Objective/).selectOption(':present');
  const definitions = catalog.items.filter(
    (item) =>
      item.quick &&
      item.provenance === 'review-template' &&
      item.skill === 'recall' &&
      item.objective,
  );
  await expectCount(definitions.length);
  await library.getByLabel(/^Lesson/).selectOption('predicates-and-quantifiers');
  await library.getByLabel(/^Concept/).selectOption('existential-quantification');
  await expectCount(
    definitions.filter(
      (item) =>
        item.lesson === 'predicates-and-quantifiers' &&
        item.concept === 'existential-quantification',
    ).length,
  );
  await screenshot('filtered');

  const authored = library.locator('[data-template-id="witness-definition-variants"]');
  await authored.locator('summary').click();
  await authored.getByRole('heading', { name: 'Authored variant 2', exact: true }).waitFor();
  assert.ok(await authored.getByText('content/review-templates.json', { exact: true }).isVisible());
  await library.locator('.library-filters summary').click();
  await screenshot('expanded', authored);

  await clear();
  await library.getByLabel('Search catalog', { exact: true }).fill('quantifier order');
  const quantifierItems = catalog.items.filter((item) =>
    [
      item.id,
      item.concept,
      item.skill,
      item.objective,
      item.lesson,
      ...[item.question, ...(item.variants || [])].flatMap((q) => [
        q.instructions,
        q.prompt,
        q.math,
      ]),
    ]
      .join(' ')
      .toLowerCase()
      .replaceAll('-', ' ')
      .includes('quantifier order'),
  );
  await expectCount(quantifierItems.length);
  await library.getByRole('button', { name: 'Coverage', exact: true }).click();
  const tableRows = library.locator('.library-coverage-table tbody tr');
  const groups = new Map();
  for (const item of quantifierItems) {
    const target = [item.concept, item.skill, item.objective].filter(Boolean).join(' × ');
    const group = groups.get(target) || {
      quick: 0,
      recognition: 0,
      production: 0,
      reasoning: 0,
      fixed: 0,
      authored: 0,
      generated: 0,
    };
    group.quick += Number(item.quick);
    group[item.evidenceLevel]++;
    group[item.family]++;
    groups.set(target, group);
  }
  assert.equal(
    await tableRows.count(),
    groups.size,
    'Coverage groups by concept × skill × objective',
  );
  for (const [target, group] of groups) {
    const row = tableRows.filter({ has: page.getByRole('button', { name: target, exact: true }) });
    const actual = (await row.locator('td').allTextContents()).slice(0, 7).map(Number);
    assert.deepEqual(actual, Object.values(group), `Explicit counts for ${target}`);
  }
  await screenshot('coverage');
  await page.setViewportSize({ width: 390, height: 844 });
  await assertNoOverflow();
  const coverageScroll = library.getByRole('region', { name: 'Coverage counts table' });
  assert.ok(
    await coverageScroll.evaluate((element) => element.scrollWidth > element.clientWidth),
    'Wide coverage table scrolls inside its own region',
  );
  await screenshot('mobile-coverage');
  await page.setViewportSize({ width: 1440, height: 1000 });

  // Clicking a target retains the current search and adds the target filters.
  const firstTarget = await tableRows.first().getByRole('button').innerText();
  await tableRows.first().getByRole('button').click();
  await items.first().waitFor();
  assert.equal(
    await library
      .getByRole('button', { name: 'Templates', exact: true })
      .getAttribute('aria-pressed'),
    'true',
  );
  assert.ok((await count.innerText()).includes('1 target'), firstTarget);
  await clear();
  await filtersOpen();
  await library.getByLabel(/^Concept/).selectOption('set-proofs');
  await library.getByLabel(/^Skill/).selectOption('prove');
  await library.getByLabel(/^Evidence level/).selectOption('reasoning');
  const proofs = catalog.items.filter(
    (item) =>
      item.concept === 'set-proofs' && item.skill === 'prove' && item.evidenceLevel === 'reasoning',
  );
  assert.ok(proofs.length > 0);
  await expectCount(proofs.length);
  await library.getByLabel(/^Provenance/).selectOption('review-template');
  await library.getByRole('heading', { name: 'No matching review content', exact: true }).waitFor();
  await clear();

  await library.getByLabel('Search catalog', { exact: true }).fill('integer-witness-selection');
  await expectCount(1);
  const generated = library.locator('[data-template-id="integer-witness-selection"]');
  await generated.locator('summary').click();
  const generator = generated.getByRole('region', { name: 'Generator inspection' });
  await generator.getByLabel('Seed', { exact: true }).fill('library-qa-42');
  const previewURL =
    baseURL + '/api/v1/review/catalog/integer-witness-selection/preview?seed=library-qa-42';
  const expectedPreview = await (await context.request.get(previewURL)).json();
  await generator.getByRole('button', { name: 'Generate sample', exact: true }).click();
  const sample = generator.locator('.library-generated-preview');
  await sample.getByText('library-qa-42', { exact: true }).waitFor();
  assert.ok(await sample.locator('.katex').count(), 'Generated mathematics is rendered');
  assert.equal(
    await sample.locator('.library-choices li').count(),
    expectedPreview.question.choice.options.length,
  );
  assert.equal(await sample.getByText('Correct answer', { exact: true }).count(), 1);
  for (const [key, value] of Object.entries(expectedPreview.parameters)) {
    const parameter = sample
      .locator('.library-parameters > div')
      .filter({ has: page.locator('dt', { hasText: new RegExp('^' + key + '$') }) });
    assert.equal(await parameter.locator('dd').innerText(), String(value));
  }
  const firstSample = await sample.innerText();
  const repeated = page.waitForResponse((result) => result.url() === previewURL);
  await generator.getByRole('button', { name: 'Generate sample', exact: true }).click();
  await repeated;
  await generator.getByRole('button', { name: 'Generate sample', exact: true }).waitFor();
  assert.equal(await sample.innerText(), firstSample, 'Same seed reproduces the sample');
  await screenshot('generated', generator);
  await page.setViewportSize({ width: 390, height: 844 });
  await assertNoOverflow();
  await screenshot('mobile', generator);
  await generator.getByRole('button', { name: 'Generate another sample', exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('.library-generated-preview code')?.textContent !== 'library-qa-42',
  );
  assert.notEqual(
    await generator.getByLabel('Seed', { exact: true }).inputValue(),
    'library-qa-42',
  );
  await page.setViewportSize({ width: 1440, height: 1000 });

  await clear();
  await library.getByRole('button', { name: 'Definition objectives', exact: true }).click();
  await expectCount(
    catalog.items.filter((item) => item.skill === 'recall' && item.objective).length,
  );
  await clear();
  const reused = catalog.items.find((item) =>
    item.originalExercise?.startsWith('predicates-and-quantifiers-'),
  );
  await library.getByLabel('Search catalog', { exact: true }).fill(reused.id);
  await expectCount(1);
  await items.first().locator('summary').click();
  await items.first().getByRole('link', { name: 'Open original lesson exercise' }).click();
  await page.waitForURL(
    '**/#/practice/' +
      reused.lesson +
      '/' +
      reused.originalExercise.slice(reused.lesson.length + 1),
  );
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await page.getByRole('link', { name: 'Review Library', exact: true }).click();
  await items.first().waitFor();

  // Audit every dedicated template through the effective Library, not just its source file.
  const authoredSource = JSON.parse(await readFile(join(root, 'content/review-templates.json')));
  const contentScreenshots = join(root, 'output/e2e/review-content');
  const auditDirectory = join(root, 'output/e2e/review-audit-after');
  await mkdir(contentScreenshots, { recursive: true });
  await mkdir(auditDirectory, { recursive: true });
  await writeFile(join(auditDirectory, 'catalog.json'), JSON.stringify(catalog, null, 2));
  async function contentScreenshot(name, target) {
    // The reader is a scroll container: a tall locator screenshot otherwise
    // captures blank pixels below its clipped viewport. Fit the whole example.
    const viewport = page.viewportSize();
    const bounds = await target.boundingBox();
    await page.setViewportSize({
      width: viewport.width,
      height: Math.max(viewport.height, Math.ceil(bounds.height) + 200),
    });
    await target.screenshot({ path: join(contentScreenshots, name + '.png') });
    await page.setViewportSize(viewport);
  }
  const contentExamples = new Set();
  const manualConcepts = new Set([
    'implication',
    'contrapositive',
    'quantifier-negation',
    'quantifier-order',
    'existential-quantification',
    'universal-quantification',
    'predicate-evaluation',
  ]);
  for (const source of authoredSource) {
    const item = catalog.items.find((item) => item.id === source.id);
    assert.ok(item, `${source.id} remains eligible in the effective catalog`);
    await clear();
    await library.getByLabel('Search catalog', { exact: true }).fill(item.id);
    const rendered = library.locator(`[data-template-id="${item.id}"]`);
    await rendered.locator('summary').click();
    await rendered.locator('.library-item-body').waitFor();
    assert.equal(
      await rendered.getByRole('heading', { name: /^Authored variant / }).count(),
      source.variants?.length || 0,
      `${item.id}: every authored variant is inspectable`,
    );
    assert.equal(await rendered.locator('.katex-error').count(), 0, item.id);
    const sourceDetails = rendered.locator('.content-sources');
    assert.equal(await sourceDetails.count(), 1, `${item.id}: source support is published`);
    assert.equal(await sourceDetails.evaluate((element) => element.open), false);
    assert.equal(await rendered.locator('.library-choices .content-sources').count(), 0);
    if (
      item.quick &&
      !item.generated &&
      item.question.choice &&
      manualConcepts.delete(item.concept)
    ) {
      await rendered
        .locator('.library-question-section')
        .first()
        .screenshot({
          path: join(auditDirectory, item.concept + '.png'),
        });
    }

    let example;
    if (item.concept === 'propositions' && item.skill === 'recall') example = 'logic-definition';
    if (item.concept === 'conditional-forms' && item.variantCount >= 3)
      example = 'conditional-variants';
    if (item.concept === 'variable-scope' && item.skill === 'recall') example = 'scope-definition';
    if (item.generator && item.generator !== 'integer-witness-sum') {
      const generator = rendered.getByRole('region', { name: 'Generator inspection' });
      await generator.getByLabel('Seed', { exact: true }).fill('content-audit-42');
      await generator.getByRole('button', { name: 'Generate sample', exact: true }).click();
      const preview = generator.locator('.library-generated-preview');
      await preview.getByText('content-audit-42', { exact: true }).waitFor();
      assert.equal(await preview.locator('.katex-error').count(), 0);
      assert.ok(!(await preview.innerText()).includes('{{'));
      await contentScreenshot(item.generator, generator);
    }
    if (example && !contentExamples.has(example)) {
      contentExamples.add(example);
      await contentScreenshot(example, rendered);
    }
  }
  const coverageAudit = {};
  for (const lesson of [...new Set(catalog.items.map((item) => item.lesson))].sort()) {
    await clear();
    await filtersOpen();
    await library.getByLabel(/^Lesson/).selectOption(lesson);
    await expectCount(catalog.items.filter((item) => item.lesson === lesson).length);
    await library.getByRole('button', { name: 'Coverage', exact: true }).click();
    const rows = library.locator('.library-coverage-table tbody tr');
    coverageAudit[lesson] = {
      count: await count.innerText(),
      rows: await rows.allTextContents(),
    };
    const expectedTargets = new Set(
      catalog.items
        .filter((item) => item.lesson === lesson)
        .map((item) => JSON.stringify([item.concept, item.skill, item.objective || ''])),
    );
    assert.equal(
      await rows.count(),
      expectedTargets.size,
      `${lesson}: every effective target is grouped`,
    );
    if (['propositional-logic', 'predicates-and-quantifiers'].includes(lesson)) {
      await library
        .getByLabel(/^Concept/)
        .selectOption(lesson === 'propositional-logic' ? 'implication' : 'quantifier-order');
      await library.locator('.library-filters summary').click();
      await contentScreenshot(lesson + '-coverage', library.locator('.library-coverage'));
    }
  }
  await writeFile(join(auditDirectory, 'coverage.json'), JSON.stringify(coverageAudit, null, 2));
  await clear();
  await library.getByRole('button', { name: 'Templates', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  // Inspect long symbolic variants at phone width as well as desktop.
  for (const concept of ['quantifier-negation', 'variable-scope', 'conditional-forms']) {
    const item = catalog.items.find(
      (item) => item.provenance === 'review-template' && item.concept === concept && item.quick,
    );
    assert.ok(item, `${concept} has a dedicated Quick representation`);
    await library.getByLabel('Search catalog', { exact: true }).fill(item.id);
    const rendered = library.locator(`[data-template-id="${item.id}"]`);
    await rendered.locator('summary').click();
    await rendered.locator('.library-item-body').waitFor();
    await assertNoOverflow();
    assert.equal(
      await rendered.evaluate((element) => element.scrollWidth > element.clientWidth),
      false,
      `${concept}: phone content stays within the item`,
    );
    if (concept === 'variable-scope') {
      await contentScreenshot(
        'scope-mobile',
        rendered.locator('.library-question-section').first(),
      );
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await clear();

  // A moved lesson keeps historical exercise keys, but filters and navigation use its current slug.
  const curriculumScreenshots = join(root, 'output/e2e/review-coverage');
  await mkdir(curriculumScreenshots, { recursive: true });
  for (const lesson of ['linear-algebra-rank-inverses', 'linear-algebra-least-squares']) {
    await page.goto(baseURL + '/#/review-library/' + lesson);
    await items.first().waitFor();
    const example = catalog.items.find((item) => item.lesson === lesson && item.originalExercise);
    assert.ok(example, `${lesson}: relocated exercises remain in the effective pool`);
    await clear();
    await filtersOpen();
    await library.getByLabel(/^Lesson/).selectOption(lesson);
    await expectCount(catalog.items.filter((item) => item.lesson === lesson).length);
    await library.getByLabel('Search catalog', { exact: true }).fill(example.id);
    await library.getByRole('button', { name: 'Templates', exact: true }).click();
    const rendered = library.locator(`[data-template-id="${example.id}"]`);
    await rendered.locator('summary').click();
    const link = rendered.getByRole('link', { name: 'Open original lesson exercise' });
    assert.equal(
      await link.getAttribute('href'),
      `#/practice/${lesson}/${example.originalExercise.split('-').at(-1)}`,
    );
    await library.locator('.library-filters summary').click();
    await link.scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(curriculumScreenshots, lesson + '-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoOverflow();
    await link.scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(curriculumScreenshots, lesson + '-phone.png') });
    await link.click();
    await page.waitForURL(`**/#/practice/${lesson}/${example.originalExercise.split('-').at(-1)}`);
    await page.goto(baseURL + '/#/review-library/' + lesson);
    await items.first().waitFor();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }

  await page.route('**/api/v1/review/catalog', (route) =>
    route.fulfill({ status: 503, body: 'Catalog unavailable' }),
  );
  await page.reload();
  await library.getByRole('alert').waitFor();
  await page.unroute('**/api/v1/review/catalog');
  await library.getByRole('button', { name: 'Retry catalog', exact: true }).click();
  await items.first().waitFor();
  await page.route('**/api/v1/review/catalog', (route) =>
    route.fulfill({ json: { contentVersion: 'empty-test', items: [] } }),
  );
  await page.reload();
  await library
    .getByRole('heading', { name: 'No effective review content', exact: true })
    .waitFor();

  const reviewRecords = run('python3', [
    '-c',
    "import sqlite3,sys; db=sqlite3.connect(sys.argv[1]); print(db.execute(\"select count(*) from records where key like 'review-%'\").fetchone()[0]); print(db.execute('select count(*) from attempts').fetchone()[0])",
    join(temporary, 'data/notebook.db'),
  ]);
  assert.equal(
    reviewRecords,
    '0\n0',
    'Library and samples leave learner review records and attempts empty',
  );

  assert.deepEqual(mutations, [], 'Library never mutates review runtime state');
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log(`Review Library checked against ${catalog.items.length} real effective templates.`);
} finally {
  if (browser) await browser.close();
  for (const child of children.reverse()) {
    if (child.exitCode !== null) continue;
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    await exited;
  }
  await rm(temporary, { recursive: true, force: true });
}
