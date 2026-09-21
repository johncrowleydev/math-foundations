import { spawn } from 'node:child_process';
import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from './support/browser.ts';

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
const selected = available.filter(
  (file) => names.length === 0 || names.includes(file.replace(/\.spec\.(ts|mjs)$/, '')),
);
for (const name of names) {
  if (!available.some((file) => file.replace(/\.spec\.(ts|mjs)$/, '') === name)) {
    throw Error(
      `Unknown E2E check: ${name}. Available: ${available.map((file) => file.replace(/\.spec\.(ts|mjs)$/, '')).join(', ')}`,
    );
  }
}
const failures: string[] = [];
for (const file of selected) {
  console.log(`\nRunning ${file}`);
  const status = await new Promise<number | null>((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', 'tsx', join(root, 'e2e', file)], {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    });
    child.once('error', reject);
    child.once('exit', resolve);
  });
  if (status !== 0) failures.push(file);
}
console.log(
  `\nE2E: ${selected.length - failures.length}/${selected.length} passed. Artifacts: output/e2e/`,
);
if (failures.length) {
  console.error(`Failed: ${failures.join(', ')}`);
  process.exitCode = 1;
}
