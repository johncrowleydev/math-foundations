import { useEffect, useState } from 'react';
import { all, useRevision } from './storage';
import type { Attempt, Curriculum } from './types';
import {
  conceptRows,
  evidenceCoverage,
  exerciseProgress,
  metadata,
  summarize,
  verdict,
} from './analytics';
import { exposures } from './exposure';
import type { Exposure } from './evidenceTypes';
import { Rich } from './Rich';
export function Progress({
  data,
  slug,
  onExercise,
}: {
  data: Curriculum;
  slug: string;
  onExercise: (key: string) => void;
}) {
  const rev = useRevision();
  const [attempts, setAttempts] = useState<Attempt[]>([]),
    [encounters, setEncounters] = useState<Exposure[]>([]),
    [scope, setScope] = useState(slug),
    [selected, setSelected] = useState(''),
    [error, setError] = useState(''),
    [showAllConcepts, setShowAllConcepts] = useState(false),
    [exerciseFilter, setExerciseFilter] = useState('');
  useEffect(() => {
    setScope(slug);
    setSelected('');
    setShowAllConcepts(false);
    setExerciseFilter('');
  }, [slug]);
  useEffect(() => {
    if (selected) document.getElementById('concept-detail')?.scrollIntoView({ block: 'start' });
  }, [selected]);
  useEffect(() => {
    let live = true;
    void Promise.all([all<Attempt>('attempts'), exposures()])
      .then(([a, e]) => {
        if (live) {
          setAttempts(a);
          setEncounters(e);
        }
      })
      .catch((e) => setError(String(e)));
    return () => {
      live = false;
    };
  }, [rev]);
  const keys = new Set(
    data.lessons
      .filter((l) => !scope || l.slug === scope)
      .flatMap((l) => l.questions.map((q) => l.slug + '-' + q.id)),
  );
  const as = attempts.filter((a) => keys.has(a.exercise)),
    coverage = evidenceCoverage(as),
    s = summarize(as),
    rows = conceptRows(as, {
      ...data.evidence,
      exercises: Object.fromEntries(
        Object.entries(data.evidence.exercises).filter(([key]) => keys.has(key)),
      ),
    }).sort((a, b) => Number(b.summary.observed > 0) - Number(a.summary.observed > 0)),
    row = rows.find((r) => r.id === selected);
  const progress = exerciseProgress(as, keys);
  const groups = [
    { id: 'completed', name: 'Completed', keys: progress.completedKeys },
    { id: 'in-progress', name: 'Awaiting a correct result', keys: progress.inProgressKeys },
    { id: 'unattempted', name: 'Not yet submitted', keys: progress.unattemptedKeys },
  ];
  const filteredExercises = groups.find((g) => g.id === exerciseFilter);
  const percent = (value: number, total: number) => (total ? Math.round((100 * value) / total) : 0);
  const conceptOrder = [...rows].sort(
    (a, b) => Number(b.attention.length > 0) - Number(a.attention.length > 0),
  );
  const visibleConcepts = showAllConcepts ? conceptOrder : conceptOrder.slice(0, 5);
  const rate = (s: ReturnType<typeof summarize>) =>
    s.firstObserved
      ? `${s.firstCorrect} / ${s.firstObserved} (${Math.round((100 * s.firstCorrect) / s.firstObserved)}%)`
      : 'No first-attempt evidence';
  const label = (key: string) => {
    for (const l of data.lessons) {
      const q = l.questions.find((q) => l.slug + '-' + q.id === key);
      if (q) return `${l.title} · Exercise ${q.displayNumber}`;
    }
    return key;
  };
  const source = (a: Attempt) => (
    <details key={a.id} className="evidence-attempt">
      <summary>
        {label(a.exercise)} · {verdict(a) || a.status} · {new Date(a.submitted).toLocaleString()}
      </summary>
      <button onClick={() => onExercise(a.exercise)}>Open exercise →</button>
      <p className="muted">
        {!a.analytics
          ? 'No analytical snapshot exists for this legacy task. Included in overview counts, excluded from concept metrics.'
          : a.analytics.provenance === 'historical-backfill'
            ? 'Metadata backfilled from current authored catalog; original grade unchanged.'
            : 'Metadata captured at submission.'}
      </p>
      <Rich text={a.transcription || a.text || '(Image response; open exercise to inspect)'} />
      <p>
        Task attributes:{' '}
        {Object.entries(metadata(a, data.evidence)?.attributes || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ') || 'Not recorded'}
      </p>
      <p>
        {a.activeDurationMs === undefined
          ? 'Effort not recorded'
          : `Estimated active effort: ${Math.round(a.activeDurationMs / 1000)} seconds`}{' '}
        ·{' '}
        {a.unsure === true
          ? 'Learner marked unsure'
          : a.unsure === false
            ? 'Learner reported not unsure'
            : 'Uncertainty not reported'}
      </p>
      <p>
        Assistance:{' '}
        {a.assistance
          ? Object.entries(a.assistance)
              .filter(([, v]) => v)
              .map(([k]) => k)
              .join(', ') || 'None recorded'
          : 'Not recorded'}
        .
      </p>
      {a.grades.map((g, i) => (
        <details key={i}>
          <summary>
            Assessment {i + 1}: {g.verdict} · {g.model || 'Unknown grader'}
          </summary>
          <Rich text={g.feedback} />
          {g.reason && <Rich text={'Recheck: ' + g.reason} />}
          <p>
            Decision confidence: {g.confidence || 'Not recorded'}
            {g.notGradedReason && ' · ' + g.notGradedReason}
          </p>
          {g.requirements?.map((r) => (
            <p key={r.id}>
              {r.satisfied ? '✓' : '×'} {r.description}
            </p>
          ))}
          {g.diagnosis?.map((d, j) => (
            <p key={j}>
              {d.class} · {d.severity || 'Severity unspecified'} · {d.tags?.join(', ')}
            </p>
          ))}
        </details>
      ))}
    </details>
  );
  const breakdown = new Map<string, Attempt[]>();
  for (const { a, d } of s.diagnoses) {
    for (const k of ['Class: ' + d.class, ...(d.tags || []).map((t) => 'Tag: ' + t)])
      breakdown.set(k, [
        ...new Map([...(breakdown.get(k) || []), a].map((a) => [a.id, a])).values(),
      ]);
  }
  return (
    <div className="analytics">
      <header>
        <h1>Progress</h1>
        <label>
          Scope{' '}
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setSelected('');
              setShowAllConcepts(false);
              setExerciseFilter('');
            }}
          >
            <option value="">All lessons</option>
            {data.lessons
              .filter((l) => l.questions.length)
              .map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.title}
                </option>
              ))}
          </select>
        </label>
      </header>
      {error && <p role="alert">{error}</p>}
      <p className="muted">
        Your exercise progress and first-attempt results. These describe practice, not mastery.
      </p>
      <div className="progress-overview">
        <section className="progress-card completion-card" aria-label="Exercise completion">
          <h2>Exercise completion</h2>
          <div className="progress-value">
            <strong>{percent(progress.completed, keys.size)}%</strong>
            <span>
              {progress.completed} of {keys.size} completed
            </span>
          </div>
          <div className="completion-track" aria-hidden="true">
            {groups.map((g) => (
              <span
                key={g.id}
                className={g.id}
                style={{ width: `${keys.size ? (100 * g.keys.length) / keys.size : 0}%` }}
              />
            ))}
          </div>
          <div className="progress-legend">
            {groups.map((g) => (
              <button
                key={g.id}
                aria-pressed={exerciseFilter === g.id}
                onClick={() => setExerciseFilter(exerciseFilter === g.id ? '' : g.id)}
              >
                <i className={g.id} aria-hidden="true" />
                <strong>{g.keys.length}</strong> {g.name}
              </button>
            ))}
          </div>
          <p className="muted">
            Select a category to browse exercises. Unsubmitted drafts count as not yet submitted.
          </p>
        </section>
        <section className="progress-card" aria-label="First-attempt accuracy">
          <h2>Correct on first attempt</h2>
          <div className="progress-value">
            <strong>
              {s.firstObserved ? `${percent(s.firstCorrect, s.firstObserved)}%` : '—'}
            </strong>
            <span>
              {s.firstObserved
                ? `${s.firstCorrect} of ${s.firstObserved} first graded attempts`
                : 'No graded attempts yet'}
            </span>
          </div>
          <div className="accuracy-track" aria-hidden="true">
            <span style={{ width: `${percent(s.firstCorrect, s.firstObserved)}%` }} />
          </div>
          <p className="muted">
            Uses the first gradable submission for each exercise, including any updated assessment.
          </p>
        </section>
      </div>
      <p className="progress-context">
        <span>
          <strong>{s.totalAttempts}</strong> submissions
        </span>
        <span>
          <strong>{s.correction}</strong> exercises with an incorrect result
        </span>
        <span>
          <strong>{s.retries}</strong> retries
        </span>
      </p>
      {filteredExercises && (
        <section className="progress-exercises" aria-label={filteredExercises.name}>
          <h2>
            {filteredExercises.name}{' '}
            <span className="muted">({filteredExercises.keys.length})</span>
          </h2>
          <button onClick={() => setExerciseFilter('')}>Close list</button>
          {filteredExercises.keys.length ? (
            <div>
              {filteredExercises.keys.map((key) => (
                <button key={key} onClick={() => onExercise(key)}>
                  {label(key)} →
                </button>
              ))}
            </div>
          ) : (
            <p>No exercises in this category.</p>
          )}
        </section>
      )}
      {!scope && (
        <section className="lesson-progress">
          <h2>Progress by lesson</h2>
          {data.lessons
            .filter((l) => l.questions.length)
            .map((l) => {
              const p = exerciseProgress(
                as,
                l.questions.map((q) => l.slug + '-' + q.id),
              );
              return (
                <button
                  key={l.slug}
                  onClick={() => {
                    setScope(l.slug);
                    setSelected('');
                    setExerciseFilter('');
                    setShowAllConcepts(false);
                  }}
                >
                  <span>{l.title}</span>
                  <strong>
                    {p.completed} / {p.total}
                  </strong>
                  <span className="accuracy-track" aria-hidden="true">
                    <span style={{ width: `${percent(p.completed, p.total)}%` }} />
                  </span>
                </button>
              );
            })}
        </section>
      )}
      <details>
        <summary>How these counts work</summary>
        <p>
          First-try accuracy uses the earliest submitted attempt with a gradable result per exercise
          and its latest assessment, so overturned rechecks update that evidence. Ungraded attempts
          do not count as incorrect or retries. Retries are additional gradable submissions per
          exercise. Completion requires at least one currently correct attempt. Error counts use
          each attempt’s latest diagnosis; rechecks are not counted repeatedly. Missing diagnosis
          does not mean no error. Minor/clerical and substantive exclude technical and
          prompt-compliance from conceptual trouble signals. Submissions without a concept snapshot
          still contribute to overview counts.
        </p>
      </details>
      <section className="concept-chart" id="concept-evidence">
        <h2>Concept overview</h2>
        <p className="muted">
          First-attempt accuracy by concept. Concepts with attention patterns appear first; select a
          row to explore its evidence.
        </p>
        <div className="concept-chart-rows">
          {visibleConcepts.map((r) => (
            <button
              className="concept-chart-row"
              key={r.id}
              aria-expanded={selected === r.id}
              onClick={() => setSelected(selected === r.id ? '' : r.id)}
            >
              <span className="concept-chart-name">
                <strong>{r.name}</strong>
                <span>{r.summary.observed} exercises observed</span>
              </span>
              <span className="concept-chart-result">
                <span>
                  {r.summary.firstObserved
                    ? `${percent(r.summary.firstCorrect, r.summary.firstObserved)}%`
                    : '—'}{' '}
                  <small>
                    {r.summary.firstObserved
                      ? `${r.summary.firstCorrect} / ${r.summary.firstObserved} first attempts`
                      : r.primary.length || r.supporting.length
                        ? 'No first-attempt evidence'
                        : 'No concept evidence yet'}
                  </small>
                </span>
                <span className="accuracy-track" aria-hidden="true">
                  <span
                    style={{
                      width: `${percent(r.summary.firstCorrect, r.summary.firstObserved)}%`,
                    }}
                  />
                </span>
              </span>
              <span className="concept-signals">
                {r.attention.length ? (
                  r.attention.map((a) => (
                    <span key={a} title={a}>
                      {a === 'Repeated substantive errors'
                        ? 'Repeated errors'
                        : a === 'Multiple first-try misses within a skill'
                          ? 'First-attempt misses'
                          : 'Used assistance'}
                    </span>
                  ))
                ) : (
                  <span className="neutral">
                    {r.summary.observed ? 'No repeated pattern' : 'No graded evidence'}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
        {rows.length > 5 && (
          <button className="show-concepts" onClick={() => setShowAllConcepts(!showAllConcepts)}>
            {showAllConcepts ? 'Show fewer concepts' : `Show all ${rows.length} concepts`}
          </button>
        )}
        {!rows.length && <p>No concept evidence in this scope yet.</p>}
        <p className="muted">
          Concept bars use primary relationships only. {coverage.mapped} of {as.length} submissions
          have concept snapshots.
          {coverage.missing > 0 &&
            ` ${coverage.missing} submissions are excluded from concept metrics because their metadata is missing.`}
        </p>
      </section>
      <details className="concept-table-details">
        <summary>Detailed concept evidence</summary>
        <div className="evidence-scroll concept-evidence">
          <table>
            <thead>
              <tr>
                <th>Concept</th>
                <th>Exercises observed</th>
                <th>First try</th>
                <th>Retries</th>
                <th>Substantive</th>
                <th>Minor/clerical</th>
                <th>Last response</th>
                <th>Skills observed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <th>
                    <button
                      aria-expanded={selected === r.id}
                      onClick={() => setSelected(selected === r.id ? '' : r.id)}
                    >
                      {r.name}
                    </button>
                  </th>
                  <td>{r.summary.observed}</td>
                  <td title={rate(r.summary)}>{r.summary.firstObserved ? rate(r.summary) : '—'}</td>
                  <td>{r.summary.retries}</td>
                  <td>{r.summary.substantive}</td>
                  <td>{r.summary.minor}</td>
                  <td>{r.summary.last ? new Date(r.summary.last).toLocaleDateString() : '—'}</td>
                  <td>{[...r.skills.keys()].join(', ') || 'No evidence'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {row && (
        <section className="concept-detail" id="concept-detail">
          <button
            onClick={() => {
              setSelected('');
              document.getElementById('concept-evidence')?.scrollIntoView({ block: 'start' });
            }}
          >
            ← Concept evidence
          </button>
          <h2>{row.name}</h2>
          <p>
            {row.summary.retries} retries · {row.summary.substantive} substantive-error attempts ·{' '}
            {row.summary.minor} minor/clerical · {row.summary.unknown} incorrect with diagnosis not
            recorded.
          </p>
          <p>
            {row.supporting.length} supporting-role submissions (excluded from primary metrics).
          </p>
          <p>
            First recorded encounters:{' '}
            {encounters
              .filter((e) => e.concept === row.id)
              .map((e) => `${e.source}: ${new Date(e.at).toLocaleDateString()}`)
              .join(' · ') || 'Not recorded; historical exposure is unknown.'}
          </p>
          <h3>Concept × skill coverage</h3>
          <div className="evidence-scroll">
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Exercises observed</th>
                  <th>First try</th>
                </tr>
              </thead>
              <tbody>
                {[...row.skills].map(([skill, a]) => (
                  <tr key={skill}>
                    <th>{skill}</th>
                    <td>{summarize(a).observed}</td>
                    <td>{rate(summarize(a, as))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Representations observed</h3>
          <div className="evidence-scroll">
            <table>
              <thead>
                <tr>
                  <th>Representation</th>
                  <th>Exercises observed</th>
                  <th>First try</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...new Set(
                    row.primary.flatMap((a) => metadata(a, data.evidence)?.representations || []),
                  ),
                ].map((rep) => {
                  const s = summarize(
                    row.primary.filter((a) =>
                      metadata(a, data.evidence)?.representations.includes(rep),
                    ),
                    as,
                  );
                  return (
                    <tr key={rep}>
                      <th>{rep}</th>
                      <td>{s.observed}</td>
                      <td>{rate(s)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted">Skills not observed are gaps in evidence, not weaknesses.</p>
          {[
            ...new Set(
              [...row.primary, ...row.supporting]
                .map((a) => a.exercise)
                .concat(
                  Object.entries(data.evidence.exercises)
                    .filter(([k, m]) => keys.has(k) && m.concepts.some((c) => c.concept === row.id))
                    .map(([k]) => k),
                ),
            ),
          ].map((key) => (
            <details key={key}>
              <summary>{label(key)}</summary>
              {![...row.primary, ...row.supporting].some((a) => a.exercise === key) && (
                <p>
                  No concept-mapped attempts recorded.{' '}
                  {data.evidence.exercises[key]?.concepts.find((c) => c.concept === row.id)?.role} ·{' '}
                  {data.evidence.exercises[key]?.skills.map((s) => s.skill).join(', ')}{' '}
                  <button onClick={() => onExercise(key)}>Open exercise →</button>
                </p>
              )}
              {[...row.primary, ...row.supporting]
                .filter((a) => a.exercise === key)
                .map((a) => (
                  <div key={a.id}>
                    <p>
                      {metadata(a, data.evidence)?.concepts.find((c) => c.concept === row.id)?.role}{' '}
                      ·{' '}
                      {metadata(a, data.evidence)
                        ?.skills.map((x) => x.skill)
                        .join(', ')}{' '}
                      · {metadata(a, data.evidence)?.representations.join(', ')}
                    </p>
                    {source(a)}
                  </div>
                ))}
            </details>
          ))}
        </section>
      )}
      <h2>Error patterns</h2>
      <p className="muted">
        Counts of submissions, not exercises. Categories may overlap; bars scale to the largest
        count.
      </p>
      <div className="diagnostic-bars">
        {(
          [
            ['Substantive errors', s.substantive],
            ['Minor / clerical', s.minor],
            ['Incorrect, no diagnosis', s.unknown],
            ['Ungraded / technical', s.notGraded],
          ] as const
        ).map(([name, count]) => (
          <div key={name}>
            <span>{name}</span>
            <div className="accuracy-track" aria-hidden="true">
              <span
                style={{
                  width: `${percent(count, Math.max(s.substantive, s.minor, s.unknown, s.notGraded, 1))}%`,
                }}
              />
            </div>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <details>
        <summary>Detailed error breakdown</summary>
        {[...breakdown].map(([k, a]) => (
          <details key={k}>
            <summary>
              {k} · {a.length} attempts
            </summary>
            {a.map(source)}
          </details>
        ))}
        {!breakdown.size && (
          <p>
            No structured diagnoses available. Historical feedback has not been automatically
            classified.
          </p>
        )}
      </details>
      <details>
        <summary>All submissions ({as.length})</summary>
        {[...as].sort((a, b) => b.submitted - a.submitted).map(source)}
      </details>
    </div>
  );
}
