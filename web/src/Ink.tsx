import { useEffect, useRef, useState, useMemo } from 'react';
import type { Stroke } from './types';
export function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const s of strokes) {
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    for (let i = 0; i < s.points.length; i++) {
      const p = s.points[i],
        q = s.points[i - 1] || p;
      ctx.lineWidth = s.width * (0.5 + p.p);
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }
}
export function inkHeight(strokes: Stroke[], minimum: number, padding: number) {
  let height = minimum;
  for (const stroke of strokes)
    for (const point of stroke.points) height = Math.max(height, point.y + padding);
  return Math.ceil(height);
}
export async function inkImage(strokes: Stroke[]) {
  const canvas = document.createElement('canvas');
  canvas.width = 1350;
  canvas.height = Math.ceil(inkHeight(strokes, 120, 24) * 1.5);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(1.5, 1.5);
  drawStrokes(ctx, strokes);
  return new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95));
}
export function Ink({ strokes, onChange }: { strokes: Stroke[]; onChange: (s: Stroke[]) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    active = useRef<Stroke | null>(null);
  const [color, setColor] = useState('#253a43'),
    [width, setWidth] = useState(2),
    [erase, setErase] = useState(false),
    [move, setMove] = useState(false),
    [redo, setRedo] = useState<Stroke[]>([]);
  const height = useMemo(() => inkHeight(strokes, 520, 80), [strokes]);
  const pointer = useRef<number | null>(null);
  const painted = useRef<Stroke[] | null>(null),
    paintedHeight = useRef(0);
  const current = useRef(strokes);
  current.current = strokes;
  const paint = () => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    drawStrokes(ctx, current.current);
    if (active.current) drawStrokes(ctx, [active.current]);
    painted.current = current.current;
    paintedHeight.current = c.height;
  };
  useEffect(() => {
    if (painted.current !== strokes || paintedHeight.current !== height) paint();
  }, [strokes, height]);
  return (
    <div>
      <div className="toolbar">
        <button aria-pressed={!move} onClick={() => setMove(!move)}>
          {move ? 'Move' : 'Draw'}
        </button>
        <button aria-pressed={erase} onClick={() => setErase(!erase)}>
          Eraser
        </button>
        <input
          aria-label="Ink color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <select aria-label="Pen width" value={width} onChange={(e) => setWidth(+e.target.value)}>
          <option value={1.4}>Fine</option>
          <option value={2.5}>Medium</option>
          <option value={4}>Broad</option>
        </select>
        <button
          disabled={!strokes.length}
          onClick={() => {
            setRedo([...redo, strokes.at(-1)!]);
            onChange(strokes.slice(0, -1));
          }}
        >
          Undo
        </button>
        <button
          disabled={!redo.length}
          onClick={() => {
            onChange([...strokes, redo.at(-1)!]);
            setRedo(redo.slice(0, -1));
          }}
        >
          Redo
        </button>
        <button
          disabled={!strokes.length}
          onClick={() => {
            setRedo([...strokes].reverse());
            onChange([]);
          }}
        >
          Clear
        </button>
      </div>
      <div className="ink-scroll">
        <canvas
          ref={canvas}
          width={900}
          height={height}
          aria-label="Handwriting canvas"
          style={{ touchAction: move ? 'pan-y' : 'none' }}
          onPointerDown={(e) => {
            if (move || e.button !== 0 || pointer.current !== null) return;
            pointer.current = e.pointerId;
            e.currentTarget.setPointerCapture(e.pointerId);
            const r = e.currentTarget.getBoundingClientRect();
            const p = {
              x: ((e.clientX - r.left) * 900) / r.width,
              y: ((e.clientY - r.top) * e.currentTarget.height) / r.height,
              p: e.pressure || 0.5,
            };
            if (erase) {
              onChange(
                strokes.filter((s) => !s.points.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 18)),
              );
              return;
            }
            active.current = { color, width, points: [p] };
            drawStrokes(e.currentTarget.getContext('2d')!, [active.current]);
          }}
          onPointerMove={(e) => {
            if (!active.current || pointer.current !== e.pointerId) return;
            const r = e.currentTarget.getBoundingClientRect();
            const events = e.nativeEvent.getCoalescedEvents?.();
            const points = [active.current.points.at(-1)!];
            for (const ev of events?.length ? events : [e.nativeEvent]) {
              const point = {
                x: ((ev.clientX - r.left) * 900) / r.width,
                y: ((ev.clientY - r.top) * e.currentTarget.height) / r.height,
                p: ev.pressure || 0.5,
              };
              active.current.points.push(point);
              points.push(point);
            }
            drawStrokes(e.currentTarget.getContext('2d')!, [{ ...active.current, points }]);
          }}
          onPointerUp={(e) => {
            if (pointer.current !== e.pointerId) return;
            pointer.current = null;
            if (active.current) {
              const next = [...current.current, active.current];
              painted.current = next;
              onChange(next);
              active.current = null;
              setRedo([]);
            }
          }}
          onPointerCancel={(e) => {
            if (pointer.current !== e.pointerId) return;
            pointer.current = null;
            if (active.current) {
              const next = [...current.current, active.current];
              painted.current = next;
              onChange(next);
              active.current = null;
            }
          }}
        />
      </div>
    </div>
  );
}
