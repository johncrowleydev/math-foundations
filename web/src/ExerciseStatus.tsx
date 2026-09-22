import { Check, X, Circle, Clock3, Pencil, CircleAlert } from 'lucide-react';

export function ExerciseStatus({ status }: { status: string }) {
  const Icon =
    status === 'Correct' || status === 'Covered'
      ? Check
      : status === 'Try again' || status === 'Incorrect'
        ? X
        : status === 'Grading' || status === 'Syncing'
          ? Clock3
          : status === 'Draft'
            ? Pencil
            : ['Needs attention', 'Needs revision', 'Grading failed'].includes(status)
              ? CircleAlert
              : Circle;
  const tone =
    status === 'Correct' || status === 'Covered'
      ? 'complete'
      : status === 'Try again' || status === 'Incorrect'
        ? 'incorrect'
        : '';
  return (
    <span className={'progress-state ' + tone} role="img" aria-label={status} title={status}>
      <Icon size={14} strokeWidth={status === 'Not attempted' ? 1.5 : 2} aria-hidden="true" />
    </span>
  );
}
