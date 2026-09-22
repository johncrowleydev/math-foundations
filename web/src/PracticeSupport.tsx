import { useEffect, useState, type ReactNode } from 'react';
import { all, useRevision } from './storage';
import { practiceGuidance } from './learningPractice';
import { lessonReview } from './lessonReview';
import { routeHash } from './routing';
import type { Attempt, Curriculum, Lesson, Question } from './types';

export function PracticeSupport({
  data,
  lesson,
  question,
  children,
}: {
  data: Curriculum;
  lesson: Lesson;
  question: Question;
  children: ReactNode;
}) {
  const revision = useRevision();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    let live = true;
    void all<Attempt>('attempts').then((saved) => {
      if (live) setAttempts(saved);
    });
    return () => {
      live = false;
    };
  }, [revision]);
  const guidance = practiceGuidance(data, lesson, question, attempts);
  const teaching = guidance?.kind === 'support' ? lessonReview(data, lesson, question) : undefined;
  return (
    <>
      {guidance && (
        <div className="practice-guidance" role="status">
          {guidance.kind === 'fluent' ? (
            <>
              <p>
                Two independent, quick correct answers show this routine skill is going well. You
                can skip this similar question.
              </p>
              <button onClick={() => setSkipped(!skipped)}>
                {skipped ? 'Show exercise again' : 'Skip similar practice'}
              </button>
            </>
          ) : (
            <>
              <p>
                A nearby attempt needed another look. Revisit the explanation, then try a similar
                example when you are ready.
              </p>
              <div className="toolbar">
                <a
                  href={routeHash({
                    slug: teaching!.slug,
                    tab: 'read',
                    section: teaching!.section,
                  })}
                >
                  Revisit {teaching!.title}
                </a>
                {guidance.nearby && (
                  <a
                    href={routeHash({
                      slug: lesson.slug,
                      tab: 'practice',
                      exercise: String(guidance.nearby.id),
                    })}
                  >
                    Try nearby practice
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {(!skipped || guidance?.kind !== 'fluent') && children}
    </>
  );
}
