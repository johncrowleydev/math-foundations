import { mathRanges, diagnostics } from './math';
import { useEffect, useRef, useState } from 'react';
import { Annotation, EditorState, RangeSetBuilder } from '@codemirror/state';
import { EditorView, Decoration, ViewPlugin, keymap, type DecorationSet } from '@codemirror/view';
import { history, historyKeymap, defaultKeymap, undo, redo } from '@codemirror/commands';
import { autocompletion, type CompletionContext } from '@codemirror/autocomplete';
import { linter, type Diagnostic } from '@codemirror/lint';
import { bracketMatching } from '@codemirror/language';
import katex from 'katex';
import { Rich, Modal, MathText } from './Rich';
import type { Syntax } from './types';
const controlledValue = Annotation.define<boolean>();
export function TexEditor({
  value,
  onChange,
  syntax,
  label = 'Answer',
  compact = false,
}: {
  value: string;
  onChange: (s: string) => void;
  syntax: Syntax[];
  label?: string;
  compact?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    view = useRef<EditorView>(null),
    change = useRef(onChange);
  change.current = onChange;
  const [help, setHelp] = useState(false),
    [query, setQuery] = useState(''),
    [preview, setPreview] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setPreview(value), 180);
    return () => clearTimeout(t);
  }, [value]);
  useEffect(() => {
    // A growing preview above the input must not push the active line away.
    const frame = requestAnimationFrame(() => {
      const editor = view.current;
      if (editor?.hasFocus)
        editor.dispatch({
          effects: EditorView.scrollIntoView(editor.state.selection.main.head, {
            y: 'nearest',
            yMargin: 24,
          }),
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [preview]);
  useEffect(() => {
    let frame = 0;
    const keepCaretVisible = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const editor = view.current;
        if (editor?.hasFocus)
          editor.dispatch({
            effects: EditorView.scrollIntoView(editor.state.selection.main.head, {
              y: 'nearest',
              yMargin: 24,
            }),
          });
      });
    };
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', keepCaretVisible);
    host.current?.addEventListener('focusin', keepCaretVisible);
    const element = host.current;
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', keepCaretVisible);
      element?.removeEventListener('focusin', keepCaretVisible);
    };
  }, []);
  useEffect(() => {
    const decorate = (v: EditorView) => {
      const b = new RangeSetBuilder<Decoration>();
      const text = v.state.doc.toString();
      for (const r of mathRanges(text)) {
        const str = text.slice(r.from, r.to);
        for (const m of str.matchAll(/\\[a-zA-Z]+|\\.|\$\$?|[{}]|[_^]|[=+\-*/<>]/g)) {
          const k =
            m[0][0] === '\\'
              ? 'command'
              : m[0][0] === '$'
                ? 'delimiter'
                : /[{}]/.test(m[0])
                  ? 'brace'
                  : /[_^]/.test(m[0])
                    ? 'script'
                    : 'operator';
          b.add(
            r.from + m.index!,
            r.from + m.index! + m[0].length,
            Decoration.mark({ class: 'tex-' + k }),
          );
        }
      }
      return b.finish();
    };
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          EditorView.lineWrapping,
          bracketMatching(),
          EditorView.contentAttributes.of({ 'aria-label': label + ' editor', spellcheck: 'false' }),
          EditorView.updateListener.of((u) => {
            // Restoring a controlled value is not a user edit. In particular,
            // another view of the same draft must not echo an older snapshot.
            if (u.transactions.some((t) => t.docChanged && !t.annotation(controlledValue)))
              change.current(u.state.doc.toString());
          }),
          ViewPlugin.fromClass(
            class {
              decorations: DecorationSet;
              constructor(v: EditorView) {
                this.decorations = decorate(v);
              }
              update(u: { view: EditorView; docChanged: boolean }) {
                if (u.docChanged) this.decorations = decorate(u.view);
              }
            },
            { decorations: (v) => v.decorations },
          ),
          linter((v) => diagnostics(v.state.doc.toString(), syntax), { delay: 350 }),
          autocompletion({
            override: [
              (c: CompletionContext) => {
                const m = c.matchBefore(/\\[A-Za-z]*/);
                if (
                  !m ||
                  !mathRanges(c.state.doc.toString()).some((r) => r.from < c.pos && r.to >= c.pos)
                )
                  return null;
                return {
                  from: m.from,
                  options: syntax
                    .filter((s) => s.command)
                    .map((s) => ({
                      label: '\\' + s.command,
                      detail: s.explanation,
                      type: 'keyword',
                    })),
                };
              },
            ],
          }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
  }, []);
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value)
      v.dispatch({
        changes: { from: 0, to: v.state.doc.length, insert: value },
        annotations: controlledValue.of(true),
      });
  }, [value]);
  const insert = (text: string, math = false) => {
    const v = view.current!;
    const { from, to } = v.state.selection.main;
    const selected = v.state.sliceDoc(from, to);
    const inMath = mathRanges(v.state.doc.toString()).some((r) => r.from < from && r.to >= to);
    const content = math ? '$' + selected + '$' : inMath ? text : '$' + text + '$';
    v.dispatch({
      changes: { from, to, insert: content },
      selection: { anchor: from + (math ? 1 : content.length) },
    });
    v.focus();
  };
  return (
    <div className={'tex-editor' + (compact ? ' compact' : '')}>
      <div className="editor-columns">
        <div className="editor-input">
          {!compact && (
            <div className="toolbar">
              <button onClick={() => insert('', true)}>Insert math</button>
              <button onClick={() => setHelp(true)}>Symbols & syntax</button>
              <button
                title="Undo"
                onClick={() => {
                  if (view.current) undo(view.current);
                }}
              >
                ↶
              </button>
              <button
                title="Redo"
                onClick={() => {
                  if (view.current) redo(view.current);
                }}
              >
                ↷
              </button>
            </div>
          )}
          <div className="editor-box">
            {!compact && <label>{label}</label>}
            <div ref={host} />
          </div>
          {compact && (
            <button
              className="compact-syntax"
              title="Symbols & syntax"
              aria-label={`Symbols and syntax for ${label}`}
              onClick={() => setHelp(true)}
            >
              ?
            </button>
          )}
        </div>
        {(!compact || mathRanges(preview).length > 0) && (
          <div className="preview">
            <label>Preview</label>
            {preview.trim() ? (
              <Rich text={preview} />
            ) : (
              <p className="muted">Your text and math will appear here.</p>
            )}
          </div>
        )}
      </div>
      {help && (
        <Modal title="Symbols & TeX syntax" onClose={() => setHelp(false)}>
          <p>
            Insert a command, then fill in your own values. These controls never insert an answer.
          </p>
          <input
            aria-label="Search syntax"
            placeholder="Search commands or meanings"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="syntax-list">
            {syntax
              .filter((s) => JSON.stringify(s).toLowerCase().includes(query.toLowerCase()))
              .map((s) => (
                <article key={s.id}>
                  <div>
                    <code>{s.command ? '\\' + s.command : s.source || s.example}</code>
                    <p>{s.explanation || s.text}</p>
                    {s.example && <MathText tex={s.example.replace(/^\$+|\$+$/g, '')} />}
                  </div>
                  <button
                    onClick={() => {
                      insert(s.command ? '\\' + s.command + ' ' : s.source || s.example || '');
                      setHelp(false);
                    }}
                  >
                    Insert
                  </button>
                </article>
              ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
