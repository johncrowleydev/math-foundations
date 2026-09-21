import { readdir, readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const executable = /\.(?:[cm]?[jt]sx?|py|go|sh|bash|rb|pl|lua|rs|c|cpp|java|cs)$/i;
const ignoredDirectories = new Set(['.git', 'node_modules', 'output', 'dist', '__pycache__']);
const testFile = /(?:\.(?:test|spec)\.[^.]+|_test\.(?:go|py)|\/check-[^/]+-ui\.[cm]?js)$/;

/**
 * These checks enforce source locations and catch recognizable authoring patterns.
 * They are deliberately not a claim to prove arbitrary program semantics. CI also
 * checks that the actual build/test workflow leaves content/ unchanged. Synthetic
 * test fixtures are allowed in test files; they must never become build inputs.
 */
export function inspectCurriculumFile(path: string, source: string): string[] {
  const errors: string[] = [];
  const report = (message: string) => errors.push(`${path}: ${message}`);
  if (path.startsWith('scripts/authoring/')) {
    report('scripts/authoring is retired; move declarative curriculum into content/.');
    return errors;
  }
  if (path.startsWith('content/')) {
    if (path.startsWith('content/lessons/')) {
      if (extname(path) !== '.mdx') report('canonical lessons must be MDX documents.');
    } else if (!['.json', '.yaml', '.yml'].includes(extname(path))) {
      report('structured curriculum must be JSON or YAML, never executable source.');
    }
    return errors;
  }
  if (!executable.test(path) || testFile.test(path)) return errors;

  const authoringPatterns = [
    /export\s+default\s+(?:lesson|makeLesson)\s*\(/,
    /\b(?:const|let|var)\s+(?:exerciseBank|questionBank|reviewBank|reviewQuestions|canonicalLessons)\s*=\s*[\[{]/,
    /\b(?:intro|body)\s*:\s*(?:String\.raw|R|raw)?`[^`]{160}/,
  ];
  if (authoringPatterns.some((pattern) => pattern.test(source))) {
    report('executable lesson authoring or curriculum bank; author MDX/YAML/JSON instead.');
  }

  // Catch direct JS/TS, Python, and shell writes to canonical source paths. This
  // intentionally does not attempt to resolve aliases or dynamically built paths.
  const sourceWrites = [
    /\b(?:writeFile(?:Sync)?|appendFile(?:Sync)?)\s*\(\s*['"`](?:\.\/)?content\//,
    /\b(?:writeFile(?:Sync)?|appendFile(?:Sync)?)\s*\(\s*(?:path\.)?(?:join|resolve)\(\s*(?:(?:root|ROOT|repoRoot)\s*,\s*)?['"]content(?:\/|['"])/,
    /\([^\n)]*['"]content\/[^\n)]*\)\.write_(?:text|bytes)\s*\(/,
    />{1,2}\s*['"]?(?:\.\/)?content\//,
  ];
  if (sourceWrites.some((pattern) => pattern.test(source))) {
    report('tooling must read canonical content and write runtime artifacts under output/.');
  }
  return errors;
}

export async function inspectCurriculumArchitecture(root: string): Promise<string[]> {
  const errors: string[] = [];
  async function visit(directory = ''): Promise<void> {
    const entries = await readdir(join(root, directory), { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const path = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (
          !ignoredDirectories.has(entry.name) ||
          path.startsWith('content/') ||
          path.startsWith('scripts/authoring/')
        ) {
          await visit(path);
        }
      } else if (
        path.startsWith('scripts/authoring/') ||
        path.startsWith('content/') ||
        executable.test(path)
      ) {
        if (entry.isSymbolicLink()) {
          errors.push(`${path}: curriculum and executable source must not be symlinked.`);
          continue;
        }
        errors.push(...inspectCurriculumFile(path, await readFile(join(root, path), 'utf8')));
      }
    }
  }
  await visit();
  const manifest = YAML.parse(await readFile(join(root, 'content/curriculum.yaml'), 'utf8'));
  for (const lesson of manifest.lessons ?? []) {
    if (typeof lesson.lesson !== 'string' || !/^lessons\/[^\s]+\.mdx$/.test(lesson.lesson)) {
      errors.push(`content/curriculum.yaml: ${lesson.slug} must reference a canonical MDX lesson.`);
    }
  }
  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const errors = await inspectCurriculumArchitecture(process.cwd());
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Curriculum architecture: declarative sources only.');
  }
}
