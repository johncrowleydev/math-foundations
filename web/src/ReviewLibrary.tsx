import { useEffect, useMemo, useState } from 'react';
import { Rich } from './Rich';
import { Sources } from './Sources';
import { loadReviewCatalog, previewReviewTemplate } from './reviewApi';
import {
  coverageObservations,
  emptyCatalogFilters,
  filterReviewCatalog,
  reviewCoverage,
  type CatalogFilters,
} from './reviewCatalog';
import type { ReviewCatalog, ReviewCatalogItem, ReviewCatalogPreview } from './reviewTypes';
import { routeHash } from './routing';
import type { Curriculum, Question } from './types';
import { StructuredAnswer } from './StructuredAnswer';

const provenanceName = (value: string) =>
  value === 'lesson-exercise' ? 'Lesson exercise' : 'Review template';

export function ReviewLibrary({ data, lesson }: { data: Curriculum; lesson: string }) {
  const [catalog, setCatalog] = useState<ReviewCatalog>();
  const [error, setError] = useState('');
  const [request, setRequest] = useState(0);
  const [filters, setFilters] = useState<CatalogFilters>({ ...emptyCatalogFilters });
  const [view, setView] = useState<'items' | 'coverage'>('items');
  const [page, setPage] = useState(0);
  const pageSize = 40;
  useEffect(() => setPage(0), [filters]);
  useEffect(() => {
    let cancelled = false;
    setError('');
    void loadReviewCatalog().then(
      (result) => {
        if (!cancelled) setCatalog(result);
      },
      (cause) => {
        if (!cancelled) setError(String(cause));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [request]);
  const filtered = useMemo(
    () => filterReviewCatalog(catalog?.items || [], filters),
    [catalog, filters],
  );
  const coverage = useMemo(() => reviewCoverage(filtered), [filtered]);
  const name = (key: 'concept' | 'skill' | 'lesson', id: string) =>
    key === 'lesson'
      ? data.lessons.find((l) => l.slug === id)?.title || id
      : (key === 'concept' ? data.evidence.concepts : data.evidence.skills).find((x) => x.id === id)
          ?.name || id;
  const setFilter = (key: keyof CatalogFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const activeCount = Object.values(filters).filter(Boolean).length;
  const options = (key: 'lesson' | 'concept' | 'skill' | 'objective') =>
    [
      ...new Set(
        catalog?.items.map((item) => item[key]).filter((value): value is string => Boolean(value)),
      ),
    ].sort((a, b) => a.localeCompare(b));
  return (
    <div className="reading-column review-library-page">
      <div className="review-heading">
        <div>
          <div className="eyebrow">Authoring & audit</div>
          <h1>Review Library</h1>
        </div>
        <a href={routeHash({ slug: lesson, tab: 'review' })}>Back to Review</a>
      </div>
      <p className="library-intro">
        Inspect the effective templates available to the review scheduler, including reused lesson
        exercises. Content comes from source-controlled curriculum; this view does not change your
        schedule.
      </p>
      {error ? (
        <div className="review-panel" role="alert">
          <p>Could not load the review catalog. Connect to the server and try again.</p>
          <p className="muted">{error}</p>
          <button onClick={() => setRequest((n) => n + 1)}>Retry catalog</button>
        </div>
      ) : !catalog ? (
        <p role="status">Loading review catalog…</p>
      ) : (
        <>
          <section className="library-filter-panel" aria-label="Catalog filters">
            <label className="library-search">
              Search catalog
              <input
                type="search"
                placeholder="Concept, objective, prompt, lesson or template ID"
                value={filters.search}
                onChange={(e) => setFilter('search', e.target.value)}
              />
            </label>
            <div className="library-filter-actions toolbar">
              <button
                onClick={() =>
                  setFilters({ ...emptyCatalogFilters, skill: 'recall', objective: ':present' })
                }
              >
                Definition objectives
              </button>
              <button
                disabled={!activeCount}
                onClick={() => setFilters({ ...emptyCatalogFilters })}
              >
                Clear filters
              </button>
              <span className="muted">
                {activeCount
                  ? `${activeCount} active filter${activeCount === 1 ? '' : 's'}`
                  : 'All content'}
              </span>
            </div>
            <details className="library-filters">
              <summary>Filter catalog{activeCount ? ` · ${activeCount} active` : ''}</summary>
              <div className="review-filters library-filter-grid">
                {(['lesson', 'concept', 'skill'] as const).map((key) => (
                  <label key={key}>
                    {key[0].toUpperCase() + key.slice(1)}
                    <select value={filters[key]} onChange={(e) => setFilter(key, e.target.value)}>
                      <option value="">All {key}s</option>
                      {options(key).map((id) => (
                        <option key={id} value={id}>
                          {name(key, id)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <label>
                  Objective
                  <select
                    value={filters.objective}
                    onChange={(e) => setFilter('objective', e.target.value)}
                  >
                    <option value="">All objectives</option>
                    <option value=":present">Objective present</option>
                    <option value=":none">No objective</option>
                    {options('objective').map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Family
                  <select
                    value={filters.family}
                    onChange={(e) => setFilter('family', e.target.value)}
                  >
                    <option value="">All families</option>
                    <option value="fixed">Fixed</option>
                    <option value="authored">Authored</option>
                    <option value="generated">Generated</option>
                  </select>
                </label>
                <label>
                  Evidence level
                  <select
                    value={filters.evidenceLevel}
                    onChange={(e) => setFilter('evidenceLevel', e.target.value)}
                  >
                    <option value="">All evidence levels</option>
                    <option value="recognition">Recognition</option>
                    <option value="production">Production</option>
                    <option value="reasoning">Reasoning / proof</option>
                  </select>
                </label>
                <label>
                  Quick compatibility
                  <select
                    value={filters.quick}
                    onChange={(e) => setFilter('quick', e.target.value)}
                  >
                    <option value="">Any compatibility</option>
                    <option value="yes">Quick-compatible</option>
                    <option value="no">Not Quick-compatible</option>
                  </select>
                </label>
                <label>
                  Provenance
                  <select
                    value={filters.provenance}
                    onChange={(e) => setFilter('provenance', e.target.value)}
                  >
                    <option value="">All origins</option>
                    <option value="lesson-exercise">Lesson exercise</option>
                    <option value="review-template">Dedicated review template</option>
                  </select>
                </label>
              </div>
            </details>
          </section>
          <div className="library-results-heading">
            <p role="status">
              {filtered.length} of {catalog.items.length} templates · {coverage.length} target
              {coverage.length === 1 ? '' : 's'}
            </p>
            <div className="toolbar" aria-label="Catalog view">
              <button aria-pressed={view === 'items'} onClick={() => setView('items')}>
                Templates
              </button>
              <button aria-pressed={view === 'coverage'} onClick={() => setView('coverage')}>
                Coverage
              </button>
            </div>
          </div>
          {!filtered.length ? (
            <div className="review-panel">
              <h2>
                {catalog.items.length
                  ? 'No matching review content'
                  : 'No effective review content'}
              </h2>
              <p>
                {catalog.items.length
                  ? 'Try a broader search or clear the filters.'
                  : 'The server catalog contains no eligible templates.'}
              </p>
            </div>
          ) : view === 'coverage' ? (
            <section className="library-coverage" aria-label="Review target coverage">
              <p className="muted">
                Counts reflect the current filters. Each effective template counts once; authored
                variants and generated samples are not counted separately. Targets absent from the
                effective catalog are not listed.
              </p>
              <p className="muted">
                Observations describe available evidence, not errors or requirements. A deep target
                may intentionally have no Quick template.
              </p>
              <div
                className="library-table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Coverage counts table"
              >
                <table className="library-coverage-table">
                  <caption>Templates per concept × skill × optional objective</caption>
                  <thead>
                    <tr>
                      <th scope="col">Target</th>
                      {[
                        'Quick',
                        'Recognition',
                        'Production',
                        'Reasoning',
                        'Fixed',
                        'Authored',
                        'Generated',
                      ].map((label) => (
                        <th scope="col" key={label}>
                          {label}
                        </th>
                      ))}
                      <th scope="col">Observations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverage.map((group) => (
                      <tr key={group.key}>
                        <th scope="row">
                          <button
                            className="library-target-button"
                            onClick={() => {
                              setFilters((current) => ({
                                ...current,
                                concept: group.concept,
                                skill: group.skill,
                                objective: group.objective || ':none',
                              }));
                              setView('items');
                            }}
                            title="Inspect templates for this target"
                          >
                            {group.concept} × {group.skill}
                            {group.objective ? ` × ${group.objective}` : ''}
                          </button>
                        </th>
                        {(
                          [
                            'quick',
                            'recognition',
                            'production',
                            'reasoning',
                            'fixed',
                            'authored',
                            'generated',
                          ] as const
                        ).map((key) => (
                          <td key={key}>{group[key]}</td>
                        ))}
                        <td>
                          <ul className="library-observations">
                            {coverageObservations(group).map((label) => (
                              <li key={label}>{label}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : (
            <>
              <div className="library-items">
                {filtered.slice(page * pageSize, (page + 1) * pageSize).map((item) => (
                  <CatalogItem key={item.id} item={item} data={data} />
                ))}
              </div>
              {filtered.length > pageSize && (
                <nav className="library-pagination" aria-label="Template pages">
                  <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                    Previous templates
                  </button>
                  <span>
                    {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of{' '}
                    {filtered.length}
                  </span>
                  <button
                    disabled={(page + 1) * pageSize >= filtered.length}
                    onClick={() => setPage(page + 1)}
                  >
                    Next templates
                  </button>
                </nav>
              )}
            </>
          )}
          <details className="library-version">
            <summary>Catalog build</summary>
            <p>
              Content version: <code>{catalog.contentVersion}</code>
            </p>
          </details>
        </>
      )}
    </div>
  );
}

function CatalogItem({ item, data }: { item: ReviewCatalogItem; data: Curriculum }) {
  const [expanded, setExpanded] = useState(false);
  const lesson = data.lessons.find((l) => l.slug === item.lesson);
  const original = item.originalExercise
    ? lesson?.questions.find((q) => `${item.lesson}-${q.id}` === item.originalExercise)
    : undefined;
  const concept = data.evidence.concepts.find((c) => c.id === item.concept)?.name || item.concept;
  return (
    <details
      className="review-library-item"
      data-template-id={item.id}
      onToggle={(e) => setExpanded(e.currentTarget.open)}
    >
      <summary>
        <span className="library-item-heading">
          <strong>{concept}</strong> · {item.skill}
        </span>
        {item.objective && <span className="library-objective">{item.objective}</span>}
        <span className="library-badges">
          <span>{item.family}</span>
          <span>{item.evidenceLevel}</span>
          <span>{item.quick ? 'Quick-compatible' : 'Regular only'}</span>
          {item.variantCount > 0 && <span>{item.variantCount} variants</span>}
        </span>
        <Rich
          className="library-prompt-preview"
          text={
            item.question.prompt ||
            (item.question.math ? '$' + item.question.math + '$' : item.question.instructions)
          }
        />
        <span className="library-item-origin">
          {provenanceName(item.provenance)} · {lesson?.title || item.lesson}
        </span>
      </summary>
      {expanded && (
        <div className="library-item-body">
          <dl className="library-metadata">
            {[
              ['Concept', item.concept],
              ['Skill', item.skill],
              ['Objective', item.objective || 'None'],
              ['Family', item.family],
              ['Evidence', item.evidenceLevel],
              ['Cognitive level', item.cognitiveLevel],
              ['Interaction', item.interactionCost],
              ['Quick', item.quick ? 'Yes' : 'No'],
              ['Input', item.inputCapabilities.join(', ')],
              ['Provenance', provenanceName(item.provenance)],
              ['Lesson', item.lesson],
              ['Authored variants', String(item.variantCount)],
              ['Template ID', item.id],
              ['Source target', item.sourceTarget],
              ['Authored origin', item.origin],
              ['Activation concepts', item.activationConcepts?.join(', ') || 'None specified'],
              ...(item.originalExercise ? [['Original exercise', item.originalExercise]] : []),
              ...(item.generator ? [['Generator', item.generator]] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {original && (
            <p>
              <a
                href={routeHash({
                  slug: item.lesson,
                  tab: 'practice',
                  exercise: String(original.id),
                })}
              >
                Open original lesson exercise
              </a>
            </p>
          )}
          <section className="library-question-section">
            <h3>
              {item.generated
                ? 'Generator template'
                : item.variants?.length
                  ? 'Question preview'
                  : 'Question'}
            </h3>
            <CatalogQuestion question={item.question} />
          </section>
          {item.variants?.map((question, index) => (
            <section className="library-question-section" key={index}>
              <h3>Authored variant {index + 1}</h3>
              <CatalogQuestion question={question} />
            </section>
          ))}
          {item.generated && <GeneratorPreview item={item} />}
          <Sources catalog={data.sources} target={item.sourceTarget} exercise />
        </div>
      )}
    </details>
  );
}

export function CatalogQuestion({ question: q }: { question: Question }) {
  return (
    <div className="library-question">
      {q.instructions && (
        <div>
          <h4>Instructions</h4>
          <Rich text={q.instructions} />
        </div>
      )}
      {(q.prompt || q.math) && (
        <div>
          <h4>Prompt</h4>
          <Rich text={q.prompt} />
          {q.math && <Rich text={'$$' + q.math + '$$'} />}
        </div>
      )}
      {q.assessment && (
        <div>
          <h4>Answer inputs</h4>
          <StructuredAnswer assessment={q.assessment} preview />
        </div>
      )}
      {q.table && !q.assessment && (
        <div className="library-question-table">
          <table>
            <caption>Response table · {q.table.rows} rows</caption>
            <thead>
              <tr>
                {q.table.columns.map((column, i) => (
                  <th key={i}>
                    <Rich text={'$' + column + '$'} />
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
      )}
      {q.choice && (
        <div>
          <h4>Choices</h4>
          <ol className="library-choices">
            {q.choice.options.map((option) => (
              <li key={option.id}>
                <div>
                  <code>{option.id}</code>
                  {q.choice?.correctOption === option.id && (
                    <strong className="library-correct">Correct answer</strong>
                  )}
                </div>
                <Rich text={option.text} />
                <div className="library-choice-feedback">
                  <span className="muted">Feedback</span>
                  <Rich text={option.feedback} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="library-answer">
        <h4>Answer</h4>
        {q.answer ? (
          <Rich text={q.answer} />
        ) : (
          <p className="muted">
            {q.choice
              ? `Correct option: ${q.choice.correctOption}`
              : 'No authored answer provided.'}
          </p>
        )}
      </div>
    </div>
  );
}

function GeneratorPreview({ item }: { item: ReviewCatalogItem }) {
  const [seed, setSeed] = useState('authoring-1');
  const [preview, setPreview] = useState<ReviewCatalogPreview>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function generate(nextSeed: string) {
    setSeed(nextSeed);
    setBusy(true);
    setError('');
    try {
      setPreview(await previewReviewTemplate(item.id, nextSeed));
    } catch (cause) {
      setError(
        'Could not generate the sample. Connect to the server and try again. ' + String(cause),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="library-generator" aria-label="Generator inspection">
      <h3>Generator sample</h3>
      <p className="muted">
        The server generates a repeatable sample from your seed. Previews do not create learner
        sessions or attempts.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void generate(seed);
        }}
      >
        <label>
          Seed
          <input
            value={seed}
            maxLength={200}
            required
            disabled={busy}
            onChange={(e) => setSeed(e.target.value)}
          />
        </label>
        <div className="toolbar">
          <button type="submit" disabled={busy || !seed.trim()}>
            {busy ? 'Generating…' : 'Generate sample'}
          </button>
          {preview && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void generate(crypto.randomUUID())}
            >
              Generate another sample
            </button>
          )}
        </div>
      </form>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {preview && (
        <div className="library-generated-preview">
          <p>
            <strong>Sample seed:</strong> <code>{preview.seed}</code>
          </p>
          <dl className="library-parameters">
            {Object.entries(preview.parameters).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <CatalogQuestion question={preview.question} />
        </div>
      )}
    </section>
  );
}
