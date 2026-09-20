import type { Figure } from './types';

/** Authored mathematical coordinates only; no user formula evaluation in figures. */
export function CartesianFigure({ figure: f, uid }: { figure: Figure; uid: string }) {
  const { x, y } = f.bounds!;
  const px = (v: number) => 55 + ((v - x[0]) / (x[1] - x[0])) * 500;
  const py = (v: number) => 285 - ((v - y[0]) / (y[1] - y[0])) * 250;
  const path = (points: [number, number][]) =>
    points.map(([a, b], i) => `${i ? 'L' : 'M'}${px(a)},${py(b)}`).join(' ');
  const colors = ['#315fa0', '#a34d27', '#38714a', '#764d92'];
  const horizontal = py(Math.max(y[0], Math.min(0, y[1])));
  const vertical = px(Math.max(x[0], Math.min(0, x[1])));
  const defaultTicks = (bounds: [number, number]) =>
    [0, 1, 2, 3, 4].map((i) => {
      const value = bounds[0] + (i * (bounds[1] - bounds[0])) / 4;
      return { value, label: String(Number(value.toFixed(2))) };
    });
  const legendOffset = f.axisLabels?.x ? 18 : 0;
  return (
    <>
      <defs>
        <clipPath id={`${uid}-plot`}>
          <rect x="55" y="35" width="500" height="250" />
        </clipPath>
      </defs>
      <line x1="55" x2="555" y1={horizontal} y2={horizontal} stroke="#929eab" />
      <line x1={vertical} x2={vertical} y1="35" y2="285" stroke="#929eab" />
      {(f.ticks?.x ?? defaultTicks(x)).map(({ value, label }) => (
        <g key={value} fill="#35404a" fontSize="12">
          <line
            x1={px(value)}
            x2={px(value)}
            y1={horizontal - 3}
            y2={horizontal + 3}
            stroke="#929eab"
          />
          <text x={px(value)} y="304" textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      {(f.ticks?.y ?? defaultTicks(y)).map(({ value, label }) => (
        <g key={value} fill="#35404a" fontSize="12">
          <line
            x1={vertical - 3}
            x2={vertical + 3}
            y1={py(value)}
            y2={py(value)}
            stroke="#929eab"
          />
          <text x="45" y={py(value) + 4} textAnchor="end">
            {label}
          </text>
        </g>
      ))}
      {f.axisLabels?.x ? (
        <text x="305" y="325" textAnchor="middle" fontSize="13">
          {f.axisLabels.x}
        </text>
      ) : (
        <text x="570" y={horizontal + 5} fontSize="13">
          x
        </text>
      )}
      {f.axisLabels?.y ? (
        <text x="14" y="160" textAnchor="middle" transform="rotate(-90 14 160)" fontSize="13">
          {f.axisLabels.y}
        </text>
      ) : (
        <text x={vertical + 8} y="23" fontSize="13">
          y
        </text>
      )}
      <g clipPath={`url(#${uid}-plot)`}>
        {f.regions?.map((r, i) => (
          <path key={i} d={path(r.points) + ' Z'} fill="#315fa033" stroke="#315fa066" />
        ))}
        {f.curves?.map((c, i) => (
          <path
            key={c.id}
            d={path(c.points)}
            fill="none"
            stroke={colors[i % colors.length]}
            strokeWidth="2.5"
            strokeDasharray={c.dashed ? '7 5' : undefined}
          />
        ))}
        {f.arrows?.map((a, i) => (
          <g key={i}>
            <line
              x1={px(a.from[0])}
              y1={py(a.from[1])}
              x2={px(a.to[0])}
              y2={py(a.to[1])}
              stroke="#a34d27"
              strokeWidth="2.5"
              markerEnd={`url(#${uid}-arrow)`}
            />
            <text
              x={px(a.to[0]) + (px(a.to[0]) > 430 ? -7 : 7)}
              y={py(a.to[1]) - 7}
              textAnchor={px(a.to[0]) > 430 ? 'end' : 'start'}
              fontSize="12"
            >
              {a.label}
            </text>
          </g>
        ))}
        {f.markers?.map((m, i) => (
          <g key={i}>
            <circle
              cx={px(m.at[0])}
              cy={py(m.at[1])}
              r="4.5"
              fill={m.open ? 'white' : '#35404a'}
              stroke="#35404a"
              strokeWidth="2"
            />
            {m.label && (
              <text
                x={px(m.at[0]) + (px(m.at[0]) > 430 ? -7 : 7)}
                y={py(m.at[1]) - 8}
                textAnchor={px(m.at[0]) > 430 ? 'end' : 'start'}
                fontSize="12"
              >
                {m.label}
              </text>
            )}
          </g>
        ))}
      </g>
      {f.curves?.map((c, i) => (
        <g key={c.id}>
          <line
            x1={55 + (i % 2) * 255}
            x2={79 + (i % 2) * 255}
            y1={326 + legendOffset + Math.floor(i / 2) * 18}
            y2={326 + legendOffset + Math.floor(i / 2) * 18}
            stroke={colors[i % colors.length]}
            strokeWidth="2.5"
            strokeDasharray={c.dashed ? '7 5' : undefined}
          />
          <text
            x={85 + (i % 2) * 255}
            y={330 + legendOffset + Math.floor(i / 2) * 18}
            fontSize="12"
          >
            {c.label}
          </text>
        </g>
      ))}
    </>
  );
}
