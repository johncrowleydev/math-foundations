import { useEffect, useState } from 'react';
import type { Attempt, Curriculum } from './types';
import type { ReviewMode, ReviewSession, ReviewSessionRequest, ReviewSummary } from './reviewTypes';
import { all, useRevision } from './storage';
import { Exercise } from './Exercise';
import {
  cachedReviewSession,
  loadReviewSummary,
  retainReviewSession,
  startReviewSession,
} from './reviewApi';

export function Review({ data }: { data: Curriculum }) {
  const [summary, setSummary] = useState<ReviewSummary>();
  const [cached, setCached] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number>();
  const [session, setSession] = useState<ReviewSession>();
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lesson, setLesson] = useState('');
  const [concept, setConcept] = useState('');
  const [skill, setSkill] = useState('');
  const [mode, setMode] = useState<ReviewMode>('regular');
  const revision = useRevision();
  async function refresh() {
    try {
      const result = await loadReviewSummary();
      setSummary(result.summary);
      setCached(result.cached);
      setFetchedAt(result.fetchedAt);
      setError('');
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    void refresh();
    void cachedReviewSession()
      .then(async (saved) => {
        if (!saved) return;
        const existing = await all<Attempt>('attempts');
        const next = saved.instances.findIndex(
          (item) => !existing.some((a) => a.exercise === item.exercise && a.verdict === 'correct'),
        );
        setSession(saved);
        setIndex(next < 0 ? saved.instances.length : next);
      })
      .catch((e) => setError(String(e)));
    window.addEventListener('online', refresh);
    return () => window.removeEventListener('online', refresh);
  }, []);
  useEffect(() => {
    void all<Attempt>('attempts').then(setAttempts);
  }, [revision]);
  const reviewStatus = attempts
    .filter((a) => a.review)
    .map((a) => a.id + ':' + a.status + ':' + a.verdict)
    .join(',');
  useEffect(() => {
    if (session) void refresh();
  }, [reviewStatus]);
  async function start(request: ReviewSessionRequest) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const next = await startReviewSession(request);
      await retainReviewSession(next);
      setSession(next);
      setIndex(0);
      if (!next.instances.length)
        setNotice('No compatible tasks in this selection. Try another scope or study mode.');
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function finish() {
    try {
      await retainReviewSession(null);
      setNotice(
        session?.mode === 'quick'
          ? 'Quick session finished. Deeper reviews remain available in Regular mode.'
          : 'Session finished. Your attempts are saved.',
      );
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
          <h1>{session?.kind === 'focused-practice' ? 'Focused Practice' : 'Review'}</h1>
        </div>
        {session && <button onClick={() => void finish()}>Back to overview</button>}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {cached && (
        <p className="review-notice">
          Saved due summary{fetchedAt ? ' · ' + new Date(fetchedAt).toLocaleString() : ''}. Connect
          to refresh the queue. Saved tasks can be answered offline.
        </p>
      )}
      {notice && (
        <p className="review-notice" role="status">
          {notice}
        </p>
      )}
      {session && item ? (
        <>
          <div className="practice-heading">
            <strong>
              {session.mode === 'quick' ? 'Quick' : 'Regular'} · {index + 1} of{' '}
              {session.instances.length}
            </strong>
            <span className="muted">
              {names(item.context.concept, summary?.concepts)} ·{' '}
              {names(item.context.skill, summary?.skills)}
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
          <Exercise
            key={item.id}
            q={item.question}
            lesson={item.lesson}
            data={data}
            instance={item}
          />
          <nav className="practice-nav" aria-label="Review navigation">
            <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
              ← Previous
            </button>
            <button
              onClick={() => {
                setIndex(index + 1);
                if (index + 1 === session.instances.length) void refresh();
              }}
            >
              {answered ? 'Next →' : pending ? 'Continue while grading →' : 'Skip for now →'}
            </button>
          </nav>
          {!answered && !pending && (
            <p className="muted">Skipping does not complete this target.</p>
          )}
        </>
      ) : session && session.instances.length > 0 ? (
        <div className="review-panel">
          <h2>Session finished</h2>
          <p>
            {session.mode === 'quick' ? 'Quick tasks visited.' : 'All tasks visited.'} Submitted
            answers remain available in this session.
          </p>
          {summary && (
            <p>
              {summary.due} due · {summary.quick} Quick-compatible · {summary.deeper} deeper reviews
              remain.
            </p>
          )}
          <p className="muted">
            Queued or grading answers update the due summary after server processing.
          </p>
          <div className="toolbar">
            <button onClick={() => setIndex(0)}>Revisit tasks</button>
            <button className="primary" onClick={() => void finish()}>
              Return to overview
            </button>
          </div>
        </div>
      ) : (
        <>
          <p>
            Retrieve what you have learned. Your schedule starts with active work, and adapts to the
            evidence in your answers.
          </p>
          {summary ? (
            <>
              <div className="review-counts" aria-label="Review due summary">
                <div>
                  <strong>{summary.due}</strong>
                  <span>Due</span>
                </div>
                <div>
                  <strong>{summary.quick}</strong>
                  <span>Quick-compatible</span>
                </div>
                <div>
                  <strong>{summary.deeper}</strong>
                  <span>Deeper</span>
                </div>
              </div>
              <div className="toolbar">
                <button
                  className="primary"
                  disabled={busy || !summary.due}
                  onClick={() => void start({ kind: 'scheduled-review', mode: 'regular' })}
                >
                  Start Regular review
                </button>
                <button
                  disabled={busy || !summary.quick}
                  onClick={() => void start({ kind: 'scheduled-review', mode: 'quick' })}
                >
                  Start Quick review
                </button>
                <button disabled={busy} onClick={() => void refresh()}>
                  Refresh
                </button>
              </div>
              <p className="muted">
                Quick filters for low-friction input. Deeper work keeps its due date until you
                demonstrate it.
              </p>
              {!summary.due && <p>No reviews due. You can choose focused practice below.</p>}
              <section className="review-panel">
                <h2>Focused Practice</h2>
                <p>Choose what to work on, whether or not it is due.</p>
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
                  disabled={busy}
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
