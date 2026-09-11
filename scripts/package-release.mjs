import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const texAudit = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/check-tex-release.ts'], {
  stdio: 'inherit',
});
if (texAudit.error || texAudit.status !== 0)
  throw new Error('The TeX teaching audit is incomplete or stale; do not publish this edition.');

const properties = Object.fromEntries(
  readFileSync('version.properties', 'utf8')
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split('=')),
);
const code = Number(properties.code);
const version = properties.name;
if (!Number.isSafeInteger(code) || code < 1 || !/^\d+\.\d+\.\d+$/.test(version))
  throw new Error('Invalid version.properties');
if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== `v${version}`)
  throw new Error('Tag must match version.properties');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
const java = process.env.JAVA_HOME
  ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
  : 'java';
const signer = join(sdk, 'build-tools', '36.0.0', 'lib', 'apksigner.jar');
for (const key of ['FOUNDATIONS_KEYSTORE', 'FOUNDATIONS_PASSWORD', 'FOUNDATIONS_LINEAGE']) {
  if (!process.env[key]) throw new Error(`Missing ${key}`);
}
mkdirSync('output/release', { recursive: true });
const apk = 'output/release/foundations.apk';
copyFileSync('android/app/build/outputs/apk/release/app-release-unsigned.apk', apk);
function run(args) {
  const result = spawnSync(java, ['-jar', signer, ...args], { stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error('APK signing/verification failed');
}
run([
  'sign',
  '--ks',
  process.env.FOUNDATIONS_KEYSTORE,
  '--ks-key-alias',
  'foundations',
  '--ks-pass',
  'env:FOUNDATIONS_PASSWORD',
  '--lineage',
  process.env.FOUNDATIONS_LINEAGE,
  '--rotation-min-sdk-version',
  '33',
  '--v1-signing-enabled',
  'false',
  '--v2-signing-enabled',
  'false',
  '--v4-signing-enabled',
  'false',
  apk,
]);
run(['verify', '--verbose', '--print-certs', apk]);
const bytes = readFileSync(apk);
const sha256 = createHash('sha256').update(bytes).digest('hex');
writeFileSync(
  'output/release/update.json',
  JSON.stringify(
    {
      versionCode: code,
      versionName: version,
      url: `https://github.com/johncrowleydev/math-foundations/releases/download/v${version}/foundations.apk`,
      sha256,
      size: bytes.length,
    },
    null,
    2,
  ) + '\n',
);
writeFileSync('output/release/SHA256SUMS', `${sha256}  foundations.apk\n`);
console.log(`Packaged Foundations ${version} (versionCode ${code})`);
