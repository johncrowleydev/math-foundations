import { useEffect, useRef, useState } from 'react';
import type { Attempt, Curriculum } from './types';
import type { ReviewMode, ReviewSession, ReviewSessionRequest, ReviewSummary } from './reviewTypes';
import { all, useRevision } from './storage';
import { Modal } from './Rich';
import { ReviewExerciseLink } from './ReviewExerciseLink';
import { Exercise } from './Exercise';
import { routeHash } from './routing';
import { nextReviewTaskIndex, reviewTargetCovered } from './reviewSessionProgress';
import {
  cachedReviewSessionState,
  cachedReviewSummary,
  loadReviewSummary,
  retainReviewSession,
  startReviewSession,
} from './reviewApi';

export function Review({ data, lesson: currentLesson }: { data: Curriculum; lesson: string }) {
  const [summary, setSummary] = useState<ReviewSummary>();
  const [cached, setCached] = useState(false);
  const [checking, setChecking] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<number>();
  const [session, setSession] = useState<ReviewSession>();
  const [index, setIndex] = useState(0);
  const [exerciseNav, setExerciseNav] = useState(false);
  const queueRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lesson, setLesson] = useState('');
  const [concept, setConcept] = useState('');
  const [skill, setSkill] = useState('');
  const [mode, setMode] = useState<ReviewMode>('regular');
  const [budgetMinutes, setBudgetMinutes] = useState(() => {
    const saved = Number(localStorage.getItem('review-budget-minutes'));
    return Number.isInteger(saved) && saved >= 5 && saved <= 60 ? saved : 25;
  });
  const revision = useRevision();
  const summaryRequest = useRef(0);
  async function refresh() {
    const request = ++summaryRequest.current;
    setChecking(true);
    try {
      const result = await loadReviewSummary(budgetMinutes);
      if (request !== summaryRequest.current) return;
      setSummary(result.summary);
      setCached(result.cached);
      setFetchedAt(result.fetchedAt);
      setError('');
      return result;
    } catch (e) {
      if (request === summaryRequest.current) setError(String(e));
    } finally {
      if (request === summaryRequest.current) setChecking(false);
    }
  }
  useEffect(() => {
    // Restore local work before starting a possibly slow network refresh. A
    // fresh summary may mark the visible card covered without replacing it.
    void Promise.all([cachedReviewSessionState(), all<Attempt>('attempts'), cachedReviewSummary()])
      .then(([saved, existing, result]) => {
        if (result) {
          setSummary(result.summary);
          setCached(true);
          setFetchedAt(result.fetchedAt);
        }
        if (!saved) return;
        setSession(saved.session);
        setPaused(saved.paused);
        setIndex(
          saved.paused
            ? saved.index
            : nextReviewTaskIndex(
                saved.session,
                saved.index,
                existing,
                result?.summary,
                result?.fetchedAt,
                { resume: true },
              ),
        );
      })
      .catch((e) => setError(String(e)))
      .finally(() => void refresh());
  }, []);
  useEffect(() => {
    localStorage.setItem('review-budget-minutes', String(budgetMinutes));
    void refresh();
    window.addEventListener('online', refresh);
    return () => window.removeEventListener('online', refresh);
  }, [budgetMinutes]);
  useEffect(() => {
    void all<Attempt>('attempts').then(setAttempts);
  }, [revision]);
  const reviewStatus = attempts
    .filter((a) => a.review)
    // Deterministic answers are already Correct locally. Their server-stamped
    // grade must also refresh coverage when acknowledgement keeps that verdict.
    .map((a) => [a.id, a.status, a.verdict, ...a.grades.map((grade) => grade.at)].join(':'))
    .join(',');
  useEffect(() => {
    if (session) void refresh();
  }, [reviewStatus]);
  async function start(request: ReviewSessionRequest) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const next = await startReviewSession({ ...request, budgetMinutes });
      await retainReviewSession(next.instances.length ? next : null);
      setSession(next.instances.length ? next : undefined);
      setPaused(false);
      setIndex(0);
      if (!next.instances.length)
        setNotice(
          request.kind === 'scheduled-review'
            ? 'No scheduled review is currently available. More review will become due later.'
            : 'No compatible tasks in this selection. Try another scope or study mode.',
        );
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function pause() {
    if (!session) return;
    try {
      await retainReviewSession(session, { paused: true, index });
      setPaused(true);
      setNotice('');
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }
  async function resume() {
    if (!session) return;
    try {
      await retainReviewSession(session, { paused: false, index });
      setPaused(false);
      setNotice('');
    } catch (e) {
      setError(String(e));
    }
  }
  async function finish() {
    try {
      await retainReviewSession(null);
      setNotice('Session ended. Your drafts and attempts are saved.');
      setPaused(false);
      setSession(undefined);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    const selected = queueRef.current?.querySelector<HTMLElement>('[aria-current="step"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [index, exerciseNav, paused, session?.id]);
  const item = session?.instances[index];
  const names = (id: string, options: { id: string; name: string }[] | undefined) =>
    options?.find((x) => x.id === id)?.name || id;
  const itemAttempts = item ? attempts.filter((a) => a.exercise === item.exercise) : [];
  const answered = itemAttempts.some((a) => a.verdict === 'correct');
  const pending = itemAttempts.some((a) =>
    ['queued', 'pending', 'grading', 'rechecking'].includes(a.status),
  );
  const covered = !!(
    session &&
    item &&
    reviewTargetCovered(session, item, attempts, summary, fetchedAt)
  );
  const target = summary?.targets.find(
    (t) =>
      t.concept === item?.context.concept &&
      t.skill === item?.context.skill &&
      t.objective === item?.context.objective,
  );
  const showQueue = !!(session && !paused && session.instances.length);
  const exerciseList = session && (
    <nav aria-label="Review exercises" ref={queueRef}>
      {session.instances.map((instance, position) => (
        <ReviewExerciseLink
          key={instance.id}
          instance={instance}
          label={`${position + 1}. ${names(instance.context.skill, summary?.skills)}`}
          concept={names(instance.context.concept, summary?.concepts)}
          selected={index === position}
          attempts={attempts.filter((attempt) => attempt.exercise === instance.exercise)}
          covered={reviewTargetCovered(session, instance, attempts, summary, fetchedAt)}
          onSelect={() => {
            setIndex(position);
            setExerciseNav(false);
          }}
        />
      ))}
    </nav>
  );
  const unfinished = session && paused;
  const reviewAvailable = summary && summary.due > 0 && summary.estimatedMinutes !== 0;
  return (
    <div className="review-layout">
      <div className="reading-column review-page">
        <div className="review-heading">
          <div>
            <div className="eyebrow">Spaced retrieval</div>
            <h1>
              {!paused && session?.kind === 'focused-practice' ? 'Focused Practice' : 'Review'}
            </h1>
          </div>
          <div className="toolbar">
            {showQueue && (
              <button className="exercise-nav-toggle" onClick={() => setExerciseNav(true)}>
                Exercises
              </button>
            )}
            <a href={routeHash({ slug: currentLesson, tab: 'review-library' })}>Review Library</a>
            {session && !paused && <button onClick={() => void pause()}>Back to overview</button>}
          </div>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {cached && (
          <aside className="review-notice" aria-label="Review status updates">
            <p>
              {checking ? 'Checking for review updates…' : 'Couldn’t check for review updates.'}{' '}
              Showing review status
              {fetchedAt ? ' from ' + new Date(fetchedAt).toLocaleString() : ''}.
            </p>
            <p>
              {session?.instances.length
                ? 'Your saved session can still be continued offline. New sessions need a connection.'
                : 'Starting a review or focused practice session needs a connection.'}
            </p>
            {!checking && <button onClick={() => void refresh()}>Try again</button>}
          </aside>
        )}
        {!summary && error && !checking && (
          <button onClick={() => void refresh()}>Try again</button>
        )}
        {notice && (
          <p className="review-notice" role="status">
            {notice}
          </p>
        )}
        {session && !paused && item ? (
          <>
            <div className="practice-heading">
              <strong>
                {session.mode === 'quick' ? 'Quick' : 'Regular'} · {index + 1} of{' '}
                {session.instances.length}
                {session.estimatedMinutes !== undefined &&
                  ` · ~${Math.ceil(session.estimatedMinutes)} min`}
              </strong>
              <span className="muted">
                {names(item.context.concept, summary?.concepts)} ·{' '}
                {names(item.context.skill, summary?.skills)}
                {item.estimatedSeconds !== undefined &&
                  ` · ~${item.estimatedSeconds < 60 ? item.estimatedSeconds + ' sec' : Math.ceil(item.estimatedSeconds / 60) + ' min'}`}
              </span>
            </div>
            <details className="review-why">
              <summary>Why am I seeing this?</summary>
              <p>
                {session.kind === 'focused-practice'
                  ? 'You chose this scope for focused practice. This evidence stays distinguishable from scheduled retrieval.'
                  : target?.reason ||
                    'This knowledge target was due when the server planned your session.'}
              </p>
              {item.context.scheduledFor > 0 && (
                <p>
                  Scheduled for {new Date(item.context.scheduledFor).toLocaleDateString()}.{' '}
                  {item.context.previousReviewAt
                    ? 'Previous review: ' +
                      new Date(item.context.previousReviewAt).toLocaleDateString() +
                      '.'
                    : item.context.previousEvidenceAt
                      ? 'Previous active work: ' +
                        new Date(item.context.previousEvidenceAt).toLocaleDateString() +
                        '. This is the first review.'
                      : 'No previous delayed review recorded.'}
                </p>
              )}
            </details>
            {covered && (
              <p className="review-notice" role="status">
                This review target is already covered by recent work. You can continue without
                answering again. Any draft is saved.
              </p>
            )}
            <Exercise
              key={item.id}
              q={item.question}
              lesson={
                data.lessons.find((lesson) => lesson.slug === item.lesson) || { slug: item.lesson }
              }
              data={data}
              instance={item}
            />
            <nav className="practice-nav" aria-label="Review navigation">
              <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
                ← Previous
              </button>
              <button
                onClick={() => {
                  const next = nextReviewTaskIndex(
                    session,
                    index + 1,
                    attempts,
                    summary,
                    fetchedAt,
                  );
                  setIndex(next);
                  if (next === session.instances.length) void refresh();
                }}
              >
                {answered || covered
                  ? 'Next →'
                  : pending
                    ? 'Continue while grading →'
                    : 'Skip for now →'}
              </button>
            </nav>
            {!answered && !pending && !covered && (
              <p className="muted">You can leave this for another day. Your draft is saved.</p>
            )}
          </>
        ) : session && !paused && session.instances.length > 0 ? (
          <div className="review-panel">
            <h2>You’ve reached the end of this session</h2>
            <p>
              You can end the session or revisit its questions. Your drafts and answers are saved.
            </p>
            <p className="muted">
              Visiting or skipping questions doesn’t mark them as learned. Queued or grading answers
              update your review schedule after server processing.
            </p>
            <div className="toolbar">
              <button className="primary" onClick={() => void finish()}>
                End session
              </button>
              <button onClick={() => setIndex(0)}>Revisit questions</button>
            </div>
          </div>
        ) : (
          <>
            {unfinished && (
              <section className="review-panel review-primary" aria-labelledby="unfinished-review">
                <h2 id="unfinished-review">
                  {session.kind === 'focused-practice'
                    ? 'Continue your focused practice'
                    : 'Continue your review'}
                </h2>
                <p>
                  You have an unfinished {session.instances.length}-question{' '}
                  {session.kind === 'focused-practice' ? 'focused practice' : 'review'} session.
                  Your drafts and answers are saved.
                </p>
                <div className="toolbar">
                  <button className="primary" onClick={() => void resume()}>
                    {session.kind === 'focused-practice' ? 'Continue practice' : 'Continue review'}
                  </button>
                  <button onClick={() => void finish()}>End session</button>
                </div>
                <p className="muted">
                  Finish or end this session before starting another scheduled review or focused
                  practice.
                </p>
                {session.kind === 'scheduled-review' && (
                  <p className="muted">
                    Ending a session keeps your drafts and answers. Its estimated time still counts
                    toward your daily allowance for 24 hours after it started.
                  </p>
                )}
              </section>
            )}
            {summary ? (
              <>
                {!unfinished && (
                  <section className="review-panel review-primary" aria-labelledby="today-review">
                    <h2 id="today-review">
                      {reviewAvailable ? 'Today’s review' : 'You’re caught up for now'}
                    </h2>
                    {reviewAvailable ? (
                      <>
                        {summary.estimatedMinutes !== undefined && (
                          <p className="review-estimate">
                            About {Math.ceil(summary.estimatedMinutes)} minutes
                          </p>
                        )}
                        <div className="review-counts" aria-label="Next session breakdown">
                          <div>
                            <strong>{summary.plannedQuick ?? '—'}</strong>
                            <span>Quick recall</span>
                          </div>
                          <div>
                            <strong>{summary.plannedApplication ?? '—'}</strong>
                            <span>Short application</span>
                          </div>
                          <div>
                            <strong>{summary.plannedDeep ?? '—'}</strong>
                            <span>Deep problem</span>
                          </div>
                        </div>
                        <div className="toolbar">
                          <button
                            className="primary"
                            disabled={busy}
                            onClick={() =>
                              void start({ kind: 'scheduled-review', mode: 'regular' })
                            }
                          >
                            {busy ? 'Starting…' : 'Start review'}
                          </button>
                          {summary.quick > 0 && (
                            <button
                              disabled={busy}
                              aria-describedby="quick-review-help"
                              onClick={() =>
                                void start({ kind: 'scheduled-review', mode: 'quick' })
                              }
                            >
                              Quick review
                            </button>
                          )}
                        </div>
                        {summary.quick > 0 && (
                          <p className="muted" id="quick-review-help">
                            Quick review uses only tap or short-text questions. Deeper due work
                            stays scheduled for later.
                          </p>
                        )}
                      </>
                    ) : (
                      <p>
                        No scheduled review is currently available. More review will become due
                        later.
                      </p>
                    )}
                  </section>
                )}
                <div className="review-allowance">
                  <label className="review-budget">
                    Daily review target
                    <select
                      value={budgetMinutes}
                      aria-describedby="review-budget-help"
                      onChange={(event) => setBudgetMinutes(Number(event.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, index) => (index + 1) * 5).map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes} minutes
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="muted" id="review-budget-help">
                    This is a daily planning allowance, not a requirement. If less review is due,
                    your session may be shorter.
                  </p>
                  <details>
                    <summary>How the daily allowance works</summary>
                    <p className="muted">
                      Scheduled sessions count toward this allowance for 24 hours after they start,
                      including unfinished or ended sessions. Changing your target doesn’t reset
                      that time.
                      {!!summary.reservedMinutes &&
                        ` About ${Math.ceil(summary.reservedMinutes)} minutes already count toward your allowance.`}
                    </p>
                  </details>
                </div>
                <section className="review-panel">
                  <h2>Focused practice</h2>
                  <p>
                    Practice a specific lesson, concept, or skill outside your scheduled review.
                  </p>
                  {unfinished ? (
                    <p className="muted">
                      End your current session to choose optional extra practice.
                    </p>
                  ) : (
                    <>
                      <div className="review-filters">
                        <label>
                          Lesson
                          <select value={lesson} onChange={(e) => setLesson(e.target.value)}>
                            <option value="">All lessons</option>
                            {summary.lessons.map((l) => (
                              <option key={l.slug} value={l.slug}>
                                {l.title}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Concept
                          <select value={concept} onChange={(e) => setConcept(e.target.value)}>
                            <option value="">All concepts</option>
                            {summary.concepts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Skill
                          <select value={skill} onChange={(e) => setSkill(e.target.value)}>
                            <option value="">All skills</option>
                            {summary.skills.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Study mode
                          <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as ReviewMode)}
                          >
                            <option value="regular">Regular</option>
                            <option value="quick">Quick</option>
                          </select>
                        </label>
                      </div>
                      <button
                        disabled={busy || paused}
                        onClick={() =>
                          void start({
                            kind: 'focused-practice',
                            mode,
                            ...(lesson ? { lesson } : {}),
                            ...(concept ? { concept } : {}),
                            ...(skill ? { skill } : {}),
                          })
                        }
                      >
                        {busy ? 'Starting…' : 'Start focused practice'}
                      </button>
                    </>
                  )}
                </section>
                <details className="review-targets">
                  <summary>Review schedule</summary>
                  <p className="muted">
                    {summary.targets.length} knowledge targets in your schedule.
                  </p>
                  {summary.targets.map((t) => (
                    <article key={t.id}>
                      <strong>
                        {names(t.concept, summary.concepts)} · {names(t.skill, summary.skills)}
                      </strong>
                      {t.objective && (
                        <div className="muted">{t.objective.replaceAll('-', ' ')}</div>
                      )}
                      <p>
                        Due {new Date(t.dueAt).toLocaleDateString()} ·{' '}
                        {t.quick ? 'Quick-compatible' : 'Regular mode'}
                      </p>
                      <p className="muted">{t.reason}</p>
                    </article>
                  ))}
                </details>
              </>
            ) : (
              !error && <p role="status">Loading review schedule…</p>
            )}
          </>
        )}
      </div>
      {showQueue && (
        <aside className="practice-sidebar review-sidebar">
          <span className="eyebrow">Session exercises</span>
          <p className="practice-summary">
            {session!.instances.length} tasks · Select to view work or feedback
          </p>
          {!exerciseNav && exerciseList}
        </aside>
      )}
      {showQueue && exerciseNav && (
        <Modal title="Review exercises" onClose={() => setExerciseNav(false)}>
          {exerciseList}
        </Modal>
      )}
    </div>
  );
}
