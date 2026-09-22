import { spawn } from 'node:child_process';
import { access, mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './support/browser.ts';
import { runWithWorkers, selectShard } from './support/workers.ts';

for (const file of [
  'web/dist/index.html',
  'web/public/notebook.json',
  'output/grading-catalog.json',
]) {
  await access(join(root, file)).catch(() => {
    throw Error(`Missing ${file}. Run npm run web:build before npm run test:e2e.`);
  });
}
const names = process.argv.slice(2);
const available = (await readdir(join(root, 'e2e')))
  .filter((file) => /\.spec\.(ts|mjs)$/.test(file))
  .sort();
const candidates = available.filter(
  (file) => names.length === 0 || names.includes(file.replace(/\.spec\.(ts|mjs)$/, '')),
);
// Start the longest checks first. With production React the catalog-wide checks
// dominate, so put them on opposite shards before the shorter Review checks.
const longest = [
  'review-library',
  'deterministic',
  'offline',
  'review-submission',
  'sources',
  'revise-failed-grading',
  'grading-toasts',
  'review',
];
const priority = (file: string) => {
  const index = longest.indexOf(file.replace(/\.spec\.(ts|mjs)$/, ''));
  return index === -1 ? longest.length : index;
};
candidates.sort((left, right) => priority(left) - priority(right) || left.localeCompare(right));
for (const name of names) {
  if (!available.some((file) => file.replace(/\.spec\.(ts|mjs)$/, '') === name)) {
    throw Error(
      `Unknown E2E check: ${name}. Available: ${available.map((file) => file.replace(/\.spec\.(ts|mjs)$/, '')).join(', ')}`,
    );
  }
}
const shard = process.env.E2E_SHARD;
const selected = selectShard(candidates, shard);
const failures: string[] = [];
const timings = new Map<string, number>();
const workers = Number(process.env.E2E_WORKERS || 2);
const started = performance.now();
console.log(
  `E2E: running ${selected.length} specs with ${workers} workers${shard ? ` (shard ${shard})` : ''}`,
);
const results = await runWithWorkers(selected, workers, async (file) => {
  const specStarted = performance.now();
  console.log(`\nRunning ${file}`);
  try {
    const status = await new Promise<number | null>((resolve, reject) => {
      const child = spawn(process.execPath, ['--import', 'tsx', join(root, 'e2e', file)], {
        cwd: root,
        stdio: 'inherit',
        // Browser contexts, listener ports, API databases, and screenshots are
        // already isolated per spec. Vite's writable dependency cache must be too.
        env: {
          ...process.env,
          // Match the shipped React runtime while retaining Vite source imports
          // for fixture setup. Development JSX diagnostics dominate these checks.
          NODE_ENV: 'production',
          FOUNDATIONS_VITE_CACHE_DIR: join(root, 'output/e2e/.vite', file),
        },
      });
      child.once('error', reject);
      child.once('exit', resolve);
    });
    if (status !== 0) throw Error(`${file} exited with status ${status}`);
  } finally {
    const durationSeconds = (performance.now() - specStarted) / 1000;
    timings.set(file, durationSeconds);
    console.log(`Finished ${file} in ${durationSeconds.toFixed(1)}s`);
  }
});
for (const [index, result] of results.entries()) {
  if (result.status === 'rejected') {
    failures.push(selected[index]);
    console.error(result.reason);
  }
}
const durationSeconds = (performance.now() - started) / 1000;
await mkdir(join(root, 'output/e2e'), { recursive: true });
await writeFile(
  join(root, 'output/e2e/timings.json'),
  JSON.stringify(
    {
      workers,
      ...(shard ? { shard } : {}),
      durationSeconds,
      specs: results.map((result, index) => ({
        spec: selected[index],
        durationSeconds: timings.get(selected[index]),
        passed: result.status === 'fulfilled',
        ...(result.status === 'rejected' ? { error: String(result.reason) } : {}),
      })),
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `\nE2E: ${selected.length - failures.length}/${selected.length} passed in ${durationSeconds.toFixed(1)}s. Artifacts: output/e2e/`,
);
if (failures.length) {
  console.error(`Failed: ${failures.join(', ')}`);
  process.exitCode = 1;
}
