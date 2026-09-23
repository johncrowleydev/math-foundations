import assert from 'node:assert/strict';
import type { Page } from 'playwright';
import { withBrowser } from './support/browser.ts';

const preferenceKey = 'preference/review-budget-minutes';
type Mutation = {
  id: string;
  key: string;
  payload: Record<string, unknown>;
  device: string;
  ifAbsent?: boolean;
};
type SavedRecord = Omit<Mutation, 'ifAbsent'> & {
  revision: number;
  updated: number;
  versions: unknown[];
  conflicts: string[];
};

await withBrowser('review-target-sync', async ({ browser, baseURL, directory }) => {
  const errors: string[] = [];
  const summary = {
    due: 0,
    quick: 0,
    deeper: 0,
    estimatedMinutes: 0,
    plannedQuick: 0,
    plannedApplication: 0,
    plannedDeep: 0,
    targets: [],
    concepts: [],
    skills: [],
    lessons: [],
  };
  function account() {
    return {
      records: new Map<string, SavedRecord>(),
      operations: new Set<string>(),
      mutations: [] as Mutation[],
      cursor: 0,
    };
  }
  async function device(shared: ReturnType<typeof account>, phone = false, legacy?: string) {
    const context = await browser.newContext({
      viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
      serviceWorkers: 'block',
    });
    if (legacy !== undefined)
      await context.addInitScript((value) => {
        if (!sessionStorage.getItem('synthetic-legacy-seeded')) {
          localStorage.setItem('review-budget-minutes', value);
          sessionStorage.setItem('synthetic-legacy-seeded', '1');
        }
      }, legacy);
    const state = { offline: false, budgets: [] as number[], writes: [] as Mutation[] };
    await context.route('**/api/**', async (route) => {
      if (state.offline) return route.abort('internetdisconnected');
      const request = route.request();
      const url = new URL(request.url());
      let body: unknown = { records: [], cursor: shared.cursor, more: false, attempts: [] };
      if (url.pathname.endsWith('/auth/session'))
        body = { email: 'target-sync@example.test', expires: Date.now() + 86_400_000 };
      else if (url.pathname.endsWith('/review')) {
        state.budgets.push(Number(url.searchParams.get('budgetMinutes')));
        body = summary;
      } else if (url.pathname.endsWith('/mutations')) {
        const mutation = request.postDataJSON() as Mutation;
        state.writes.push(mutation);
        const old = shared.records.get(mutation.key);
        if (!shared.operations.has(mutation.id)) {
          shared.operations.add(mutation.id);
          shared.mutations.push(mutation);
          if (!(mutation.ifAbsent && old)) {
            shared.records.set(mutation.key, {
              key: mutation.key,
              id: mutation.id,
              payload: mutation.payload,
              device: mutation.device,
              revision: ++shared.cursor,
              updated: Date.now(),
              versions: [],
              conflicts: [],
            });
          }
        }
        body = shared.records.get(mutation.key);
      } else if (url.pathname.endsWith('/changes')) {
        const after = Number(url.searchParams.get('after'));
        body = {
          records: [...shared.records.values()].filter((record) => record.revision > after),
          cursor: shared.cursor,
          more: false,
        };
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(baseURL + '/#/review/sets-and-set-operations');
    await page.getByLabel('Daily review target').waitFor();
    return { context, page, state };
  }
  async function target(page: Page, value: number) {
    await page.waitForFunction(
      (expected) =>
        document.querySelector<HTMLSelectElement>('.review-budget select')?.value ===
        String(expected),
      value,
    );
  }
  async function synced(page: Page) {
    await page.waitForFunction(async () => {
      const { all } = await import(String('/src/storage.ts'));
      const { initialSyncComplete, syncStatus } = await import(String('/src/sync.ts'));
      return initialSyncComplete && syncStatus === 'Up to date' && !(await all('outbox')).length;
    });
  }
  async function queued(page: Page, value: number) {
    await page.waitForFunction(
      async ({ key, expected }) => {
        const { all } = await import(String('/src/storage.ts'));
        const outgoing = await all('outbox');
        return outgoing.some(
          (operation: { kind: string; data: Mutation }) =>
            operation.kind === 'mutation' &&
            operation.data.key === key &&
            operation.data.payload.value === expected,
        );
      },
      { key: preferenceKey, expected: value },
    );
  }
  async function summaryBudget(current: Awaited<ReturnType<typeof device>>, value: number) {
    if (current.state.budgets.at(-1) !== value)
      await current.page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname.endsWith('/review') &&
          url.searchParams.get('budgetMinutes') === String(value)
        );
      });
    assert.equal(current.state.budgets.at(-1), value);
  }

  const shared = account();
  const desktop = await device(shared);
  let phone = await device(shared, true, '25');
  await Promise.all([synced(desktop.page), synced(phone.page)]);
  await Promise.all([target(desktop.page, 25), target(phone.page, 25)]);
  assert.equal(shared.records.has(preferenceKey), false, 'Defaults do not publish a preference');
  assert.equal(shared.mutations.filter((item) => item.key === preferenceKey).length, 0);

  // Leave Review mounted on the phone: its ordinary change-feed poll must update
  // both the visible selection and the budget used for its next summary request.
  await desktop.page.getByLabel('Daily review target').selectOption('60');
  await target(phone.page, 60);
  await Promise.all([synced(desktop.page), synced(phone.page)]);
  assert.equal(shared.records.get(preferenceKey)?.payload.value, 60);
  await Promise.all([summaryBudget(phone, 60), summaryBudget(desktop, 60)]);
  await desktop.page.screenshot({ path: directory + '/target60-desktop.png' });
  await phone.page.screenshot({ path: directory + '/target60-phone.png' });
  assert.equal(
    await phone.page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );

  // An explicit choice of the default is an account edit, unlike an untouched
  // browser's legacy/default value.
  await phone.page.getByLabel('Daily review target').selectOption('25');
  await target(desktop.page, 25);
  await Promise.all([synced(desktop.page), synced(phone.page)]);
  assert.equal(shared.records.get(preferenceKey)?.payload.value, 25);
  await summaryBudget(desktop, 25);
  assert.ok(
    phone.state.writes.some(
      (item) => item.key === preferenceKey && item.payload.value === 25 && !item.ifAbsent,
    ),
  );

  // Keep app assets available while the account API is offline so reload tests
  // durable browser state independently of the service worker's asset cache.
  phone.state.offline = true;
  await phone.page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await phone.page.getByLabel('Daily review target').selectOption('45');
  await queued(phone.page, 45);
  assert.equal(shared.records.get(preferenceKey)?.payload.value, 25);
  await phone.page.reload();
  await target(phone.page, 45);
  await queued(phone.page, 45);
  phone.state.offline = false;
  await phone.page.evaluate(() => window.dispatchEvent(new Event('online')));
  await target(desktop.page, 45);
  await Promise.all([synced(desktop.page), synced(phone.page)]);
  assert.equal(shared.records.get(preferenceKey)?.payload.value, 45);
  await summaryBudget(desktop, 45);
  await target(phone.page, 45);

  await desktop.page.getByLabel('Daily review target').selectOption('60');
  await target(phone.page, 60);
  await Promise.all([synced(desktop.page), synced(phone.page)]);
  await phone.context.close();
  // A newly opened phone with either a stale default or a stale chosen target
  // must adopt the existing account value without replacing it during migration.
  for (const legacy of ['25', '15']) {
    phone = await device(shared, true, legacy);
    await target(phone.page, 60);
    await synced(phone.page);
    assert.equal(shared.records.get(preferenceKey)?.payload.value, 60);
    assert.ok(
      phone.state.writes
        .filter((item) => item.key === preferenceKey)
        .every((item) => item.ifAbsent),
      'A legacy value can only be uploaded with create-only semantics',
    );
    await phone.context.close();
  }
  await desktop.context.close();

  // Preserve the user's existing 60-minute choice when upgrading an account
  // that has no synced target yet, then propagate it to a default phone.
  const legacyAccount = account();
  const legacyDesktop = await device(legacyAccount, false, '60');
  const legacyPhone = await device(legacyAccount, true, '25');
  await target(legacyPhone.page, 60);
  await Promise.all([synced(legacyDesktop.page), synced(legacyPhone.page)]);
  assert.equal(legacyAccount.records.get(preferenceKey)?.payload.value, 60);
  const migrated = legacyAccount.mutations.filter((item) => item.key === preferenceKey);
  assert.equal(migrated.length, 1, 'The legacy target is migrated exactly once');
  assert.equal(migrated[0].ifAbsent, true);
  await legacyDesktop.page.reload();
  await target(legacyDesktop.page, 60);
  await synced(legacyDesktop.page);
  assert.equal(
    legacyAccount.mutations.filter((item) => item.key === preferenceKey).length,
    1,
    'Reload does not repeat migration',
  );
  await Promise.all([legacyDesktop.context.close(), legacyPhone.context.close()]);
  assert.deepEqual(errors, []);
  console.log(
    'Review target sync passed: mounted desktop/phone updates, explicit default, offline reload/reconnect, safe legacy migration, and desktop/phone screenshots.',
  );
});
