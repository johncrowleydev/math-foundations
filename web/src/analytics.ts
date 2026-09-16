import type { Attempt } from './types';
import type { EvidenceCatalog, EvidenceSnapshot } from './evidenceTypes';
export function metadata(a: Attempt, _c: EvidenceCatalog): EvidenceSnapshot | undefined {
  // Never project a changed current task onto historical learning evidence.
  return a.analytics;
}
export function assessment(a: Attempt) {
  return a.grades?.at(-1);
}
export function verdict(a: Attempt) {
  const g = assessment(a);
  return g?.verdict || a.verdict;
}
export function gradable(a: Attempt) {
  return ['correct', 'incorrect'].includes(verdict(a) || '');
}
export function exerciseProgress(attempts: Attempt[], exerciseKeys: Iterable<string>) {
  const scope = new Set(exerciseKeys);
  const attempted = new Set<string>();
  const correct = new Set<string>();
  for (const a of attempts) {
    if (!scope.has(a.exercise)) continue;
    attempted.add(a.exercise);
    if (verdict(a) === 'correct') correct.add(a.exercise);
  }
  const completedKeys: string[] = [];
  const inProgressKeys: string[] = [];
  const unattemptedKeys: string[] = [];
  for (const key of scope) {
    if (correct.has(key)) completedKeys.push(key);
    else if (attempted.has(key)) inProgressKeys.push(key);
    else unattemptedKeys.push(key);
  }
  return {
    total: scope.size,
    completed: completedKeys.length,
    inProgress: inProgressKeys.length,
    unattempted: unattemptedKeys.length,
    completedKeys,
    inProgressKeys,
    unattemptedKeys,
  };
}
export function evidenceCoverage(attempts: Attempt[]) {
  const mapped = attempts.filter((a) => a.analytics?.concepts.some((c) => c.role === 'primary'));
  return {
    mapped: mapped.length,
    missing: attempts.length - mapped.length,
    observed: mapped.some(gradable),
  };
}
export function summarize(attempts: Attempt[], history: Attempt[] = attempts) {
  const sorted = [...attempts].sort(
    (a, b) => a.submitted - b.submitted || a.id.localeCompare(b.id),
  );
  const groups = new Map<string, Attempt[]>();
  for (const a of sorted) groups.set(a.exercise, [...(groups.get(a.exercise) || []), a]);
  const observed = [...groups.values()].map((as) => as.filter(gradable)).filter((as) => as.length);
  const first = new Map<string, Attempt>();
  for (const a of [...history]
    .filter(gradable)
    .sort((a, b) => a.submitted - b.submitted || a.id.localeCompare(b.id)))
    if (!first.has(a.exercise)) first.set(a.exercise, a);
  const included = new Set(attempts.map((a) => a.id));
  const firstKnown = [...first.values()].filter((a) => included.has(a.id));
  const diagnoses = sorted
    .filter((a) => verdict(a) === 'incorrect')
    .flatMap((a) => (assessment(a)?.diagnosis || []).map((d) => ({ a, d })));
  return {
    totalAttempts: sorted.length,
    observed: observed.length,
    completed: observed.filter((as) => as.some((a) => verdict(a) === 'correct')).length,
    firstObserved: firstKnown.length,
    firstCorrect: firstKnown.filter((a) => verdict(a) === 'correct').length,
    correction: observed.filter((as) => as.some((a) => verdict(a) === 'incorrect')).length,
    retries: sorted.filter((a) => gradable(a) && first.get(a.exercise)?.id !== a.id).length,
    substantive: new Set(
      diagnoses
        .filter(
          ({ d }) =>
            d.severity === 'substantive' &&
            !['prompt-compliance', 'technical', 'clerical'].includes(d.class),
        )
        .map(({ a }) => a.id),
    ).size,
    minor: new Set(
      diagnoses
        .filter(({ d }) => d.severity === 'minor' || d.class === 'clerical')
        .map(({ a }) => a.id),
    ).size,
    unknown: sorted.filter((a) => verdict(a) === 'incorrect' && !assessment(a)?.diagnosis?.length)
      .length,
    notGraded: sorted.filter(
      (a) => verdict(a) === 'not_graded' || (!gradable(a) && a.status === 'error'),
    ).length,
    assistedCorrect: observed.filter((as) =>
      as.some(
        (a) =>
          verdict(a) === 'correct' &&
          (a.assistance?.priorIncorrectFeedbackSeen ||
            a.assistance?.answerPreviouslyRevealed ||
            a.revealed),
      ),
    ).length,
    last: Math.max(0, ...sorted.map((a) => a.submitted)),
    diagnoses,
  };
}
export function conceptRows(attempts: Attempt[], c: EvidenceCatalog) {
  const ids = new Set([
    ...c.concepts.map((x) => x.id),
    ...attempts.flatMap((a) => a.analytics?.concepts.map((x) => x.concept) || []),
  ]);
  return [...ids]
    .map((id) => {
      const primary = attempts.filter((a) =>
        metadata(a, c)?.concepts.some((x) => x.concept === id && x.role === 'primary'),
      );
      const supporting = attempts.filter((a) =>
        metadata(a, c)?.concepts.some((x) => x.concept === id && x.role === 'supporting'),
      );
      const skills = new Map<string, Attempt[]>();
      for (const a of primary.filter(gradable))
        for (const s of metadata(a, c)?.skills.filter((x) => x.role === 'primary') || [])
          skills.set(s.skill, [...(skills.get(s.skill) || []), a]);
      const summary = summarize(
        primary.map((a) => ({
          ...a,
          grades: a.grades.map((g, i) =>
            i === a.grades.length - 1
              ? {
                  ...g,
                  diagnosis: g.diagnosis?.filter(
                    (d) => !d.concepts?.length || d.concepts.includes(id),
                  ),
                }
              : g,
          ),
        })),
        attempts,
      );
      const attention = [
        ...(summary.substantive >= 2 ? ['Repeated substantive errors'] : []),
        ...([...skills].some(([, as]) => {
          const s = summarize(as, attempts);
          return s.firstObserved - s.firstCorrect >= 2;
        })
          ? ['Multiple first-try misses within a skill']
          : []),
        ...(summary.assistedCorrect >= 2 ? ['Correct after assistance on several exercises'] : []),
      ];
      return {
        id,
        name:
          c.concepts.find((x) => x.id === id)?.name ||
          attempts.flatMap((a) => a.analytics?.conceptDefinitions || []).find((x) => x.id === id)
            ?.name ||
          id,
        primary,
        supporting,
        skills,
        summary,
        attention,
      };
    })
    .filter(
      (r) =>
        r.primary.length ||
        r.supporting.length ||
        (c.exercises &&
          Object.values(c.exercises).some((m) => m.concepts.some((x) => x.concept === r.id))),
    );
}
