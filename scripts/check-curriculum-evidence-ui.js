async (page) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        route.request().url().includes('/auth/session')
          ? { email: 'synthetic@example.test', expires: Date.now() + 86400000 }
          : { records: [], attempts: [], cursor: 0, more: false },
      ),
    }),
  );
  await page.goto('http://127.0.0.1:5175/#/progress/predicates-and-quantifiers');
  await page.reload();
  await page.getByRole('heading', { name: 'Progress', exact: true }).waitFor();
  await page.evaluate(async () => {
    const store = await import('/src/storage.ts');
    const { snapshot } = await import('/src/evidenceTypes.ts');
    await store.clearLocalWork();
    const catalog = await (await fetch('/learning-evidence.json')).json();
    let i = 0;
    for (const [exercise, v] of [
      ['predicates-and-quantifiers-11', 'incorrect'],
      ['predicates-and-quantifiers-11', 'correct'],
      ['predicates-and-quantifiers-13', 'incorrect'],
      ['predicates-and-quantifiers-14', 'correct'],
      ['linear-algebra-span-17', 'correct'],
      ['linear-algebra-span-66', 'correct'],
    ]) {
      i++;
      await store.put('attempts', 'coverage-' + i, {
        id: 'coverage-' + i,
        exercise,
        submitted: Date.UTC(2026, 8, 14, 12, i),
        contentVersion: 'fixture',
        mode: 'type',
        text: 'Synthetic response for layout testing.',
        images: [],
        revealed: false,
        status: 'graded',
        verdict: v,
        analytics: snapshot(catalog, exercise),
        grades: [
          {
            verdict: v,
            at: Date.UTC(2026, 8, 14, 12, i),
            feedback: 'Synthetic feedback.',
            diagnosis:
              v === 'incorrect'
                ? [{ class: 'conceptual', severity: 'substantive', tags: ['synthetic-boundary'] }]
                : [],
          },
        ],
      });
    }
  });
  await page.reload();
  await page.getByText('4 of 4 submissions have concept snapshots.', { exact: false }).waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('heading', { name: 'Progress', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/screenshots/learning-evidence/all-lessons-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'docs/screenshots/learning-evidence/all-lessons-phone.png' });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw Error('Phone overflow');
  await page.getByRole('button', { name: 'Universal quantification', exact: true }).first().click();
  await page.getByRole('heading', { name: 'Concept × skill coverage' }).waitFor();
  await page.screenshot({ path: 'docs/screenshots/learning-evidence/all-lessons-detail.png' });
  await page.goto('http://127.0.0.1:5175/#/progress/linear-algebra-span');
  await page.getByText('2 of 2 submissions have concept snapshots.', { exact: false }).waitFor();
  await page
    .getByRole('button', { name: 'Linear independence and redundancy', exact: true })
    .click();
  await page.getByRole('heading', { name: 'Concept × skill coverage' }).waitFor();
  if (
    (await page
      .locator('#concept-detail')
      .getByRole('rowheader', { name: 'construct', exact: true })
      .count()) !== 1
  )
    throw Error('Construct evidence missing');
  if (
    (await page
      .locator('#concept-detail')
      .getByRole('rowheader', { name: 'prove', exact: true })
      .count()) !== 1
  )
    throw Error('Proof evidence missing');
  await page.screenshot({ path: 'docs/screenshots/learning-evidence/linear-algebra-detail.png' });
  await page.evaluate(async () => {
    const s = await import('/src/storage.ts');
    for (const a of await s.all('attempts')) {
      delete a.analytics;
      await s.put('attempts', a.id, a);
    }
  });
  await page.reload();
  await page.getByText('Concept evidence is incomplete:', { exact: false }).waitFor();
  if (
    await page
      .getByText('No repeated patterns meet the attention rules yet.', { exact: false })
      .count()
  )
    throw Error('Missing coverage presented as no trouble');
  await page.getByRole('heading', { name: 'Progress', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/screenshots/learning-evidence/missing-coverage.png' });
  return 'Lesson 2 and linear algebra evidence, skill drill-down, missing metadata and phone overflow verified; all API traffic mocked.';
}
