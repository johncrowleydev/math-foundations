import { useEffect, useState } from 'react';
import { ExerciseStatus } from './ExerciseStatus';
import { get, useRevision } from './storage';
import type { Attempt, Draft } from './types';
import type { ReviewInstance } from './reviewTypes';

export function ReviewExerciseLink({
  instance,
  label,
  concept,
  selected,
  attempts,
  covered,
  onSelect,
}: {
  instance: ReviewInstance;
  label: string;
  concept: string;
  selected: boolean;
  attempts: Attempt[];
  covered: boolean;
  onSelect: () => void;
}) {
  const revision = useRevision('draft:' + instance.exercise);
  const [draft, setDraft] = useState<Draft>();
  useEffect(() => {
    let live = true;
    void get<Draft>('drafts', instance.exercise).then((saved) => {
      if (live) setDraft(saved);
    });
    return () => {
      live = false;
    };
  }, [instance.exercise, revision]);
  const latest = attempts.reduce<Attempt | undefined>(
    (last, attempt) => (!last || attempt.submitted > last.submitted ? attempt : last),
    undefined,
  );
  const hasDraft =
    draft &&
    (draft.text.trim() ||
      draft.strokes.length ||
      draft.photos.length ||
      draft.choiceId ||
      Object.values(draft.response || {}).some((value) =>
        Array.isArray(value) ? value.length > 0 : value !== null && value !== '',
      ));
  const status = attempts.some((a) =>
    ['queued', 'pending', 'grading', 'rechecking'].includes(a.status),
  )
    ? 'Grading'
    : latest?.status === 'error'
      ? 'Grading failed'
      : attempts.some((a) => a.verdict === 'correct')
        ? 'Correct'
        : latest?.verdict === 'incorrect'
          ? 'Incorrect'
          : latest
            ? 'Needs revision'
            : covered
              ? 'Covered'
              : hasDraft
                ? 'Draft'
                : 'Not attempted';
  return (
    <button
      className={'exercise-link ' + (selected ? 'selected' : '')}
      aria-current={selected ? 'step' : undefined}
      onClick={onSelect}
    >
      <span className="review-exercise-label">
        {label}
        <small>{concept}</small>
      </span>
      <ExerciseStatus status={status} />
    </button>
  );
}
