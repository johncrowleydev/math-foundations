import { mkdir, copyFile } from 'node:fs/promises';
await mkdir(new URL('./public/', import.meta.url), { recursive: true });
for (const name of ['notebook', 'teaching', 'tex-syntax', 'tex-teaching', 'grading-version'])
  await copyFile(
    new URL('../output/content/' + name + '.json', import.meta.url),
    new URL('./public/' + name + '.json', import.meta.url),
  );
