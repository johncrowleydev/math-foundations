import { useEffect, useState } from 'react';
import { all, useRevision } from './storage';
import type { Attempt, Curriculum } from './types';
import { conceptRows, evidenceCoverage, metadata, summarize, verdict } from './analytics';
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
    [error, setError] = useState('');
  useEffect(() => {
    setScope(slug);
    setSelected('');
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
        Observed evidence, not a mastery rating. Concept metrics use primary relationships only;
        supporting relationships are shown separately.
      </p>
      <div className="evidence-metrics">
        <div>
          <strong>{rate(s)}</strong>
          <span>First gradable attempt correct</span>
        </div>
        <div>
          <strong>{s.correction}</strong>
          <span>Exercises with a correction</span>
        </div>
        <div>
          <strong>{s.totalAttempts}</strong>
          <span>Total submissions</span>
        </div>
        <div>
          <strong>
            {s.completed} / {keys.size}
          </strong>
          <span>Exercises completed</span>
        </div>
      </div>
      <p>
        {s.substantive} substantive-error attempts · {s.minor} minor/clerical · {s.unknown}{' '}
        incorrect with no diagnosis · {s.notGraded} ungraded/technical. Rechecks stay within their
        original submission.
      </p>
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
      <h2>Needs attention</h2>
      {rows.some((r) => r.attention.length) ? (
        <div className="attention-list">
          {rows
            .filter((r) => r.attention.length)
            .map((r) => (
              <button key={r.id} aria-label={r.name} onClick={() => setSelected(r.id)}>
                <strong>{r.name}</strong>
                <span>{r.attention.join(' · ')}</span>
              </button>
            ))}
        </div>
      ) : (
        <p>
          {!coverage.observed
            ? coverage.missing
              ? 'Concept evidence is incomplete: these submissions have no usable graded concept snapshots yet. Attention patterns cannot be assessed from them.'
              : 'No graded concept evidence yet. Submit exercises to begin seeing patterns.'
            : 'No repeated patterns meet the attention rules yet. This is not a claim of mastery.'}
        </p>
      )}
      {coverage.observed && coverage.missing > 0 && (
        <p className="muted">
          Patterns use only mapped submissions; {coverage.missing} submissions are excluded because
          their historical concept metadata is missing.
        </p>
      )}
      <h2>Concept evidence</h2>
      <p className="muted">
        {coverage.mapped} of {as.length} submissions have concept snapshots.
        {coverage.missing > 0 &&
          ' Missing snapshots may arrive on sync. Historical tasks that differ from the current exercise remain excluded from concept metrics.'}
      </p>
      <div className="evidence-scroll concept-evidence" id="concept-evidence">
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
      <h2>Error breakdown</h2>
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
      <details>
        <summary>All submissions ({as.length})</summary>
        {[...as].sort((a, b) => b.submitted - a.submitted).map(source)}
      </details>
    </div>
  );
}
