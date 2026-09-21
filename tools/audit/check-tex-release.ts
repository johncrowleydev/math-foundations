import { inspectTexTeaching } from './tex-teaching.js';
const failures = await inspectTexTeaching(true);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
