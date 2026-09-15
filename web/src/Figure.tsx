import { useId, useState } from 'react';
import { Sources, type SourceCatalog } from './Sources';
import type { Figure as Definition } from './types';
import { MathText, Rich, Modal } from './Rich';
const accent = '#315fa0',
  ink = '#35404a',
  light = '#e5edf8';
export function Figure({ figure: f, sources }: { figure: Definition; sources?: SourceCatalog }) {
  const [step, set] = useState(0),
    [expanded, expand] = useState(false);
  const frame = f.frames[step];
  const matrix = (frame as typeof frame & { representation?: string }).representation === 'matrix';
  const uid = useId().replace(/:/g, '');
  const label = (s: string, x: number, y: number, w = 110) => (
    <foreignObject x={x - w / 2} y={y - 13} width={w} height={42}>
      <div className="svg-label">
        <MathText tex={f.mathLabels[s] || s} />
      </div>
    </foreignObject>
  );
  let drawing;
  let viewBox = '0 0 620 355';
  if (f.kind === 'coordinates') {
    const points = [
      [0, 0],
      ...(f.arrows || []).flatMap((a) => [a.from, a.to]),
      ...(f.ellipses || []).flatMap(([x, y]) => [
        [-x, -y],
        [x, y],
      ]),
    ];
    const xmin = Math.min(...points.map((p) => p[0])),
      xmax = Math.max(...points.map((p) => p[0]));
    const ymin = Math.min(...points.map((p) => p[1])),
      ymax = Math.max(...points.map((p) => p[1]));
    const scale = Math.min(380 / (xmax - xmin + 1), 230 / (ymax - ymin + 1));
    const xy = ([x, y]: number[]) => [
      300 + (x - (xmin + xmax) / 2) * scale,
      175 - (y - (ymin + ymax) / 2) * scale,
    ];
    const [ox, oy] = xy([0, 0]);
    const [left, bottom] = xy([xmin - 0.5, ymin - 0.5]),
      [right, top] = xy([xmax + 0.5, ymax + 0.5]);
    viewBox = `${left - 30} ${top - 30} ${right - left + 100} ${bottom - top + 60}`;
    drawing = (
      <>
        <line x1={left} y1={oy} x2={right} y2={oy} stroke="#abb3bd" />
        <line x1={ox} y1={bottom} x2={ox} y2={top} stroke="#abb3bd" />
        <text x={right + 8} y={oy + 25}>
          x
        </text>
        <text x={ox + 8} y={top}>
          y
        </text>
        <text x={ox - 14} y={oy + 18}>
          0
        </text>
        {Array.from(
          { length: Math.ceil(xmax) - Math.floor(xmin) + 1 },
          (_, i) => Math.floor(xmin) + i,
        )
          .filter((n) => n !== 0)
          .map((n) => {
            const [x] = xy([n, 0]);
            return (
              <g key={'x' + n}>
                <line x1={x} x2={x} y1={oy - 3} y2={oy + 3} stroke={ink} />
                <text x={x - 4} y={oy + 19} fontSize="12">
                  {n}
                </text>
              </g>
            );
          })}
        {Array.from(
          { length: Math.ceil(ymax) - Math.floor(ymin) + 1 },
          (_, i) => Math.floor(ymin) + i,
        )
          .filter((n) => n !== 0)
          .map((n) => {
            const [, y] = xy([0, n]);
            return (
              <g key={'y' + n}>
                <line x1={ox - 3} x2={ox + 3} y1={y} y2={y} stroke={ink} />
                <text x={ox - 20} y={y + 4} fontSize="12">
                  {n}
                </text>
              </g>
            );
          })}
        {f.ellipses?.map(([rx, ry], i) => (
          <ellipse
            key={i}
            cx={ox}
            cy={oy}
            rx={rx * scale}
            ry={ry * scale}
            fill="none"
            stroke={i ? accent : ink}
            strokeWidth="2"
            strokeDasharray={i ? undefined : '5 4'}
          />
        ))}
        {f.arrows?.map((a, i) => {
          const [x1, y1] = xy(a.from),
            [x2, y2] = xy(a.to);
          const translated = a.from.some((n) => n !== 0);
          const lx = a.labelOffset
            ? x2 + a.labelOffset[0]
            : translated
              ? (x1 + x2) / 2 + 35
              : x2 + 30;
          const ly = a.labelOffset ? y2 + a.labelOffset[1] : translated ? (y1 + y2) / 2 : y2 - 18;
          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={a.dashed ? ink : accent}
                strokeWidth="2.5"
                strokeDasharray={a.dashed ? '5 4' : undefined}
                markerEnd={`url(#${uid}-arrow)`}
              />
              {label(a.label, lx, ly, 100)}
            </g>
          );
        })}
      </>
    );
  } else if (f.kind === 'graph' || f.kind === 'mapping') {
    const mapping = f.kind === 'mapping';
    const nodes = mapping
      ? [
          ...(f.domain || []).map((id, i) => ({ id: 'd' + id, text: id, x: 130, y: 55 + i * 70 })),
          ...(f.codomain || []).map((id, i) => ({
            id: 'c' + id,
            text: id,
            x: 490,
            y: 55 + i * 70,
          })),
        ]
      : (f.nodes || []).map((n) => ({ ...n, text: n.id }));
    const edges = mapping ? (f.pairs || []).map(([a, b]) => ['d' + a, 'c' + b]) : f.edges || [];
    drawing = (
      <>
        {mapping && (
          <>
            <text x="100" y="18">
              Domain
            </text>
            <text x="455" y="18">
              Codomain
            </text>
          </>
        )}
        {edges.map(([a, b], i) => {
          const u = nodes.find((n) => n.id === a)!,
            v = nodes.find((n) => n.id === b)!;
          if (!u || !v) return null;
          const selected = frame.route.some(
            (n, j) =>
              j > 0 &&
              ((frame.route[j - 1] === a && n === b) ||
                (!f.directed && frame.route[j - 1] === b && n === a)),
          );
          const dx = v.x - u.x,
            dy = v.y - u.y,
            len = Math.hypot(dx, dy) || 1;
          return a === b ? (
            <path
              key={i}
              d={`M${u.x - 8},${u.y - 12}c-70,-90 85,-90 16,0`}
              fill="none"
              stroke={accent}
            />
          ) : (
            <line
              key={i}
              x1={u.x + (dx / len) * 19}
              y1={u.y + (dy / len) * 19}
              x2={v.x - (dx / len) * 23}
              y2={v.y - (dy / len) * 23}
              stroke={selected ? accent : ink}
              strokeWidth={selected ? 5 : 2}
              markerEnd={mapping || f.directed ? `url(#${uid}-arrow)` : undefined}
            />
          );
        })}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={19}
              fill={frame.highlight.includes(n.text) ? light : 'white'}
              stroke={accent}
              strokeWidth={frame.highlight.includes(n.text) ? 4 : 1.5}
            />
            {label(n.text, n.x, n.y, 60)}
          </g>
        ))}
      </>
    );
  } else if (f.kind === 'predicate-table') {
    const columns = f.columns as string[];
    drawing = (
      <div className="figure-table predicate-table">
        <table aria-label={f.title}>
          {columns.length > 1 && (
            <caption>
              <MathText tex={f.mathLabels[f.columnLabel!] || f.columnLabel!} />
            </caption>
          )}
          <thead>
            <tr>
              <th scope="col">
                <MathText tex={f.mathLabels[f.rowLabel!] || f.rowLabel!} />
              </th>
              {(f.columns as string[]).map((c) => (
                <th
                  scope="col"
                  key={c}
                  className={frame.highlight.includes('column:' + c) ? 'highlighted' : ''}
                >
                  <MathText tex={f.mathLabels[c] || c} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(f.rows as string[]).map((r, i) => (
              <tr key={r} className={frame.highlight.includes('row:' + r) ? 'highlighted' : ''}>
                <th scope="row">
                  <MathText tex={f.mathLabels[r] || r} />
                </th>
                {(f.values as boolean[][])[i].map((v, j) => (
                  <td
                    key={j}
                    className={
                      frame.highlight.includes('column:' + columns[j]) ? 'highlighted' : ''
                    }
                  >
                    {v ? 'T' : 'F'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p>T = true; F = false</p>
      </div>
    );
  } else if (f.kind === 'venn') {
    const op = frame.operation;
    const chosen = (a: boolean, b: boolean) =>
      op === 'union'
        ? a || b
        : op === 'intersection'
          ? a && b
          : op === 'difference'
            ? a && !b
            : op === 'complement'
              ? !a
              : op === 'symmetric-difference'
                ? a !== b
                : op === 'union-complement'
                  ? !(a || b)
                  : op === 'intersection-complement'
                    ? !(a && b)
                    : false;
    const groups = [
      { a: true, b: false, x: 170 },
      { a: true, b: true, x: 310 },
      { a: false, b: true, x: 450 },
      { a: false, b: false, x: 550 },
    ];
    drawing = (
      <>
        <rect
          x="30"
          y="15"
          width="560"
          height="295"
          rx="5"
          fill={chosen(false, false) ? light : 'white'}
          stroke={ink}
        />
        <defs>
          <clipPath id={uid + '-a'}>
            <circle cx="245" cy="158" r="115" />
          </clipPath>
          <clipPath id={uid + '-b'}>
            <circle cx="375" cy="158" r="115" />
          </clipPath>
        </defs>
        <circle
          cx="245"
          cy="158"
          r="115"
          fill={chosen(true, false) ? light : 'white'}
          stroke={accent}
        />
        <circle
          cx="375"
          cy="158"
          r="115"
          fill={chosen(false, true) ? light : 'white'}
          stroke={accent}
        />
        <g clipPath={`url(#${uid}-a)`}>
          <circle cx="375" cy="158" r="115" fill={chosen(true, true) ? light : 'white'} />
        </g>
        <circle cx="245" cy="158" r="115" fill="none" stroke={accent} />
        <circle cx="375" cy="158" r="115" fill="none" stroke={accent} />
        {label('A', 210, 60)}
        {label('B', 410, 60)}
        {label('U', 55, 35)}
        {groups.flatMap((g) =>
          (f.universe || [])
            .filter((v) => f.a!.includes(v) === g.a && f.b!.includes(v) === g.b)
            .map((v, i) => (
              <g key={v}>
                {chosen(g.a, g.b) && (
                  <rect
                    x={g.x - 17}
                    y={100 + i * 36}
                    width="34"
                    height="30"
                    fill="none"
                    stroke={accent}
                    strokeWidth="2"
                  />
                )}
                {label(v, g.x, 114 + i * 36, 50)}
              </g>
            )),
        )}
      </>
    );
  } else if (f.kind === 'sequence') {
    const values = f.values as number[],
      max = Math.max(...values);
    drawing = (
      <>
        <line x1="45" y1="260" x2="580" y2="260" stroke={ink} />
        {values.map((v, i) => {
          const x = 60 + i * 100,
            h = (v / max) * 195;
          return (
            <g key={i}>
              <rect
                x={x}
                y={260 - h}
                width="55"
                height={h}
                fill={light}
                stroke={accent}
                strokeWidth={frame.active === i ? 4 : 1}
              />
              {label(String(v), x + 28, 245 - h)}
              {label(String(i + (f.firstIndex || 0)), x + 28, 283)}
            </g>
          );
        })}
        {label(f.rule || '', 310, 320, 450)}
      </>
    );
  } else if (f.kind === 'board' || f.kind === 'sum') {
    const rows = f.kind === 'sum' ? frame.n! : (f.rows as number),
      cols = f.kind === 'sum' ? rows + 1 : (f.columns as number);
    const unit = Math.min(55, 450 / cols);
    drawing = (
      <>
        {Array.from({ length: rows }, (_, y) =>
          Array.from({ length: cols }, (_, x) => (
            <rect
              key={x + ':' + y}
              x={90 + x * unit}
              y={20 + y * unit}
              width={unit}
              height={unit}
              stroke={ink}
              strokeDasharray={f.kind === 'board' ? '3 3' : undefined}
              fill={f.kind === 'sum' && x > y ? `url(#${uid}-stripe)` : light}
            />
          )),
        )}
        {frame.regions?.map(([x, y, w, h], i) => (
          <rect
            key={i}
            x={90 + x * unit + 3}
            y={20 + y * unit + 3}
            width={w * unit - 6}
            height={h * unit - 6}
            fill="none"
            stroke={accent}
            strokeWidth="3"
          />
        ))}
      </>
    );
  } else if (f.kind === 'bins') {
    drawing = (
      <>
        {f.counts!.map((n, i) => (
          <g key={i}>
            <rect x={45 + i * 180} y="50" width="150" height="190" fill="none" stroke={accent} />
            <text x={65 + i * 180} y="35">
              Box {i + 1}
            </text>
            {Array.from({ length: n }, (_, j) => (
              <circle
                key={j}
                cx={75 + i * 180 + (j % 3) * 40}
                cy={85 + Math.floor(j / 3) * 40}
                r="12"
                fill={light}
                stroke={accent}
              />
            ))}
            {label(String(n), 120 + i * 180, 270)}
          </g>
        ))}
      </>
    );
  } else if (f.kind === 'collections') {
    drawing = (
      <>
        {f.collections!.map((c, i) => (
          <g key={c.label}>
            <rect
              x={35 + i * 195}
              y="65"
              width="170"
              height="210"
              fill="none"
              stroke={accent}
              strokeWidth={frame.highlight.includes(c.label) ? 3 : 1}
            />
            {label(c.label, 120 + i * 195, 35)}
            {c.elements.map((v, j) => (
              <g key={j}>
                {Array.isArray(v) && (
                  <rect
                    x={60 + i * 195}
                    y={95 + j * 70}
                    width="110"
                    height="45"
                    fill={light}
                    stroke={accent}
                  />
                )}
                {label(
                  Array.isArray(v) ? '\\{' + v.join(',') + '\\}' : v,
                  120 + i * 195,
                  115 + j * 70,
                )}
              </g>
            ))}
          </g>
        ))}
      </>
    );
  } else if (f.kind === 'plot') {
    const xm = f.xMax!,
      ym = f.yMax!;
    const calc = (s: NonNullable<Definition['series']>[number], n: number) =>
      s.model === 'polynomial'
        ? s.coefficients!.reduce((v, c, i) => v + c * n ** i, 0)
        : s.model === 'logarithm'
          ? Math.log2(n)
          : s.model === 'exponential'
            ? (s.base || 2) ** n
            : s.model === 'nlogn'
              ? n * Math.log2(n)
              : n;
    drawing = (
      <>
        <path d="M50 20V280H580" fill="none" stroke={ink} />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <text x="12" y={285 - v * 250}>
              {Math.round(ym * v)}
            </text>
            <text x={50 + v * 510} y="303">
              {Math.round(xm * v)}
            </text>
          </g>
        ))}
        {f.series!.map((s, i) => (
          <g key={s.label}>
            <polyline
              points={Array.from({ length: 301 }, (_, j) => {
                const n = 1 + (j * (xm - 1)) / 300;
                return `${50 + (n / xm) * 510},${280 - (Math.min(ym, calc(s, n)) / ym) * 250}`;
              }).join(' ')}
              fill="none"
              stroke={i % 2 ? '#956d35' : accent}
              strokeWidth="2.5"
              strokeDasharray={i % 2 ? '7 5' : undefined}
            />
            {label(s.label, 150 + i * 210, 330, 200)}
          </g>
        ))}
        {f.threshold && (
          <line
            x1={50 + (f.threshold / xm) * 510}
            x2={50 + (f.threshold / xm) * 510}
            y1="20"
            y2="280"
            stroke={ink}
            strokeDasharray="3 4"
          />
        )}
      </>
    );
  }
  const chart =
    f.kind === 'predicate-table' ? (
      drawing
    ) : (
      <svg viewBox={viewBox} role="img" aria-label={f.title}>
        <defs>
          <marker
            id={uid + '-arrow'}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10Z" fill={ink} />
          </marker>
          <pattern id={uid + '-stripe'} patternUnits="userSpaceOnUse" width="9" height="9">
            <rect width="9" height="9" fill={light} />
            <path d="M0 9L9 0" stroke={accent} />
          </pattern>
        </defs>
        {drawing}
      </svg>
    );
  const table = matrix && f.nodes && (
    <div className="figure-table">
      <table>
        <tbody>
          <tr>
            <th />
            {f.nodes.map((n) => (
              <th key={n.id}>
                <MathText tex={f.mathLabels[n.id] || n.id} />
              </th>
            ))}
          </tr>
          {f.nodes.map((u) => (
            <tr key={u.id}>
              <th>
                <MathText tex={f.mathLabels[u.id] || u.id} />
              </th>
              {f.nodes!.map((v) => (
                <td key={v.id}>
                  {f.edges!.some(
                    ([a, b]) =>
                      (a === u.id && b === v.id) || (!f.directed && b === u.id && a === v.id),
                  )
                    ? 1
                    : 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <figure className="figure">
      <div className="figure-title">
        <strong>{f.title}</strong>
        <button onClick={() => expand(true)}>Expand</button>
      </div>
      <div className="chart">{chart}</div>
      {table}
      <figcaption>
        <Rich text={frame.text} source={`figure:${f.id}:frame:${step}`} />
      </figcaption>
      {f.frames.length > 1 && (
        <div className="toolbar">
          <button disabled={!step} onClick={() => set(step - 1)}>
            Previous
          </button>
          <span className="muted">
            {step + 1} / {f.frames.length}
          </span>
          <button disabled={step === f.frames.length - 1} onClick={() => set(step + 1)}>
            Next
          </button>
          <button disabled={!step} onClick={() => set(0)}>
            Reset
          </button>
        </div>
      )}
      <details>
        <summary>About this figure</summary>
        <Rich text={f.creation} />
        <Rich text={f.limitations} />
        <Sources catalog={sources} target={`figure:${f.id}`} />
      </details>
      {expanded && (
        <Modal title={f.title} onClose={() => expand(false)} wide>
          {chart}
          {table}
          <Rich text={frame.text} />
        </Modal>
      )}
    </figure>
  );
}
