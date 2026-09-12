import { mathRanges } from './math';
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import type { Curriculum, Formula } from './types';
export const ContentContext = createContext<{
  data: Curriculum;
  lesson: string;
  reference: (id: string) => void;
  formula: (f: Formula) => void;
}>(null!);
export function MathText({ tex, display = false }: { tex: string; display?: boolean }) {
  return (
    <span
      className={display ? 'math-display' : 'math-inline'}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, {
          displayMode: display,
          throwOnError: false,
          trust: false,
          strict: 'ignore',
        }),
      }}
    />
  );
}
export function Rich({
  text = '',
  source = '',
  className = '',
}: {
  text?: string;
  source?: string;
  className?: string;
}) {
  const context = useContext(ContentContext);
  return (
    <div
      className={'rich ' + className}
      onClick={(e) => {
        const math = (e.target as HTMLElement).closest('.katex');
        if (!math || !context) return;
        const tex = math.querySelector('annotation')?.textContent;
        const f = context.data.formulas.find(
          (f) => f.lesson === context.lesson && f.source === source && f.latex === tex,
        );
        if (f) context.formula(f);
      }}
    >
      <Markdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, trust: false, strict: 'ignore' }]]}
        urlTransform={(url) =>
          url.startsWith('ref:') ? url : /^(https?:|mailto:|#)/.test(url) ? url : ''
        }
        components={{
          a: ({ href, children }) =>
            href?.startsWith('ref:') ? (
              <button
                className={'term ' + (href.includes('?repeat') ? 'repeat' : '')}
                onClick={() => context?.reference(href.slice(4).split('?')[0])}
              >
                {children}
              </button>
            ) : (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
        }}
      >
        {mathRanges(text)
          .filter((r) => r.display && r.closed)
          .reverse()
          .reduce(
            (s, r) => s.slice(0, r.from) + '\n\n$$\n' + r.body + '\n$$\n\n' + s.slice(r.to),
            text,
          )}
      </Markdown>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
  anchor,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  anchor?: { x: number; y: number };
}) {
  const container = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus();
  }, []);
  return (
    <div
      className={'scrim ' + (anchor ? 'popover-scrim' : '')}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={container}
        style={
          anchor
            ? {
                position: 'fixed',
                left: Math.max(12, Math.min(anchor.x, window.innerWidth - 372)),
                top: Math.max(12, Math.min(anchor.y + 8, window.innerHeight - 290)),
                width: Math.min(360, window.innerWidth - 24),
              }
            : undefined
        }
        className={'modal ' + (wide ? 'wide' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'Tab') {
            const nodes = Array.from(
              container.current!.querySelectorAll<HTMLElement>(
                'button:not(:disabled),input,select,textarea,[tabindex="0"],a[href]',
              ),
            ).filter((n) => n.getClientRects().length);
            const first = nodes[0],
              last = nodes.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header>
          <h2>{title}</h2>
          <button autoFocus onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
export function Copy({ text }: { text: string }) {
  const [copied, set] = useState(false);
  return (
    <button
      onClick={() =>
        void navigator.clipboard.writeText(text).then(() => {
          set(true);
          setTimeout(() => set(false), 1500);
        })
      }
    >
      {copied ? 'Copied' : 'Copy TeX'}
    </button>
  );
}
