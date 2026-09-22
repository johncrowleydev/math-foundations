import { ExerciseStatus } from './ExerciseStatus';
import { exerciseKey } from './exerciseIdentity';
import { Review } from './Review';
import { ReviewLibrary } from './ReviewLibrary';
import { authSession, signOut } from './auth';
import { useEffect, useLayoutEffect, useRef, useState, useMemo, Suspense } from 'react';
import { BookOpen, Menu, Settings as SettingsIcon, WifiOff } from 'lucide-react';
import { readRoute, routeHash, resolveReadingSection, type AppRoute } from './routing';
import { registerSW } from 'virtual:pwa-register';
import type { Curriculum, Lesson, RecordData, Formula, Attempt, Draft } from './types';
import { questionLabel } from './types';
import { ContentContext, Rich, MathText, Modal, Copy } from './Rich';
import { LessonRuntime, LessonReady, lessonComponents } from './LessonDocument';
import { lessonDocument } from './lessonModules';
import { Exercise } from './Exercise';
import { GradingToasts } from './GradingToasts';
import { lessonReview } from './lessonReview';
import { recommendedPractice, practiceMinutes } from './learningPractice';
import { PracticeSupport } from './PracticeSupport';
import { Progress } from './Progress';
import { expose } from './exposure';
import {
  all,
  lessonProgress,
  readingBookmark,
  get,
  put,
  useRevision,
  exportData,
  importData,
  clearLocalWork,
  type ImportArchive,
} from './storage';
import { connected, initializeSync, initialSyncComplete, mutation, sync, syncStatus } from './sync';
export function App({ data }: { data: Curriculum }) {
  const [quickAnchor, setQuickAnchor] = useState<{ x: number; y: number }>();
  const [route, setRoute] = useState(() =>
    readRoute(location.hash, data.lessons, localStorage.getItem('lesson')),
  );
  const restoreBookmark = useRef(!location.hash);
  const initialRoute = useRef(route);
  const { slug, tab } = route;
  const navigate = (next: AppRoute, replace = false) => {
    const hash = routeHash(next);
    if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState'](null, '', hash);
    setRoute(next);
  };
  const [drawer, setDrawer] = useState(false),
    [outline, setOutline] = useState(false),
    [settings, setSettings] = useState(false),
    [reference, setReference] = useState<string[]>([]),
    [quickRef, setQuickRef] = useState<string | null>(null),
    [formula, setFormula] = useState<Formula | null>(null),
    [active, setActive] = useState(''),
    [two, setTwo] = useState(localStorage.getItem('two-finger') === 'true'),
    [tutorials, setTutorials] = useState(false),
    [update, setUpdate] = useState<(() => Promise<void>) | null>(null);
  const reader = useRef<HTMLElement>(null);
  const lesson = data.lessons.find((l) => l.slug === slug) || data.lessons[0];
  const [loadedLesson, setLoadedLesson] = useState('');
  const recommended = recommendedPractice(lesson);
  const recommendedIds = new Set(recommended.map((question) => question.id));
  const extra = lesson.questions.filter((question) => !recommendedIds.has(question.id));
  const revision = useRevision();
  const [exerciseNav, setExerciseNav] = useState(false);
  const [progress, setProgress] = useState<{ status: string; at: number }[]>([]);
  const practice = Math.max(
    0,
    lesson.questions.findIndex((q) => String(q.id) === route.exercise),
  );
  useEffect(() => {
    const restore = () => {
      const next = readRoute(location.hash, data.lessons, localStorage.getItem('lesson'));
      if (location.hash !== routeHash(next)) history.replaceState(null, '', routeHash(next));
      setRoute(next);
      setOutline(false);
      setDrawer(false);
      setExerciseNav(false);
      setReference([]);
    };
    const canonical = routeHash(
      readRoute(location.hash, data.lessons, localStorage.getItem('lesson')),
    );
    if (location.hash !== canonical) history.replaceState(null, '', canonical);
    window.addEventListener('popstate', restore);
    window.addEventListener('hashchange', restore);
    return () => {
      window.removeEventListener('popstate', restore);
      window.removeEventListener('hashchange', restore);
    };
  }, [data.lessons]);
  useEffect(() => {
    // Only an unaddressed app launch resumes a local bookmark. Explicit URLs win.
    if (!restoreBookmark.current || route !== initialRoute.current) return;
    if (tab !== 'read' || route.section) return;
    let live = true;
    void readingBookmark(lesson)
      .then((bookmark) => {
        if (!live || !bookmark) return;
        const target = resolveReadingSection(data.lessons, bookmark.slug, bookmark.anchor);
        if (!target || (bookmark.slug !== lesson.slug && target.lesson.slug !== lesson.slug))
          return;
        navigate({ slug: target.lesson.slug, tab: 'read', section: target.section.id }, true);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [lesson, tab, route, data.lessons]);
  const positionKey = lesson.slug + ':' + tab;
  const positions = useRef<Record<string, number>>({});
  useLayoutEffect(() => {
    if (tab === 'read' && loadedLesson !== lesson.slug) return;
    reader.current!.scrollTop =
      positions.current[positionKey] ??
      (Number(localStorage.getItem('scroll:' + positionKey)) || 0);
    if (tab === 'read' && route.section) {
      const target = document.getElementById('section-' + route.section);
      if (target && reader.current) {
        reader.current.scrollTop +=
          target.getBoundingClientRect().top - reader.current.getBoundingClientRect().top - 12;
        setActive('section-' + route.section);
      }
    }
  }, [positionKey, route.section, loadedLesson]);
  useEffect(() => {
    if (tab !== 'practice') return;
    const selected = document.querySelector<HTMLElement>(
      exerciseNav ? '.practice-sheet .selected' : '.practice-sidebar .selected',
    );
    const container = selected?.closest<HTMLElement>(exerciseNav ? '.modal' : '.practice-sidebar');
    if (selected && container) {
      const item = selected.getBoundingClientRect(),
        bounds = container.getBoundingClientRect();
      if (item.top < bounds.top || item.bottom > bounds.bottom)
        container.scrollTop += item.top - bounds.top - 80;
    }
  }, [practice, tab, exerciseNav]);
  useEffect(() => {
    let live = true;
    void (async () => {
      const { attempts, drafts, saved } = await lessonProgress(
        lesson,
        lesson.questions.map((q) => q.id),
      );
      if (!live) return;
      const states = lesson.questions.map((q, i) => {
        const history = attempts.filter((a) => a.exercise === exerciseKey(lesson, q.id));
        const draft = drafts[i];
        const hasDraft =
          draft && (draft.text.trim() || draft.strokes.length || draft.photos.length);
        const status = history.some((a) => a.verdict === 'correct')
          ? 'Correct'
          : history.some((a) => ['queued', 'pending', 'grading', 'rechecking'].includes(a.status))
            ? 'Grading'
            : history.some((a) => a.verdict === 'incorrect')
              ? 'Try again'
              : history.length
                ? 'Needs attention'
                : hasDraft
                  ? 'Draft'
                  : initialSyncComplete
                    ? 'Not attempted'
                    : 'Syncing';
        return {
          status,
          at: Math.max(0, ...history.map((a) => a.submitted), hasDraft ? draft.updated : 0),
        };
      });
      setProgress(states);
      if (tab === 'practice' && !route.exercise) {
        let index = Math.min(
          lesson.questions.length - 1,
          Math.max(0, Number(saved?.payload.value) || 0),
        );
        let newest = saved?.updated || 0;
        states.forEach((s, i) => {
          if (s.at > newest) {
            index = i;
            newest = s.at;
          }
        });
        if (!newest)
          index = Math.max(
            0,
            lesson.questions.findIndex(
              (question, index) =>
                recommendedIds.has(question.id) && states[index]?.status !== 'Correct',
            ),
          );
        navigate(
          { slug: lesson.slug, tab: 'practice', exercise: String(lesson.questions[index].id) },
          true,
        );
      }
    })();
    return () => {
      live = false;
    };
  }, [lesson, revision, tab, route.exercise]);
  useEffect(() => {
    void initializeSync();
    const updater = registerSW({
      onNeedRefresh() {
        setUpdate(() => () => updater(true));
      },
    });
    return () => {};
  }, []);
  useEffect(() => {
    localStorage.setItem('lesson', lesson.slug);
    setActive('');
    void get<RecordData>('records', 'preference/tex:visible:v2:' + lesson.slug).then((r) =>
      setTutorials(r?.payload.value === true || r?.payload.value === 'true'),
    );
  }, [lesson.slug]);
  useEffect(() => {
    if (tab !== 'read' || loadedLesson !== lesson.slug) return;
    const el = reader.current!;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            setActive(e.target.id);
            clearTimeout(timer);
            timer = setTimeout(() => {
              if (!document.hidden)
                for (const t of data.evidence.teaching.filter(
                  (t) =>
                    t.lesson === lesson.slug && t.section === e.target.getAttribute('data-title'),
                ))
                  void expose(t.concept, 'lesson', lesson.slug + ':' + t.section).catch(() => {});
              void put('settings', 'bookmark:' + lesson.slug, { anchor: e.target.id });
              void get<string>('settings', 'device').then(
                (device) =>
                  void mutation('reading/' + (device || 'web') + ':' + lesson.slug, {
                    slug: lesson.slug,
                    anchor: e.target.id.replace('section-', 'section:'),
                    section: e.target.getAttribute('data-title'),
                    at: Date.now(),
                  }),
              );
            }, 1500);
          }
      },
      { root: el, rootMargin: '0px 0px -75% 0px' },
    );
    el.querySelectorAll('[data-section]').forEach((s) => observer.observe(s));
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [lesson.slug, tab, loadedLesson]);
  useEffect(() => {
    const el = reader.current!;
    if (!two || tab !== 'read') return;
    let y = 0;
    const start = (e: TouchEvent) => {
      if (
        (e.target as HTMLElement).closest(
          'button,input,textarea,.cm-editor,canvas,.exercise,.figure,details',
        )
      )
        return;
      if (e.touches.length === 2) y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    };
    const move = (e: TouchEvent) => {
      if (
        (e.target as HTMLElement).closest(
          'button,input,textarea,.cm-editor,canvas,.exercise,.figure,details',
        )
      )
        return;
      e.preventDefault();
      if (e.touches.length === 2) {
        const next = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        el.scrollTop += y - next;
        y = next;
      }
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
    };
  }, [two, tab]);
  const choose = (l: string) => {
    navigate({ slug: l, tab: 'read' });
    setDrawer(false);
    setOutline(false);
  };
  const jump = (id: string) => {
    const target = document.getElementById(id);
    const container = reader.current;
    if (target && container)
      container.scrollTop +=
        target.getBoundingClientRect().top - container.getBoundingClientRect().top - 12;
    setActive(id);
    setOutline(false);
  };
  const Document = lessonDocument(lesson.slug);
  const nav = (
    <>
      <div className="brand">
        <BookOpen size={26} />
        <span>foundations</span>
      </div>
      <div className="course">
        <span className="eyebrow">Your notebook</span>
        <h3>Mathematics</h3>
      </div>
      <nav className="chapters">
        {data.lessons.map((l, i) => (
          <div key={l.slug}>
            {(i === 0 || l.subject !== data.lessons[i - 1].subject) && (
              <h3 className="exercise-group">{l.subject}</h3>
            )}
            <button
              key={l.slug}
              className={l.slug === lesson.slug ? 'selected' : ''}
              onClick={() => choose(l.slug)}
            >
              <span>{String(l.number ?? i + 1).padStart(2, '0')}</span>
              {l.title}
            </button>
          </div>
        ))}
      </nav>
    </>
  );
  const selectExercise = (index: number) => {
    navigate({ slug: lesson.slug, tab: 'practice', exercise: String(lesson.questions[index].id) });
    setExerciseNav(false);
    reader.current!.scrollTop = 0;
    void mutation('practice/position:' + lesson.slug, { value: index });
  };
  const q = lesson.questions[Math.min(practice, lesson.questions.length - 1)];
  const extraSelected = !!q && !recommendedIds.has(q.id);
  const sequence = extraSelected ? extra : recommended;
  const sequenceIndex = sequence.findIndex((question) => question.id === q?.id);
  const selectQuestion = (id: number) =>
    selectExercise(lesson.questions.findIndex((question) => question.id === id));
  const practiceButtons = (questions: typeof lesson.questions) =>
    questions.map((question, position) => {
      const index = lesson.questions.findIndex((candidate) => candidate.id === question.id);
      return (
        <div key={question.id}>
          {(position === 0 || question.section !== questions[position - 1].section) && (
            <h3 className="exercise-group">{question.section}</h3>
          )}
          <button
            className={'exercise-link ' + (practice === index ? 'selected' : '')}
            aria-current={practice === index ? 'step' : undefined}
            onClick={() => selectExercise(index)}
          >
            <span>{questionLabel(question)}</span>
            <ExerciseStatus status={progress[index]?.status || 'Not attempted'} />
          </button>
        </div>
      );
    });
  const practiceList = (
    <>
      <span className="eyebrow">Recommended practice</span>
      <p className="practice-summary">
        {
          recommended.filter(
            (question) => progress[lesson.questions.indexOf(question)]?.status === 'Correct',
          ).length
        }{' '}
        / {recommended.length} correct · ~{practiceMinutes(data, lesson, recommended)} min
      </p>
      <nav aria-label="Practice exercises">
        {practiceButtons(recommended)}
        {!!extra.length && (
          <details className="extra-practice" open={extraSelected || undefined}>
            <summary>Extra practice · {extra.length} optional</summary>
            <p className="muted">
              Choose more practice where it helps. Your previous work stays here.
            </p>
            {practiceButtons(extra)}
          </details>
        )}
      </nav>
    </>
  );
  return (
    <ContentContext.Provider
      value={useMemo(
        () => ({
          data,
          lesson: lesson.slug,
          reference: (id) => {
            const rect = document.activeElement?.getBoundingClientRect();
            setQuickAnchor(rect ? { x: rect.left, y: rect.bottom } : undefined);
            setQuickRef(id);
          },
          formula: setFormula,
        }),
        [data, lesson.slug],
      )}
    >
      <div className="app">
        <GradingToasts
          data={data}
          currentExercise={tab === 'practice' && q ? exerciseKey(lesson, q.id) : undefined}
        />
        <aside className="sidebar">{nav}</aside>
        <div className="workspace">
          <header className="topbar">
            <button
              className="mobile-only icon-button"
              aria-label="Chapters"
              onClick={() => setDrawer(true)}
            >
              <Menu size={20} />
            </button>
            <div className="chapter-title">
              <span className="eyebrow">
                {lesson.subject} ·{' '}
                {String(lesson.number ?? data.lessons.indexOf(lesson) + 1).padStart(2, '0')}
              </span>
              <strong>{lesson.title}</strong>
            </div>
            <nav className="tabs">
              {['read', 'practice', 'review', 'reference', 'progress'].map((t) => (
                <button
                  disabled={t === 'practice' && !lesson.questions.length}
                  title={
                    t === 'practice' && !lesson.questions.length
                      ? 'This introduction has no exercises'
                      : undefined
                  }
                  aria-current={
                    tab === t || (tab === 'review-library' && t === 'review') ? 'page' : undefined
                  }
                  className={
                    tab === t || (tab === 'review-library' && t === 'review') ? 'selected' : ''
                  }
                  key={t}
                  onClick={() => {
                    if (t !== tab) navigate({ slug: lesson.slug, tab: t as AppRoute['tab'] });
                  }}
                >
                  {t === 'read' ? 'Learn' : t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </nav>
            <button
              aria-label="Settings"
              className="settings-button"
              onClick={() => setSettings(true)}
            >
              <SettingsIcon size={16} />
              <span>Settings</span>
            </button>
          </header>
          {update && (
            <div className="update-banner">
              A new version is ready. Your saved drafts will be kept.{' '}
              <button onClick={() => void update()}>Reload</button>
            </div>
          )}
          {tab === 'read' && (
            <div className="reader-outline-bar">
              <button className="outline-toggle" onClick={() => setOutline(true)}>
                On this page
              </button>
            </div>
          )}
          <div className="body-layout">
            <main
              ref={reader}
              className="reader"
              id="reader"
              onScroll={() => {
                if (tab === 'read' && loadedLesson !== lesson.slug) return;
                const top = reader.current!.scrollTop;
                positions.current[positionKey] = top;
                localStorage.setItem('scroll:' + positionKey, String(top));
              }}
            >
              <div
                className="reading-column"
                style={{ display: tab === 'read' ? undefined : 'none' }}
              >
                <Suspense fallback={<p role="status">Loading lesson…</p>}>
                  <LessonRuntime data={data} lesson={lesson} tutorials={tutorials}>
                    <Document components={lessonComponents} />
                    <LessonReady slug={lesson.slug} onReady={setLoadedLesson} />
                  </LessonRuntime>
                </Suspense>
                <footer>
                  <button
                    disabled={data.lessons.indexOf(lesson) >= data.lessons.length - 1}
                    onClick={() => {
                      const next = data.lessons[data.lessons.indexOf(lesson) + 1];
                      if (next) choose(next.slug);
                    }}
                  >
                    Next chapter →
                  </button>
                </footer>
              </div>
              {tab === 'practice' && q ? (
                <div className="reading-column">
                  <div className="practice-heading">
                    <span className="muted">
                      {extraSelected ? 'Extra practice' : 'Recommended'} · {sequenceIndex + 1} of{' '}
                      {sequence.length}
                    </span>
                    <button className="exercise-nav-toggle" onClick={() => setExerciseNav(true)}>
                      Exercises
                    </button>
                  </div>
                  <PracticeSupport
                    key={exerciseKey(lesson, q.id)}
                    data={data}
                    lesson={lesson}
                    question={q}
                  >
                    <Exercise
                      key={exerciseKey(lesson, q.id)}
                      q={q}
                      lesson={lesson}
                      data={data}
                      review={lessonReview(data, lesson, q)}
                    />
                  </PracticeSupport>
                  <nav className="practice-nav" aria-label="Exercise navigation">
                    <button
                      disabled={sequenceIndex <= 0}
                      onClick={() => selectQuestion(sequence[sequenceIndex - 1].id)}
                    >
                      ← Previous
                    </button>
                    <button
                      disabled={sequenceIndex >= sequence.length - 1}
                      onClick={() => selectQuestion(sequence[sequenceIndex + 1].id)}
                    >
                      Next →
                    </button>
                  </nav>
                  {sequenceIndex === sequence.length - 1 && (
                    <p className="review-notice">
                      {extraSelected
                        ? 'End of this optional practice bank.'
                        : 'That is the recommended practice. You can move on; extra questions are available if you need them.'}
                    </p>
                  )}
                </div>
              ) : tab === 'review' ? (
                <Review data={data} lesson={lesson.slug} />
              ) : tab === 'review-library' ? (
                <ReviewLibrary data={data} lesson={lesson.slug} />
              ) : tab === 'progress' ? (
                <Progress
                  data={data}
                  slug={lesson.slug}
                  onExercise={(key) => {
                    for (const l of data.lessons) {
                      const q = l.questions.find((q) => exerciseKey(l, q.id) === key);
                      if (q) {
                        navigate({ slug: l.slug, tab: 'practice', exercise: String(q.id) });
                        break;
                      }
                    }
                  }}
                />
              ) : tab === 'reference' ? (
                <Library data={data} onOpen={(id) => setReference([id])} />
              ) : null}
            </main>
            {tab === 'practice' && <aside className="practice-sidebar">{practiceList}</aside>}
            {tab === 'read' && (
              <aside className="page-outline">
                <span className="eyebrow">On this page</span>
                {lesson.sections.map((s) => (
                  <button
                    key={s.id}
                    className={active === 'section-' + s.id ? 'selected' : ''}
                    onClick={() => jump('section-' + s.id)}
                  >
                    {s.title}
                  </button>
                ))}
              </aside>
            )}
            {reference.length > 0 && (
              <aside className="reference-panel">
                <header>
                  <button
                    disabled={reference.length === 1}
                    onClick={() => setReference(reference.slice(0, -1))}
                  >
                    ← Back
                  </button>
                  <button aria-label="Close reference" onClick={() => setReference([])}>
                    ✕
                  </button>
                </header>
                <ReferenceEntry
                  id={reference.at(-1)!}
                  data={data}
                  related={(id) => setReference([...reference, id])}
                  teaching={(slug, section) => {
                    choose(slug);
                    setReference([]);
                    setTimeout(
                      () =>
                        jump(
                          'section-' +
                            section
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/-$/, ''),
                        ),
                      100,
                    );
                  }}
                />
              </aside>
            )}
          </div>
          <div className="statusbar">
            <span>
              {!navigator.onLine && <WifiOff size={12} />} <SyncStatus />
            </span>
            {tab === 'read' && (
              <>
                <button
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setTwo(!two);
                    localStorage.setItem('two-finger', String(!two));
                  }}
                  onClick={() => {
                    setTwo(!two);
                    localStorage.setItem('two-finger', String(!two));
                  }}
                >
                  {two ? '2 fingers' : '1 finger'} to scroll
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {exerciseNav && (
        <Modal title="Exercises" onClose={() => setExerciseNav(false)}>
          <div className="practice-sheet">{practiceList}</div>
        </Modal>
      )}
      {drawer && (
        <Modal title="Chapters" onClose={() => setDrawer(false)}>
          {nav}
        </Modal>
      )}
      {outline && (
        <Modal title="On this page" onClose={() => setOutline(false)}>
          <div className="outline-sheet">
            {lesson.sections.map((s) => (
              <button
                className={active === 'section-' + s.id ? 'selected' : ''}
                key={s.id}
                onClick={() => jump('section-' + s.id)}
              >
                {s.title}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {settings && (
        <Settings
          data={data}
          onResume={(r) => {
            const l = data.lessons.find((l) => l.slug === r.payload.slug);
            if (!l) return;
            const target =
              resolveReadingSection(data.lessons, l.slug, String(r.payload.anchor || '')) ||
              resolveReadingSection(data.lessons, l.slug, String(r.payload.section || ''));
            navigate({
              slug: target?.lesson.slug || l.slug,
              tab: 'read',
              ...(target ? { section: target.section.id } : {}),
            });
            setSettings(false);
            setDrawer(false);
            setOutline(false);
            if (!target) setTimeout(() => jump('lesson-start'), 100);
          }}
          onClose={() => setSettings(false)}
          two={two}
          setTwo={(v) => {
            setTwo(v);
            localStorage.setItem('two-finger', String(v));
          }}
          tutorials={tutorials}
          setTutorials={(v) => {
            setTutorials(v);
            void mutation('preference/tex:visible:v2:' + lesson.slug, { value: v });
          }}
        />
      )}
      {quickRef && (
        <Modal
          anchor={quickAnchor}
          title={data.references.find((r) => r.id === quickRef)?.name || 'Definition'}
          onClose={() => setQuickRef(null)}
        >
          <Rich text={data.references.find((r) => r.id === quickRef)?.quick} />
          <button
            onClick={() => {
              setReference([quickRef]);
              setQuickRef(null);
            }}
          >
            Full explanation →
          </button>
        </Modal>
      )}
      {formula && (
        <Modal title="Reading this expression" onClose={() => setFormula(null)}>
          <MathText tex={formula.latex} display />
          <Rich text={formula.reading} />
          {formula.bindings.map((b, i) => (
            <p key={i}>
              <MathText tex={b.symbol} /> — {b.meaning}{' '}
              <button
                onClick={() => {
                  setReference([b.reference]);
                  setFormula(null);
                }}
              >
                Reference
              </button>
            </p>
          ))}
          <code>{formula.latex}</code> <Copy text={formula.latex} />
        </Modal>
      )}
    </ContentContext.Provider>
  );
}
function Library({ data, onOpen }: { data: Curriculum; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState(''),
    [kind, setKind] = useState('term'),
    [lesson, setLesson] = useState('');
  return (
    <div className="library">
      <h1>Reference library</h1>
      <div className="toolbar">
        <button className={kind === 'term' ? 'selected' : ''} onClick={() => setKind('term')}>
          Terms
        </button>
        <button className={kind === 'symbol' ? 'selected' : ''} onClick={() => setKind('symbol')}>
          Notation
        </button>
        <select
          aria-label="Filter by lesson"
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
        >
          <option value="">All lessons</option>
          {data.lessons.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.title}
            </option>
          ))}
        </select>
      </div>
      <input
        placeholder="Search names, symbols, or TeX…"
        aria-label="Search reference"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="reference-list">
        {data.references
          .filter(
            (r) =>
              r.kind === kind &&
              (!lesson || r.lesson === lesson) &&
              JSON.stringify([
                r.name,
                r.aliases,
                data.referenceSyntax.find((s) => s.reference === r.id)?.examples,
              ])
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((r) => (
            <button key={r.id} onClick={() => onOpen(r.id)}>
              <strong>{r.name}</strong>
              <Rich text={r.quick} />
            </button>
          ))}
      </div>
    </div>
  );
}
function ReferenceEntry({
  id,
  data,
  related,
  teaching,
}: {
  id: string;
  data: Curriculum;
  related: (id: string) => void;
  teaching: (slug: string, section: string) => void;
}) {
  const r = data.references.find((r) => r.id === id);
  if (!r) return <p>Reference unavailable.</p>;
  const syntax = data.referenceSyntax.find((s) => s.reference === id);
  return (
    <div className="reference-entry">
      <span className="eyebrow">{r.kind === 'symbol' ? 'Notation' : 'Term'}</span>
      <h2>{r.name}</h2>
      <Rich text={r.definition} />
      <h3>Example</h3>
      <Rich text={r.example} />
      <h3>Common confusion</h3>
      <Rich text={r.confusion} />
      <Sources catalog={data.sources} target={`reference:${r.id}`} />
      {!!syntax?.examples.length && (
        <>
          <h3>Type this notation</h3>
          {syntax.examples.map((s) => (
            <div key={s}>
              <pre>{s}</pre>
              <Copy text={s} />
            </div>
          ))}
        </>
      )}
      <button onClick={() => teaching(r.lesson, r.section)}>Go to teaching section →</button>
      <h3>Related</h3>
      <div className="toolbar">
        {r.related.map((id) => (
          <button key={id} onClick={() => related(id)}>
            {data.references.find((r) => r.id === id)?.name || id}
          </button>
        ))}
      </div>
    </div>
  );
}
function Settings({
  data,
  onResume,
  onClose,
  two,
  setTwo,
  tutorials,
  setTutorials,
}: {
  data: Curriculum;
  onResume: (record: RecordData) => void;
  onClose: () => void;
  two: boolean;
  setTwo: (v: boolean) => void;
  tutorials: boolean;
  setTutorials: (v: boolean) => void;
}) {
  const [loadedLesson, setLoadedLesson] = useState('');
  const revision = useRevision();
  const [bookmarks, setBookmarks] = useState<RecordData[]>([]);
  useEffect(() => {
    void all<RecordData>('records').then((rs) =>
      setBookmarks(
        rs
          .filter((r) => r.key.startsWith('reading/'))
          .sort((a, b) => Number(b.payload.at) - Number(a.payload.at))
          .slice(0, 8),
      ),
    );
  }, [revision]);
  const [error, setError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [archives, setArchives] = useState<ImportArchive[]>([]);
  useEffect(() => {
    void all<ImportArchive>('imports').then(setArchives);
  }, [revision]);
  const downloadBackup = (blob: Blob, name: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <Modal title="Settings" onClose={onClose}>
      <h3>Account</h3>
      <p>{authSession()?.email}</p>
      <div className="toolbar">
        <button onClick={() => void sync()}>Sync now</button>
        <button onClick={() => void signOut()}>Sign out</button>
      </div>
      {error && <p role="alert">{error}</p>}
      <hr />
      <h3>Reading</h3>
      {!!bookmarks.length && (
        <details>
          <summary>Resume a synced reading position</summary>
          {bookmarks.map((r) => (
            <button key={r.key} onClick={() => onResume(r)}>
              {String(r.payload.section || r.payload.slug)} ·{' '}
              {new Date(Number(r.payload.at)).toLocaleDateString()}
            </button>
          ))}
        </details>
      )}
      <label className="check">
        <input type="checkbox" checked={two} onChange={(e) => setTwo(e.target.checked)} />
        Two-finger scrolling in the lesson reader
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={tutorials}
          onChange={(e) => setTutorials(e.target.checked)}
        />
        Expand typing tutorials in this chapter
      </label>
      <hr />
      <h3>Local work</h3>
      <p>
        Drafts save in this browser. Submitted attempts sync. Install this app from your browser for
        an app-like window; lessons and downloaded work remain available offline.
      </p>
      <button
        onClick={() =>
          void exportData(data.evidence).then((b) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(b);
            a.download = 'foundations-backup.json';
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 1000);
          })
        }
      >
        Export local work
      </button>
      <label className="button">
        Import local work
        <input
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            setError('');
            try {
              const result = await importData(file, file.name);
              setImportMessage(
                `Imported ${result.imported} entries. ${result.conflicts ? result.conflicts + ' existing entries kept; the original backup is retained below.' : 'No conflicts.'}`,
              );
              void sync();
            } catch (e) {
              setError(String(e));
            }
          }}
        />
      </label>
      {importMessage && <p role="status">{importMessage}</p>}
      {!!archives.length && (
        <details>
          <summary>Retained imports</summary>
          {archives.map((a, i) => (
            <p key={i}>
              <button onClick={() => downloadBackup(a.blob, a.name)}>{a.name}</button> ·{' '}
              {a.conflicts} conflicts preserved in backup
            </p>
          ))}
        </details>
      )}
      <details>
        <summary>Remove local work</summary>
        <p>
          This removes drafts, queued submissions, and downloaded work from this browser. Server
          work is kept. Export anything you need first.
        </p>
        <button
          onClick={async () => {
            if (
              !confirm(
                'Remove all local work from this browser? Unsynced drafts and submissions will be deleted.',
              )
            )
              return;
            await signOut();
            await clearLocalWork();
            location.reload();
          }}
        >
          Remove local work and sign out
        </button>
      </details>
    </Modal>
  );
}

function SyncStatus() {
  useRevision('sync');
  return <>{connected() ? syncStatus : ''}</>;
}
import { Sources } from './Sources';
