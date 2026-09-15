import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import YAML from 'yaml';
import type { EvidenceCatalog, ExerciseEvidence } from '../web/src/evidenceTypes.js';
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
}
export async function loadEvidence(
  lessons: {
    slug: string;
    sections: { title: string }[];
    questions: { id: number; math?: string; choice?: unknown }[];
  }[],
): Promise<EvidenceCatalog> {
  const authored = YAML.parse(await readFile('content/learning-evidence.yaml', 'utf8'));
  const exercises: Record<string, ExerciseEvidence> = {};
  for (const row of authored.exercises) {
    const key = row.lesson + '-' + row.id;
    if (exercises[key]) throw Error('Duplicate evidence ' + key);
    exercises[key] = {
      concepts: row.primary
        .map((concept: string) => ({ concept, role: 'primary' }))
        .concat((row.supporting || []).map((concept: string) => ({ concept, role: 'supporting' }))),
      skills: row.skills.map((skill: string) => ({ skill, role: 'primary' })),
      representations: row.representations,
      attributes: row.attributes || {},
    };
    const q = lessons.find((l) => l.slug === row.lesson)?.questions.find((q) => q.id === row.id);
    // Count only explicit logical operators in the displayed expression, not prose or the answer.
    exercises[key].attributes!.responseFormat = q?.choice ? 'choice' : 'open';
    if (row.lesson === 'propositional-logic' && q?.math)
      exercises[key].attributes!.operatorCount = (
        q.math.match(/\\(?:neg|land|lor|to|leftrightarrow)\b/g) || []
      ).length;
  }
  const c = { ...authored, exercises, version: '' } as EvidenceCatalog;
  validateEvidence(c, new Set(lessons.flatMap((l) => l.questions.map((q) => l.slug + '-' + q.id))));
  for (const q of lessons.find((l) => l.slug === 'propositional-logic')!.questions)
    if (!exercises['propositional-logic-' + q.id])
      throw Error('Unannotated Lesson 1 exercise ' + q.id);
  for (const t of c.teaching)
    if (!lessons.find((l) => l.slug === t.lesson)?.sections.some((s) => s.title === t.section))
      throw Error('Missing exposure teaching section ' + t.section);
  c.version = createHash('sha256').update(JSON.stringify(c)).digest('hex');
  return c;
}
