import { decodeInk, encodeInk, type NativeInk } from './nativeInk';
import { useEffect, useRef, useState } from 'react';
import type { Attempt, Curriculum, Draft, Question, RecordData } from './types';
import { all, emptyDraft, get, put, saveAttempt, saveMedia, useRevision } from './storage';
import { connected, recheck, sync } from './sync';
import { Rich, Modal } from './Rich';
import { TexEditor } from './TexEditor';
import { Ink, inkImage } from './Ink';
import { Media, Photos, normalizedPhoto } from './Photos';
import { gradeChoice } from './choiceGrading';
import { questionLabel } from './types';
export function Exercise({ q, lesson, data }: { q: Question; lesson: string; data: Curriculum }) {
  const key = lesson + '-' + q.id;
  const rev = useRevision();
  const draftRevision = useRevision('draft:' + key);
  const [draft, setDraft] = useState<Draft | null>(null),
    [attempts, setAttempts] = useState<Attempt[]>([]),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(''),
    [history, setHistory] = useState(false),
    [expanded, setExpanded] = useState(false),
    [versions, setVersions] = useState<RecordData[]>([]),
    [showVersions, setShowVersions] = useState(false);
  const [choiceReference, setChoiceReference] = useState<number | null>(null);
  const latestDraft = useRef<Draft | null>(null);
  const writes = useRef(Promise.resolve());
  const saveError = useRef('');
  const touched = useRef(false);
  useEffect(() => {
    touched.current = false;
    setDraft(null);
    let live = true;
    void (async () => {
      let d = await get<Draft>('drafts', key);
      if (!d) {
        d = emptyDraft();
        const old = await get<RecordData>('records', 'text/' + key);
        d.text = String(old?.payload.text || '');
        const photos = await get<RecordData>('records', 'photos/' + key);
        d.photos = (photos?.payload.photos || []) as Draft['photos'];
        const ink = await get<RecordData>('records', 'ink/' + key);
        if (ink) {
          d.strokes = await decodeInk(ink.payload as unknown as NativeInk);
        }
        if (q.quickSource && q.choice) {
          const previous = await get<RecordData>(
            'records',
            'quick/' + lesson + ':' + q.quickSource,
          );
          const option = q.choice.options[Number(previous?.payload.choice)];
          if (option) d.choiceId = option.id;
          if (previous?.payload.revealed) d.revealed = true;
        }
      }
      if (live) {
        setDraft(d);
        latestDraft.current = d;
      }
    })().catch((e) => setError('Could not restore saved work: ' + String(e)));
    return () => {
      live = false;
    };
  }, [key]);
  useEffect(() => {
    let live = true;
    void all<Attempt>('attempts').then((as) => {
      if (live)
        setAttempts(
          as
            .filter((a) => a.exercise === key)
            .sort((a, b) => a.submitted - b.submitted || a.id.localeCompare(b.id)),
        );
    });
    void Promise.all(
      ['text/', 'ink/', 'photos/'].map((prefix) => get<RecordData>('records', prefix + key)),
    ).then((rs) => {
      if (live) setVersions(rs.filter((r): r is RecordData => !!r));
    });
    return () => {
      live = false;
    };
  }, [rev, key]);
  useEffect(() => {
    let live = true;
    void (async () => {
      if (touched.current || (await get('drafts', key))) return;
      const next = { ...(latestDraft.current || emptyDraft()) };
      for (const r of versions) {
        if (r.key.startsWith('text/')) next.text = String(r.payload.text || '');
        else if (r.key.startsWith('photos/')) next.photos = r.payload.photos as Draft['photos'];
        else next.strokes = await decodeInk(r.payload as unknown as NativeInk);
      }
      if (live && !touched.current) {
        latestDraft.current = next;
        setDraft(next);
      }
    })().catch((e) => setError(String(e)));
    return () => {
      live = false;
    };
  }, [versions.map((r) => r.revision).join(','), key]);
  useEffect(() => {
    let live = true;
    void get<Draft>('drafts', key).then((saved) => {
      if (live && saved && saved.updated > (latestDraft.current?.updated || 0)) {
        latestDraft.current = saved;
        setDraft(saved);
      }
    });
    return () => {
      live = false;
    };
  }, [key, draftRevision]);
  function update(p: Partial<Draft>) {
    touched.current = true;
    const next = { ...latestDraft.current!, ...p, updated: Date.now() };
    latestDraft.current = next;
    setDraft(next);
    writes.current = writes.current
      .then(async () => {
        await put('drafts', key, next);
        saveError.current = '';
      })
      .catch((e) => {
        saveError.current = 'Draft save failed: ' + String(e);
        setError(saveError.current);
      });
  }
  const correct = attempts.some((a) => a.verdict === 'correct'),
    pending = attempts.some((a) =>
      ['queued', 'pending', 'grading', 'rechecking'].includes(a.status),
    ),
    last = attempts.at(-1),
    editing = (!last || draft?.editing) && !correct && !pending;
  async function submit() {
    if (!draft || pending || correct || saving) return;
    setSaving(true);
    setError('');
    try {
      await writes.current;
      if (saveError.current) throw Error(saveError.current);
      const d = latestDraft.current!;
      if (
        !q.choice &&
        ((d.mode === 'type' && !d.text.trim()) ||
          (d.mode === 'pen' && !d.strokes.length) ||
          (d.mode === 'photo' && !d.photos.length))
      )
        throw Error('Add a response before submitting.');
      let a: Attempt = {
        id: crypto.randomUUID(),
        exercise: key,
        submitted: Math.max(Date.now(), (last?.submitted || 0) + 1),
        contentVersion: data.version,
        mode: q.choice ? 'choice' : d.mode === 'pen' ? 'write' : d.mode,
        ...(q.choice ? { choiceId: d.choiceId } : {}),
        text: d.mode === 'type' ? d.text : '',
        images: [],
        revealed: d.revealed,
        status: 'queued',
        grades: [],
      };
      if (q.choice) a = gradeChoice(a, q.choice);
      else if (d.mode === 'pen') {
        const h = await saveMedia(await inkImage(d.strokes));
        a.images = [h];
        a.ink = await encodeInk(d.strokes);
      } else if (d.mode === 'photo') {
        a.photos = d.photos;
        a.images = await Promise.all(
          d.photos.map(async (p) => saveMedia(await normalizedPhoto(p))),
        );
      }
      await saveAttempt(a);
      setExpanded(false);
      update({ editing: false, recovery: false });
      void sync();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }
  async function retry(a: Attempt) {
    if (correct || pending) return;
    if (q.choice) {
      update({ choiceId: undefined, editing: true, recovery: true });
      return;
    }
    if (latestDraft.current?.recovery) {
      update({ editing: true });
      return;
    }
    if (a.mode === 'type') update({ text: a.text, mode: 'type', editing: true, recovery: true });
    else if (a.ink)
      update({
        mode: 'pen',
        strokes: await decodeInk(a.ink as NativeInk),
        editing: true,
        recovery: true,
      });
    else if (draft?.strokes.length) update({ mode: 'pen', editing: true, recovery: true });
    else
      update({
        mode: 'photo',
        photos: a.photos || a.images.map((hash) => ({ hash, rotation: 0 })),
        editing: true,
        recovery: true,
      });
  }
  const editor = draft && (
    <>
      {q.choice ? (
        <div className="choices" role="group" aria-label="Answer choices">
          {q.choice.options.map((o, i) => (
            <div className="choice-row" key={o.id}>
              <button
                aria-pressed={draft.choiceId === o.id}
                className={draft.choiceId === o.id ? 'selected' : ''}
                onClick={() => update({ choiceId: o.id })}
              >
                <Rich text={o.text.replace(/\[([^\]]+)\]\(ref:[^)]+\)/g, '$1')} />
              </button>
              {/ref:|\$/.test(o.text) && (
                <button
                  className="choice-reference"
                  aria-label={`References for option ${i + 1}`}
                  onClick={() => setChoiceReference(i)}
                >
                  ⓘ
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="toolbar modes">
            <select
              aria-label="Response format"
              value={draft.mode}
              onChange={(e) => update({ mode: e.target.value as Draft['mode'] })}
            >
              <option value="type">Type</option>
              <option value="pen">Pen / sketch</option>
              <option value="photo">Photo</option>
            </select>
            <span className="muted">
              {draft.mode !== 'type' && draft.text ? 'Also saved: Type' : ''}
              {draft.mode !== 'pen' && draft.strokes.length ? ' · Sketch' : ''}
              {draft.mode !== 'photo' && draft.photos.length ? ' · Photos' : ''}
            </span>
            <button className="push" onClick={() => setExpanded(true)}>
              Expand
            </button>
          </div>
          {draft.mode === 'type' ? (
            <TexEditor
              value={draft.text}
              onChange={(text) => update({ text })}
              syntax={data.syntax}
            />
          ) : draft.mode === 'pen' ? (
            <Ink strokes={draft.strokes} onChange={(strokes) => update({ strokes })} />
          ) : (
            <Photos photos={draft.photos} onChange={(photos) => update({ photos })} />
          )}
        </>
      )}
      <div className="toolbar submit">
        <button
          className="primary"
          disabled={saving || (!!q.choice && !draft.choiceId)}
          onClick={() => void submit()}
        >
          {saving ? (
            <>
              <span className="spinner" />
              Saving…
            </>
          ) : (
            'Submit'
          )}
        </button>
        {last && <button onClick={() => update({ editing: false })}>Back to latest attempt</button>}
      </div>
    </>
  );
  return (
    <article
      className={
        'exercise ' +
        (correct
          ? 'correct'
          : attempts.length && attempts.every((a) => a.verdict === 'incorrect')
            ? 'incorrect'
            : '')
      }
      id={'exercise-' + q.id}
    >
      <div className="eyebrow">{questionLabel(q)}</div>
      <Rich text={q.instructions} source={`question:${q.id}:instructions`} />
      <Rich
        text={q.prompt}
        source={q.quickSource ? `quick:${q.quickSource}:prompt` : `question:${q.id}:prompt`}
      />
      {choiceReference !== null && q.choice && (
        <Modal title="Choice references" onClose={() => setChoiceReference(null)}>
          <Rich
            text={q.choice.options[choiceReference].text}
            source={q.quickSource ? `quick:${q.quickSource}:option:${choiceReference}` : ''}
          />
        </Modal>
      )}
      {q.math && <Rich text={'$$' + q.math + '$$'} source={`question:${q.id}:math`} />}
      {q.table && (
        <table>
          <thead>
            <tr>
              {q.table.columns.map((c, i) => (
                <th key={i}>
                  <Rich text={'$' + c + '$'} />
                </th>
              ))}
            </tr>
          </thead>
        </table>
      )}
      {!draft ? (
        <p>Opening answer…</p>
      ) : editing ? (
        editor
      ) : (
        last && (
          <AttemptPanel
            attempt={last}
            onRetry={() => void retry(last)}
            resumeDraft={draft?.recovery}
            canRetry={!correct && !pending}
            onHistory={attempts.length > 1 ? () => setHistory(true) : undefined}
          />
        )
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!!versions.length && (
        <button onClick={() => setShowVersions(true)}>Previously synced work</button>
      )}
      {showVersions && (
        <Modal title="Previously synced work" onClose={() => setShowVersions(false)}>
          <p>Original synced copies remain available. Using a copy opens a local draft.</p>
          {versions.flatMap((r) =>
            [r, ...r.versions.filter((v) => v.id !== r.id)].map((v) => (
              <article className="history-item" key={v.id}>
                <strong>
                  {r.key.split('/')[0]} · {new Date(v.updated).toLocaleString()}
                </strong>
                {r.key.startsWith('text/') ? (
                  <Rich text={String(v.payload.text || '')} />
                ) : r.key.startsWith('photos/') ? (
                  ((v.payload.photos || []) as Draft['photos']).map((p, i) => (
                    <Media key={i} {...p} />
                  ))
                ) : (
                  <p>Saved pen strokes</p>
                )}
                <button
                  disabled={correct || pending}
                  onClick={() =>
                    void (async () => {
                      if (r.key.startsWith('text/'))
                        update({
                          mode: 'type',
                          text: String(v.payload.text || ''),
                          editing: true,
                          recovery: true,
                        });
                      else if (r.key.startsWith('ink/'))
                        update({
                          mode: 'pen',
                          strokes: await decodeInk(v.payload as unknown as NativeInk),
                          editing: true,
                          recovery: true,
                        });
                      else
                        update({
                          mode: 'photo',
                          photos: v.payload.photos as Draft['photos'],
                          editing: true,
                          recovery: true,
                        });
                      setShowVersions(false);
                    })().catch((e) => setError(String(e)))
                  }
                >
                  Use this copy
                </button>
              </article>
            )),
          )}
        </Modal>
      )}
      <details
        open={draft?.revealed || false}
        onToggle={(e) => {
          if (draft && draft.revealed !== e.currentTarget.open)
            update({ revealed: e.currentTarget.open });
        }}
      >
        <summary>Reveal answer</summary>
        <Rich
          text={q.answer}
          source={q.quickSource ? `quick:${q.quickSource}:explanation` : `question:${q.id}:answer`}
        />
      </details>
      {history && (
        <Modal
          title={`${questionLabel(q)} — previous attempts`}
          onClose={() => setHistory(false)}
          wide
        >
          {[...attempts].reverse().map((a) => (
            <div className="history-item" key={a.id}>
              <AttemptPanel attempt={a} />
            </div>
          ))}
        </Modal>
      )}
      {expanded && (
        <Modal title={`${questionLabel(q)} — answer`} onClose={() => setExpanded(false)} wide>
          <Rich text={q.instructions} />
          <Rich text={q.prompt} />
          {q.math && <Rich text={'$$' + q.math + '$$'} />}
          {editor}
        </Modal>
      )}
    </article>
  );
}
function AttemptPanel({
  resumeDraft,
  attempt: a,
  onRetry,
  canRetry,
  onHistory,
}: {
  attempt: Attempt;
  resumeDraft?: boolean;
  onRetry?: () => void;
  canRetry?: boolean;
  onHistory?: () => void;
}) {
  const g = a.grades?.at(-1);
  const [feedback, setFeedback] = useState(a.verdict === 'correct'),
    [more, setMore] = useState(false),
    [panel, setPanel] = useState(''),
    [reason, setReason] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    setFeedback(a.verdict === 'correct');
  }, [a.verdict, g?.at]);
  const active = ['pending', 'grading', 'rechecking'].includes(a.status);
  return (
    <div className="attempt">
      <div className="attempt-status">
        {active && <span className="spinner" aria-label="Grading in progress" />}
        <strong>
          {a.status === 'queued'
            ? connected()
              ? 'Waiting to upload'
              : 'Saved — connect to grade'
            : active
              ? a.status === 'rechecking'
                ? 'Rechecking…'
                : 'Grading…'
              : a.status === 'not_graded'
                ? 'Not graded'
                : a.status === 'error'
                  ? 'Could not grade'
                  : a.verdict === 'correct'
                    ? 'Correct'
                    : 'Incorrect'}
        </strong>
        <time>
          {new Date(a.submitted).toLocaleString(undefined, {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </time>
      </div>
      {a.mode === 'type' || a.mode === 'choice' ? (
        <div className="submitted">
          <Rich text={a.text} />
        </div>
      ) : (
        <div className="submitted-images">
          {a.images.map((h) => (
            <Media key={h} hash={h} />
          ))}
        </div>
      )}
      {a.error && <p className="error">{a.error}</p>}
      <div className="toolbar">
        {g && (
          <button onClick={() => setFeedback(!feedback)}>
            {feedback ? 'Hide feedback' : 'Show feedback'}
          </button>
        )}
        {canRetry && onRetry && (
          <button onClick={onRetry}>{resumeDraft ? 'Continue draft' : 'Try again'}</button>
        )}
        <div className="menu-anchor">
          <button aria-expanded={more} onClick={() => setMore(!more)}>
            More ▾
          </button>
          {more && (
            <div className="menu">
              {[
                'Expand response',
                ...(g?.transcription ? ['What the grader read'] : []),
                ...(onHistory ? ['Previous attempts'] : []),
                ...(!active && a.status !== 'queued' && a.mode !== 'choice'
                  ? ['Request recheck']
                  : []),
                ...(a.grades?.length > 1 ? ['Previous assessments'] : []),
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setMore(false);
                    if (s === 'Previous attempts') onHistory?.();
                    else setPanel(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {g && feedback && (
        <div className="feedback">
          <Rich text={g.feedback} />
          {g.issue && <Rich text={'Where to look: ' + g.issue} />}
          {g.improvement && <Rich text={g.improvement} />}
        </div>
      )}
      {a.revealed && <p className="muted">Official answer viewed before submission</p>}
      {panel && (
        <Modal title={panel} onClose={() => setPanel('')} wide={panel === 'Expand response'}>
          {panel === 'Request recheck' ? (
            <>
              <p>
                Explain what the grader should reconsider. Your submitted response remains
                unchanged.
              </p>
              <textarea
                aria-label="Recheck explanation"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <button
                className="primary"
                disabled={!reason.trim()}
                onClick={() =>
                  void recheck(a, reason)
                    .then(() => setPanel(''))
                    .catch((e) => setError(String(e)))
                }
              >
                Send recheck
              </button>
              {error && <p role="alert">{error}</p>}
            </>
          ) : panel === 'What the grader read' ? (
            <Rich text={g?.transcription} />
          ) : panel === 'Previous assessments' ? (
            a.grades.map((old, i) => (
              <article key={i}>
                <strong>
                  {old.verdict} · {new Date(old.at).toLocaleString()}
                </strong>
                {old.reason && <p>Your clarification: {old.reason}</p>}
                <Rich text={old.feedback} />
              </article>
            ))
          ) : a.mode === 'type' || a.mode === 'choice' ? (
            <>
              <Rich text={a.text} />
              <pre>{a.text}</pre>
            </>
          ) : (
            a.images.map((h, i) => (
              <Media
                key={i}
                hash={a.photos?.[i]?.hash || h}
                rotation={a.photos?.[i]?.rotation || 0}
              />
            ))
          )}
        </Modal>
      )}
    </div>
  );
}
