import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Browser, Page } from 'playwright';

export const root = fileURLToPath(new URL('../../', import.meta.url));

async function stop(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill('SIGTERM');
  await exited;
}

// These checks use Vite's source modules to seed isolated browser state. MDX and
// retry-grading select the production preview instead. API traffic is mocked.
export async function withBrowser(
  name: string,
  check: (test: {
    page: Page;
    browser: Browser;
    baseURL: string;
    directory: string;
  }) => Promise<unknown>,
  mode: 'dev' | 'preview' = 'dev',
) {
  const listener = createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const address = listener.address();
  if (!address || typeof address === 'string') throw Error('No local test port');
  const port = address.port;
  await new Promise<void>((resolve, reject) =>
    listener.close((error) => (error ? reject(error) : resolve())),
  );
  const baseURL = `http://127.0.0.1:${port}`;
  const directory = join(root, 'output/e2e', name);
  await mkdir(directory, { recursive: true });
  const vite = spawn(
    process.execPath,
    [
      join(root, 'web/node_modules/vite/bin/vite.js'),
      ...(mode === 'preview' ? ['preview'] : []),
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      cwd: join(root, 'web'),
      stdio: 'ignore',
      env: { ...process.env, FOUNDATIONS_API_TARGET: 'http://127.0.0.1:9' },
    },
  );
  let browser: Browser | undefined;
  try {
    const deadline = Date.now() + 30_000;
    for (;;) {
      if (vite.exitCode !== null) throw Error(`Local Vite exited (${vite.exitCode})`);
      try {
        const response = await fetch(baseURL);
        if (response.ok) break;
      } catch {
        /* Wait for the loopback listener. */
      }
      if (Date.now() >= deadline) throw Error('Local Vite did not become ready');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const { chromium }: typeof import('playwright') = await import(
      process.env.PLAYWRIGHT_MODULE || 'playwright'
    );
    browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20_000);
    try {
      await check({ page, browser, baseURL, directory });
    } catch (error) {
      await page
        .screenshot({ path: join(directory, 'failure.png'), fullPage: true })
        .catch(() => {});
      throw error;
    }
  } finally {
    await browser?.close();
    await stop(vite);
  }
}
