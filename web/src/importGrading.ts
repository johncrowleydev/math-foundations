import { gradeAssessment, validateAssessment } from '../../shared/deterministic';
import type { Assessment, Attempt, ChoiceAssessment, Grade } from './types';

const object = (value: unknown): value is Record<string, any> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_, v) =>
    object(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((key) => [key, v[key]]),
        )
      : v,
  );

// Backups retain historical feedback and timestamps. Only mathematical outcomes
// are checked, using the original snapshot rather than today's curriculum.
export function validateImportedGrades(attempts: Attempt[], records: Record<string, any>[]) {
  const snapshots = new Map<string, NonNullable<Attempt['presentation']>[]>();
  for (const a of attempts) {
    if (!a.presentation) continue;
    snapshots.set(a.id, [...(snapshots.get(a.id) || []), a.presentation]);
  }
  const instances = new Map<string, Record<string, any>[]>();
  for (const record of records) {
    const candidates = record.key?.startsWith('review-instance/')
      ? [record.payload]
      : record.key?.startsWith('review-session/')
        ? record.payload?.instances
        : record.key === 'review-cache/active'
          ? record.payload?.session?.instances
          : [];
    if (!Array.isArray(candidates)) continue;
    for (const instance of candidates) {
      if (!object(instance) || typeof instance.id !== 'string') continue;
      instances.set(instance.id, [...(instances.get(instance.id) || []), instance]);
    }
  }
  for (const a of attempts) {
    const definitions: Record<string, any>[] = [];
    for (const snapshot of snapshots.get(a.id) || []) {
      definitions.push(snapshot, snapshot.question);
    }
    for (const instance of (a.review && instances.get(a.review.instanceId)) || []) {
      if (instance.exercise !== a.exercise || instance.contentVersion !== a.contentVersion)
        throw Error('Imported attempt differs from its frozen Review question.');
      definitions.push(instance.question, instance.teaching, instance.teaching?.question);
    }
    let assessment: Assessment | undefined;
    let choice: ChoiceAssessment | undefined;
    for (const definition of definitions) {
      if (!object(definition)) continue;
      if (definition.assessment != null) {
        validateAssessment(definition.assessment);
        if (assessment && canonical(assessment) !== canonical(definition.assessment))
          throw Error('Conflicting imported deterministic assessments.');
        assessment = definition.assessment;
      }
      if (definition.choice != null) {
        const next = definition.choice;
        if (
          !object(next) ||
          !Array.isArray(next.options) ||
          !next.options.length ||
          !next.options.every(
            (option: unknown) =>
              object(option) &&
              typeof option.id === 'string' &&
              typeof option.text === 'string' &&
              typeof option.feedback === 'string',
          ) ||
          new Set(next.options.map((option: { id: string }) => option.id)).size !==
            next.options.length ||
          !next.options.some((option: { id: string }) => option.id === next.correctOption)
        )
          throw Error('Invalid imported choice assessment.');
        if (choice && canonical(choice) !== canonical(next))
          throw Error('Conflicting imported choice assessments.');
        choice = next as ChoiceAssessment;
      }
    }
    if (!assessment && !choice) continue;
    if (assessment && choice) throw Error('Conflicting imported grading methods.');
    if (a.mode !== (assessment ? 'structured' : 'choice'))
      throw Error('Imported answer mode differs from its deterministic assessment.');
    const completed =
      a.status === 'graded' ||
      a.verdict === 'correct' ||
      a.verdict === 'incorrect' ||
      a.grades.length > 0;
    if (!completed) continue;
    let expected: Pick<Grade, 'verdict' | 'requirements'>;
    if (assessment) {
      if (!a.response) throw Error('Missing imported structured answer.');
      expected = gradeAssessment(assessment, a.response);
    } else {
      const selected = choice!.options.find((option) => option.id === a.choiceId);
      if (!selected || selected.text !== a.text)
        throw Error('Imported answer differs from its original choice.');
      const correct = selected.id === choice!.correctOption;
      expected = {
        verdict: correct ? 'correct' : 'incorrect',
        requirements: [{ id: 'selection', description: '', satisfied: correct }],
      };
    }
    if (a.verdict !== expected.verdict || !a.grades.length)
      throw Error('Imported deterministic verdict disagrees with the answer.');
    for (const grade of a.grades) {
      if (grade.verdict !== expected.verdict || grade.diagnosis?.length)
        throw Error('Imported deterministic grade disagrees with the answer.');
      if (
        !assessment &&
        !grade.requirements?.length &&
        (!grade.promptVersion || grade.promptVersion === 'authored-choice-1')
      )
        continue;
      const requirements = grade.requirements;
      if (
        !requirements ||
        requirements.length !== expected.requirements!.length ||
        new Set(requirements.map((r) => r.id)).size !== requirements.length ||
        expected.requirements!.some(
          (r) => !requirements.some((v) => v.id === r.id && v.satisfied === r.satisfied),
        )
      )
        throw Error('Imported deterministic requirements disagree with the answer.');
    }
  }
}
