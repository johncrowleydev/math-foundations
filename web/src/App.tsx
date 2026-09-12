import { useEffect, useRef, useState } from 'react';
import { BookOpen, Menu, Settings as SettingsIcon, WifiOff } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import type { Curriculum, Block, Lesson, Quick, RecordData, Formula } from './types';
import { ContentContext, Rich, MathText, Modal, Copy } from './Rich';
import { Figure } from './Figure';
import { Exercise } from './Exercise';
import { all, get, put, useRevision, exportData } from './storage';
import { connect, connected, disconnect, initializeSync, mutation, sync, syncStatus } from './sync';
export function App({ data }: { data: Curriculum }) {
  const [quickAnchor, setQuickAnchor] = useState<{ x: number; y: number }>();
  const [slug, setSlug] = useState(localStorage.getItem('lesson') || data.lessons[0].slug),
    [tab, setTab] = useState('read'),
    [drawer, setDrawer] = useState(false),
    [outline, setOutline] = useState(false),
    [settings, setSettings] = useState(false),
    [reference, setReference] = useState<string[]>([]),
    [quickRef, setQuickRef] = useState<string | null>(null),
    [formula, setFormula] = useState<Formula | null>(null),
    [active, setActive] = useState(''),
    [practice, setPractice] = useState(0),
    [two, setTwo] = useState(localStorage.getItem('two-finger') === 'true'),
    [tutorials, setTutorials] = useState(false),
    [update, setUpdate] = useState<(() => Promise<void>) | null>(null);
  const reader = useRef<HTMLElement>(null);
  const lesson = data.lessons.find((l) => l.slug === slug) || data.lessons[0];
  useRevision();
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
    void get<{ anchor: string }>('settings', 'bookmark:' + lesson.slug).then((b) => {
      requestAnimationFrame(() =>
        document.getElementById(b?.anchor || 'lesson-start')?.scrollIntoView(),
      );
    });
    void get<RecordData>('records', 'practice/position:' + lesson.slug).then((r) => {
      setPractice(Math.max(0, Number(r?.payload.value) || 0));
    });
    void get<RecordData>('records', 'preference/tex:visible:v2:' + lesson.slug).then((r) =>
      setTutorials(r?.payload.value === true || r?.payload.value === 'true'),
    );
  }, [lesson.slug]);
  useEffect(() => {
    if (tab !== 'read') return;
    const el = reader.current!;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            setActive(e.target.id);
            clearTimeout(timer);
            timer = setTimeout(() => {
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
  }, [lesson.slug, tab]);
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
    setSlug(l);
    setTab('read');
    setDrawer(false);
    setOutline(false);
  };
  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setOutline(false);
  };
  const blocks = (bs: Block[], prefix: string) =>
    bs.map((b) =>
      b.kind === 'figure' ? (
        <Figure
          key={b.id}
          figure={data.figures.find((f) => f.id === (b as Block & { figureId: string }).figureId)!}
        />
      ) : (
        <Rich key={b.id} text={b.markdown} source={prefix + ':' + b.id} />
      ),
    );
  const nav = (
    <>
      <div className="brand">
        <BookOpen size={26} />
        <span>foundations</span>
      </div>
      <div className="course">
        <span className="eyebrow">Your notebook</span>
        <h3>Discrete mathematics</h3>
        <p className="muted">15 lessons · a place to think</p>
      </div>
      <nav className="chapters">
        {data.lessons.map((l, i) => (
          <button
            key={l.slug}
            className={l.slug === lesson.slug ? 'selected' : ''}
            onClick={() => choose(l.slug)}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            {l.title}
          </button>
        ))}
      </nav>
      <small>
        Your drafts stay on this device.
        <br />
        Submitted attempts sync when connected.
      </small>
    </>
  );
  const q = data.lessons.find((l) => l.slug === lesson.slug)!.questions[
    Math.min(practice, lesson.questions.length - 1)
  ];
  return (
    <ContentContext.Provider
      value={{
        data,
        lesson: lesson.slug,
        reference: (id) => {
          const rect = document.activeElement?.getBoundingClientRect();
          setQuickAnchor(rect ? { x: rect.left, y: rect.bottom } : undefined);
          setQuickRef(id);
        },
        formula: setFormula,
      }}
    >
      <div className="app">
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
                Chapter {String(data.lessons.indexOf(lesson) + 1).padStart(2, '0')} / 15
              </span>
              <strong>{lesson.title}</strong>
            </div>
            <nav className="tabs">
              {['read', 'practice', 'reference'].map((t) => (
                <button
                  aria-current={tab === t ? 'page' : undefined}
                  className={tab === t ? 'selected' : ''}
                  key={t}
                  onClick={() => setTab(t)}
                >
                  {t === 'read' ? 'Read & write' : t[0].toUpperCase() + t.slice(1)}
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
          <div className="body-layout">
            <main ref={reader} className="reader" id="reader">
              {tab === 'read' ? (
                <div className="reading-column">
                  <div className="lesson-intro" id="lesson-start">
                    <span className="eyebrow">{lesson.eyebrow}</span>
                    <h1>{lesson.title}</h1>
                    {blocks(lesson.introBlocks, 'intro')}
                  </div>
                  {lesson.sections.map((s, i) => (
                    <section key={s.id} id={'section-' + s.id} data-section data-title={s.title}>
                      <div className="teaching">
                        <h2>{s.title}</h2>
                        {blocks(s.blocks, 'section:' + s.id)}
                      </div>
                      <Typing
                        data={data}
                        lesson={lesson.slug}
                        section={s.id}
                        show={tutorials}
                        first={i === 0}
                      />
                      {s.quickChecks.map((c) => (
                        <QuickCheck key={c.id} check={c} lesson={lesson.slug} />
                      ))}
                      {s.questionIds.map((id) => (
                        <Exercise
                          key={id}
                          q={lesson.questions.find((q) => q.id === id)!}
                          lesson={lesson.slug}
                          data={data}
                        />
                      ))}
                    </section>
                  ))}
                  <footer>
                    <button
                      disabled={data.lessons.indexOf(lesson) === 14}
                      onClick={() => choose(data.lessons[data.lessons.indexOf(lesson) + 1].slug)}
                    >
                      Next chapter →
                    </button>
                  </footer>
                </div>
              ) : tab === 'practice' ? (
                <div className="reading-column">
                  <div className="practice-nav">
                    <button
                      disabled={practice === 0}
                      onClick={() => {
                        setPractice(practice - 1);
                        void mutation('practice/position:' + lesson.slug, { value: practice - 1 });
                      }}
                    >
                      ← Previous
                    </button>
                    <select
                      aria-label="Practice exercise"
                      value={practice}
                      onChange={(e) => {
                        setPractice(+e.target.value);
                        void mutation('practice/position:' + lesson.slug, {
                          value: +e.target.value,
                        });
                      }}
                    >
                      {lesson.questions.map((q, i) => (
                        <option key={q.id} value={i}>
                          Exercise {q.id} · {q.section}
                        </option>
                      ))}
                    </select>
                    <button
                      disabled={practice >= lesson.questions.length - 1}
                      onClick={() => {
                        setPractice(practice + 1);
                        void mutation('practice/position:' + lesson.slug, { value: practice + 1 });
                      }}
                    >
                      Next →
                    </button>
                  </div>
                  <Exercise key={q.id} q={q} lesson={lesson.slug} data={data} />
                </div>
              ) : (
                <Library data={data} onOpen={(id) => setReference([id])} />
              )}
            </main>
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
              {!navigator.onLine && <WifiOff size={12} />}{' '}
              {connected() ? syncStatus : 'Local notebook'}
            </span>
            {tab === 'read' && (
              <>
                <button className="outline-toggle" onClick={() => setOutline(true)}>
                  On this page
                </button>
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
          onResume={(r) => {
            const l = data.lessons.find((l) => l.slug === r.payload.slug);
            if (!l) return;
            choose(l.slug);
            setSettings(false);
            const s = l.sections.find(
              (s) => s.title === r.payload.section || String(r.payload.anchor).includes(s.id),
            );
            setTimeout(() => jump(s ? 'section-' + s.id : 'lesson-start'), 100);
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
function Typing({
  data,
  lesson,
  section,
  show,
  first,
}: {
  data: Curriculum;
  lesson: string;
  section: string;
  show: boolean;
  first: boolean;
}) {
  const p = data.placements.find((p) => p.lesson === lesson && p.section === section);
  const ids = [...(first ? data.basics.map((b) => b.id) : []), ...(p?.entries || [])];
  const entries = ids
    .map((id) => [...data.basics, ...data.syntax].find((e) => e.id === id))
    .filter((x) => !!x);
  return entries.length ? (
    <details className="typing" open={show}>
      <summary>Typing this math</summary>
      {entries.map((e) => (
        <article key={e.id}>
          <strong>{e.title || (e.command && '\\' + e.command)}</strong>
          <Rich text={e.text || e.explanation} />
          <pre>{e.source || e.example}</pre>
          <Rich text={e.source || (e.example ? '$' + e.example + '$' : '')} />
          <Copy text={e.source || e.example || ''} />
        </article>
      ))}
    </details>
  ) : null;
}
function QuickCheck({ check: c, lesson }: { check: Quick; lesson: string }) {
  const rev = useRevision();
  const [choice, setChoice] = useState(-1),
    [revealed, setRevealed] = useState(false);
  useEffect(() => {
    void get<RecordData>('records', 'quick/' + lesson + ':' + c.id).then((r) => {
      if (r) {
        setChoice(Number(r.payload.choice));
        setRevealed(Boolean(r.payload.revealed));
      }
    });
  }, [lesson, c.id, rev]);
  return (
    <article className="quick exercise">
      <span className="eyebrow">Quick check</span>
      <Rich text={c.prompt} source={`quick:${c.id}:prompt`} />
      <div className="choices">
        {c.options.map((o, i) => (
          <button
            key={i}
            aria-pressed={choice === i}
            className={choice === i ? 'selected' : ''}
            onClick={() => {
              setChoice(i);
              void mutation('quick/' + lesson + ':' + c.id, { choice: i, revealed });
            }}
          >
            <Rich text={o.replace(/\[([^\]]+)\]\(ref:[^)]+\)/g, '$1')} />
          </button>
        ))}
      </div>
      <button
        disabled={choice < 0}
        onClick={() => {
          setRevealed(!revealed);
          void mutation('quick/' + lesson + ':' + c.id, { choice, revealed: !revealed });
        }}
      >
        {revealed ? 'Hide explanation' : 'Check answer'}
      </button>
      {revealed && (
        <div className="feedback">
          <strong>{choice === c.answer ? 'Correct' : 'Try thinking about it this way'}</strong>
          <Rich text={c.explanation} />
        </div>
      )}
    </article>
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
  onResume,
  onClose,
  two,
  setTwo,
  tutorials,
  setTutorials,
}: {
  onResume: (record: RecordData) => void;
  onClose: () => void;
  two: boolean;
  setTwo: (v: boolean) => void;
  tutorials: boolean;
  setTutorials: (v: boolean) => void;
}) {
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
  const [key, setKey] = useState(''),
    [remember, setRemember] = useState(false),
    [error, setError] = useState(''),
    [working, setWorking] = useState(false);
  return (
    <Modal title="Settings" onClose={onClose}>
      <h3>Cloud sync</h3>
      <p className="muted">
        {syncStatus}. Uses the existing Foundations API. No deployment or new account is required
        for local testing.
      </p>
      {connected() ? (
        <div className="toolbar">
          <button onClick={() => void sync()}>Sync now</button>
          <button onClick={() => void disconnect()}>Disconnect</button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setWorking(true);
            void connect(key, remember)
              .then(() => setKey(''))
              .catch((e) => setError(String(e)))
              .finally(() => setWorking(false));
          }}
        >
          <label>
            API key
            <input
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember on this browser
          </label>
          <p className="muted">
            Otherwise the key lasts for this browser session. Remembered keys are stored in this
            browser, not in the app bundle.
          </p>
          <button className="primary" disabled={!key.trim() || working}>
            {working ? 'Connecting…' : 'Connect'}
          </button>
        </form>
      )}
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
          void exportData().then((b) => {
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
    </Modal>
  );
}
