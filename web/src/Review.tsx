import { useEffect, useRef, useState } from 'react';
import type { Attempt, Curriculum } from './types';
import type { ReviewMode, ReviewSession, ReviewSessionRequest, ReviewSummary } from './reviewTypes';
import { all, useRevision } from './storage';
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
  const [fetchedAt, setFetchedAt] = useState<number>();
  const [session, setSession] = useState<ReviewSession>();
  const [index, setIndex] = useState(0);
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
    try {
      const result = await loadReviewSummary(budgetMinutes);
      if (request !== summaryRequest.current) return;
      setSummary(result.summary);
      setCached(result.cached);
      setFetchedAt(result.fetchedAt);
      setError('');
      return result;
    } catch (e) {
      setError(String(e));
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
      await retainReviewSession(next);
      setSession(next);
      setPaused(false);
      setIndex(0);
      if (!next.instances.length)
        setNotice(
          request.kind === 'scheduled-review'
            ? 'Your review plan is complete for now. More work will become available on a later day.'
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
      setNotice('Your session is saved. Resume whenever you are ready.');
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
      setNotice('Session closed. Your drafts and attempts are saved.');
      setPaused(false);
      setSession(undefined);
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  }
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
  return (
    <div className="reading-column review-page">
      <div className="review-heading">
        <div>
          <div className="eyebrow">Spaced retrieval</div>
          <h1>{!paused && session?.kind === 'focused-practice' ? 'Focused Practice' : 'Review'}</h1>
        </div>
        <div className="toolbar">
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
        <p className="review-notice">
          Saved review plan{fetchedAt ? ' · ' + new Date(fetchedAt).toLocaleString() : ''}. Connect
          to refresh the queue. Saved tasks can be answered offline.
        </p>
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
                const next = nextReviewTaskIndex(session, index + 1, attempts, summary, fetchedAt);
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
          <h2>Session summary</h2>
          <p>
            {session.mode === 'quick' ? 'Quick tasks visited.' : 'All tasks visited.'} Submitted
            answers remain available in this session.
          </p>
          <p>You can stop here for today. Other work can wait for a later session.</p>
          <p className="muted">
            Queued or grading answers update your schedule after server processing.
          </p>
          <div className="toolbar">
            <button onClick={() => setIndex(0)}>Revisit tasks</button>
            <button className="primary" onClick={() => void pause()}>
              Return to overview
            </button>
          </div>
        </div>
      ) : (
        <>
          <p>
            Keep what you have learned with a manageable daily session. Most reviews are quick
            retrieval, with occasional deeper work.
          </p>
          {session && paused && (
            <section className="review-panel" aria-label="Saved review session">
              <h2>Your saved session</h2>
              <p>
                {session.instances.length} planned tasks are still available, along with your drafts
                and answers. Resuming uses the same plan.
              </p>
              <div className="toolbar">
                <button className="primary" onClick={() => void resume()}>
                  Resume planned session
                </button>
                <button onClick={() => void finish()}>End session</button>
              </div>
              <p className="muted">
                End this session when you want to choose a new one.
                {session.kind === 'scheduled-review' &&
                  " Its estimated time still counts toward today's review target."}
              </p>
            </section>
          )}
          {summary ? (
            <>
              <label className="review-budget">
                Daily review target
                <select
                  value={budgetMinutes}
                  onChange={(event) => setBudgetMinutes(Number(event.target.value))}
                >
                  {Array.from({ length: 12 }, (_, index) => (index + 1) * 5).map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minutes
                    </option>
                  ))}
                </select>
              </label>
              <div className="review-plan-heading">
                <strong>
                  {summary.estimatedMinutes === undefined
                    ? 'Your next session'
                    : `~${Math.ceil(summary.estimatedMinutes)} minutes`}
                </strong>
                <span>{paused ? 'Additional review' : 'Planned review'}</span>
              </div>
              <div className="review-counts" aria-label="Planned review summary">
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
                  disabled={busy || paused || !summary.due || summary.estimatedMinutes === 0}
                  onClick={() => void start({ kind: 'scheduled-review', mode: 'regular' })}
                >
                  Start Regular review
                </button>
                <button
                  disabled={busy || paused || !summary.quick || summary.estimatedMinutes === 0}
                  onClick={() => void start({ kind: 'scheduled-review', mode: 'quick' })}
                >
                  Start Quick review
                </button>
                <button disabled={busy} onClick={() => void refresh()}>
                  Refresh
                </button>
              </div>
              <p className="muted">
                Your target covers scheduled sessions planned in the last 24 hours. Extra work waits
                for a later day; there is no backlog to clear. Quick mode keeps input simple.
                {!!summary.reservedMinutes &&
                  ` About ${Math.ceil(summary.reservedMinutes)} minutes already planned today.`}
              </p>
              {!paused && (!summary.due || summary.estimatedMinutes === 0) && (
                <p>
                  Your plan is complete for now. You can stop here or choose focused practice below.
                </p>
              )}
              <section className="review-panel">
                <h2>Focused Practice</h2>
                <p>Choose optional extra work, including proofs, outside your daily review plan.</p>
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
                    <select value={mode} onChange={(e) => setMode(e.target.value as ReviewMode)}>
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
                  {busy ? 'Planning…' : 'Start focused practice'}
                </button>
              </section>
              <details className="review-targets">
                <summary>Review schedule · {summary.targets.length} active targets</summary>
                {summary.targets.map((t) => (
                  <article key={t.id}>
                    <strong>
                      {names(t.concept, summary.concepts)} · {names(t.skill, summary.skills)}
                    </strong>
                    {t.objective && <div className="muted">{t.objective.replaceAll('-', ' ')}</div>}
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
  );
}
