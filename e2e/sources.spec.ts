import { withBrowser } from './support/browser.ts';

await withBrowser('sources', async ({ page, baseURL, directory }) => {
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
  await page.goto(baseURL + '/#/read/propositional-logic');
  await page.reload();
  await page.getByRole('heading', { name: 'Propositional Logic', exact: true }).waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  const section = page.locator('#section-implication-if-then');
  await section.scrollIntoViewIfNeeded();
  const sources = section.locator('.teaching > .content-sources');
  if ((await sources.getAttribute('open')) !== null) throw Error('Sources should start collapsed');
  await sources.locator('summary').scrollIntoViewIfNeeded();
  await page.screenshot({ path: directory + '/desktop-collapsed.png' });
  await sources.locator('summary').click();
  await sources.scrollIntoViewIfNeeded();
  if (!(await sources.getByRole('link', { name: /Book of Proof/ }).count()))
    throw Error('Missing pinpoint source');
  await page.screenshot({ path: directory + '/desktop-open.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await sources.scrollIntoViewIfNeeded();
  await page.screenshot({ path: directory + '/phone-open.png' });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
    throw Error('Phone overflow');
  await page.goto(baseURL + '/#/practice/propositional-logic/1');
  const reveal = page
    .locator('article:visible > details > summary')
    .filter({ hasText: /^Reveal answer$/ });
  if ((await reveal.locator('..').getAttribute('open')) === null) await reveal.click();
  const answerSources = page.locator('article:visible .content-sources');
  await answerSources.locator('summary').click();
  await answerSources.scrollIntoViewIfNeeded();
  await page.screenshot({ path: directory + '/exercise-phone.png' });
  await page.context().setOffline(true);
  await answerSources.locator('summary').click();
  await answerSources.locator('summary').click();
  if (!(await answerSources.getByRole('link').count())) throw Error('Offline bibliography missing');
  await page.context().setOffline(false);
  await page.goto(baseURL + '/#/read/linear-algebra-svd');
  await page.setViewportSize({ width: 1440, height: 1000 });
  const svd = page.locator(
    '#section-approximation-and-responsible-interpretation .teaching > .content-sources',
  );
  await svd.locator('summary').click();
  await svd.scrollIntoViewIfNeeded();
  await page.screenshot({ path: directory + '/svd-desktop.png' });
  await page.goto(baseURL + '/#/practice/propositional-logic/1');
  await page
    .locator('article:visible')
    .getByRole('button', { name: 'proposition', exact: true })
    .click();
  await page.getByRole('button', { name: 'Full explanation', exact: false }).click();
  const glossary = page.locator('.reference-entry .content-sources');
  await glossary.locator('summary').focus();
  await page.keyboard.press('Enter');
  if ((await glossary.getAttribute('open')) === null) throw Error('Keyboard disclosure failed');
  await page.screenshot({ path: directory + '/reference-desktop.png' });
  await page.goto(baseURL + '/#/read/graph-theory');
  await page.reload();
  const figure = page.locator('figure').first();
  await figure.getByText('About this figure', { exact: true }).click();
  await figure.locator('.content-sources > summary').click();
  await figure.locator('.content-sources').scrollIntoViewIfNeeded();
  await page.screenshot({ path: directory + '/figure-desktop.png' });
  console.log('Source disclosure, exercise, SVD, phone/desktop, and offline detail checks passed.');
});
