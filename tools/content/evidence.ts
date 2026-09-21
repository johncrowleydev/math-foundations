import type { Assessment } from '../../shared/assessment.js';
import { exerciseKey, validateExerciseKeys } from '../../web/src/exerciseIdentity.js';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import type { EvidenceCatalog, ExerciseEvidence } from '../../web/src/evidenceTypes.js';
export function validateEvidence(c: EvidenceCatalog, keys: Set<string>) {
  const ids = (rows: { id: string }[], label: string) => {
    const s = new Set(rows.map((x) => x.id));
    if (s.size !== rows.length || rows.some((x) => !/^[a-z][a-z0-9-]*$/.test(x.id)))
      throw Error('Invalid/duplicate ' + label);
    return s;
  };
  const concepts = ids(c.concepts, 'concepts'),
    skills = ids(c.skills, 'skills'),
    reps = ids(c.representations, 'representations');
  for (const concept of c.concepts) {
    for (const id of [concept.parent, ...(concept.prerequisites || [])].filter(Boolean))
      if (!concepts.has(id!)) throw Error('Missing concept ' + id);
    const seen = new Set<string>();
    let current: typeof concept | undefined = concept;
    while (current) {
      if (seen.has(current.id)) throw Error('Concept hierarchy cycle');
      seen.add(current.id);
      current = c.concepts.find((x) => x.id === current!.parent);
    }
  }
  for (const [key, m] of Object.entries(c.exercises)) {
    if (!keys.has(key)) throw Error('Unknown exercise ' + key);
    const check = (links: { id: string; role: string }[], valid: Set<string>) => {
      if (
        !links.some((x) => x.role === 'primary') ||
        new Set(links.map((x) => x.id)).size !== links.length ||
        links.some((x) => !valid.has(x.id) || !['primary', 'supporting'].includes(x.role))
      )
        throw Error('Invalid evidence relationships ' + key);
    };
    check(
      m.concepts.map((x) => ({ id: x.concept, role: x.role })),
      concepts,
    );
    check(
      m.skills.map((x) => ({ id: x.skill, role: x.role })),
      skills,
    );
    if (!m.representations.length || m.representations.some((x) => !reps.has(x)))
      throw Error('Invalid representation ' + key);
    if (
      Object.values(m.attributes || {}).some(
        (x) =>
          !['string', 'number', 'boolean'].includes(typeof x) ||
          (typeof x === 'number' && !Number.isFinite(x)),
      )
    )
      throw Error('Invalid attributes ' + key);
  }
  for (const t of c.teaching) if (!concepts.has(t.concept)) throw Error('Unknown teaching concept');
  for (const key of keys) if (!c.exercises[key]) throw Error('Unannotated exercise ' + key);
}
export function authoredSkills(rows: (string | { skill: string; role: string })[]) {
  return rows.map((row) =>
    typeof row === 'string' ? { skill: row, role: 'primary' as const } : row,
  ) as ExerciseEvidence['skills'];
}
type EvidenceLesson = {
  slug: string;
  exerciseNamespace?: string;
  sections: { title: string }[];
  questions: { id: number; math?: string; choice?: unknown; assessment?: Assessment }[];
};
type AuthoredEvidence = Omit<EvidenceCatalog, 'exercises' | 'version'> & {
  exercises: {
    lesson: string;
    id: number;
    primary: string[];
    supporting?: string[];
    skills: (string | { skill: string; role: string })[];
    representations: string[];
    attributes?: ExerciseEvidence['attributes'];
  }[];
};
export async function loadEvidence(lessons: EvidenceLesson[]): Promise<EvidenceCatalog> {
  const authored = YAML.parse(await readFile('content/learning-evidence.yaml', 'utf8'));
  // Each lesson authors its own rows; the shared catalogs remain subject-neutral.
  for (const file of (await readdir('content/evidence'))
    .filter((f) => f.endsWith('.yaml'))
    .sort()) {
    const part = YAML.parse(await readFile('content/evidence/' + file, 'utf8'));
    for (const field of ['concepts', 'teaching', 'exercises']) authored[field].push(...part[field]);
  }
  return publishEvidence(authored, lessons);
}

export function publishEvidence(
  authored: AuthoredEvidence,
  lessons: EvidenceLesson[],
): EvidenceCatalog {
  const keys = validateExerciseKeys(lessons);
  const exercises: Record<string, ExerciseEvidence> = {};
  for (const row of authored.exercises) {
    const lesson = lessons.find((l) => l.slug === row.lesson);
    const q = lesson?.questions.find((q) => q.id === row.id);
    if (!lesson || !q) throw Error(`Unknown authored exercise ${row.lesson}-${row.id}`);
    const key = exerciseKey(lesson, row.id);
    if (exercises[key]) throw Error('Duplicate evidence ' + key);
    exercises[key] = {
      concepts: [
        ...row.primary.map((concept) => ({ concept, role: 'primary' as const })),
        ...(row.supporting || []).map((concept) => ({ concept, role: 'supporting' as const })),
      ],
      skills: authoredSkills(row.skills),
      representations: row.representations,
      attributes: { ...row.attributes },
    };
    // Count only explicit logical operators in the displayed expression, not prose or the answer.
    exercises[key].attributes!.responseFormat = q?.choice
      ? 'choice'
      : q?.assessment
        ? 'structured'
        : 'open';
    if (q.assessment) {
      exercises[key].attributes!.evidenceLevel = q.assessment.evidence.level;
      exercises[key].attributes!.interactionCost = q.assessment.evidence.interactionCost;
    }
    if (row.lesson === 'propositional-logic' && q?.math)
      exercises[key].attributes!.operatorCount = (
        q.math.match(/\\(?:neg|land|lor|to|leftrightarrow)\b/g) || []
      ).length;
  }
  const c = { ...authored, exercises, version: '' } as EvidenceCatalog;
  validateEvidence(c, keys);
  for (const t of c.teaching)
    if (!lessons.find((l) => l.slug === t.lesson)?.sections.some((s) => s.title === t.section))
      throw Error('Missing exposure teaching section ' + t.section);
  c.version = createHash('sha256').update(JSON.stringify(c)).digest('hex');
  return c;
}
