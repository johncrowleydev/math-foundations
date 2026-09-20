import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { all, useRevision } from './storage';
import { gradingCompleted } from './gradingCompletion';
import { exerciseKey } from './exerciseIdentity';
import { questionLabel, type Attempt, type Curriculum } from './types';

export function GradingToasts({
  data,
  currentExercise,
}: {
  data: Curriculum;
  currentExercise?: string;
}) {
  const revision = useRevision();
  const previous = useRef(new Map<string, Attempt>());
  const current = useRef(currentExercise);
  current.current = currentExercise;
  const [toasts, setToasts] = useState<{ id: string; message: string; incorrect: boolean }[]>([]);

  useEffect(() => {
    let live = true;
    void all<Attempt>('attempts').then((attempts) => {
      if (!live) return;
      const messages: typeof toasts = [];
      for (const attempt of attempts) {
        if (!gradingCompleted(previous.current.get(attempt.id), attempt)) continue;
        if (current.current === attempt.exercise) continue;
        const reader = document.getElementById('reader')?.getBoundingClientRect();
        const visible = [...document.querySelectorAll<HTMLElement>('[data-exercise-key]')].some(
          (el) => {
            if (el.dataset.exerciseKey !== attempt.exercise || !el.getClientRects().length)
              return false;
            const rect = el.getBoundingClientRect();
            return reader && rect.bottom > reader.top && rect.top < reader.bottom;
          },
        );
        if (visible) continue;
        const lesson = data.lessons.find((l) =>
          l.questions.some((q) => exerciseKey(l, q.id) === attempt.exercise),
        );
        const question = lesson?.questions.find(
          (q) => exerciseKey(lesson, q.id) === attempt.exercise,
        );
        if (!lesson || !question) continue;
        const verdict = attempt.grades.at(-1)?.verdict || attempt.verdict;
        const result =
          verdict === 'correct'
            ? 'Correct'
            : verdict === 'incorrect'
              ? 'Try again'
              : 'Needs attention';
        messages.push({
          id: crypto.randomUUID(),
          incorrect: verdict === 'incorrect',
          message: `${lesson.title} · ${questionLabel(question)}: Grading complete — ${result}.`,
        });
      }
      previous.current = new Map(attempts.map((a) => [a.id, a]));
      if (messages.length) setToasts((old) => [...old, ...messages]);
    });
    return () => {
      live = false;
    };
  }, [revision, data]);

  // Give each completion its own turn, including results arriving in one sync.
  const toast = toasts[0];
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToasts((old) => old.slice(1)), 7000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <div className="grading-toasts" role="status" aria-live="polite" aria-atomic="true">
      {toast && (
        <div className={'grading-toast' + (toast.incorrect ? ' incorrect' : '')} key={toast.id}>
          <span>{toast.message}</span>
          <button
            className="icon-button"
            aria-label="Dismiss grading notification"
            onClick={() => setToasts((old) => old.slice(1))}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
