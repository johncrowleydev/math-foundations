import type { Stroke } from './types';
// Wire-compatible adapter for Google's public CodedStrokeInputBatch / CodedNumericRun
// protobuf schema. Original archived input bytes remain unchanged; the browser draws
// the same canonical coordinates with its own pressure-aware stroke renderer.
export type NativeInk = {
  version: number;
  height: number;
  strokes: { color: number; size: number; inputs: string }[];
};
function fields(b: Uint8Array) {
  let i = 0;
  const result = new Map<number, (number | Uint8Array)[]>();
  const v = () => {
    let n = 0,
      s = 0,
      c;
    do {
      if (i >= b.length || s > 49) throw Error('Invalid ink data');
      c = b[i++];
      n += (c & 127) * 2 ** s;
      s += 7;
    } while (c & 128);
    return n;
  };
  while (i < b.length) {
    const tag = v(),
      id = tag >> 3,
      w = tag & 7;
    let value: number | Uint8Array;
    if (w === 2) {
      const len = v();
      value = b.slice(i, i + len);
      i += len;
    } else if (w === 5) {
      value = new DataView(b.buffer, b.byteOffset + i, 4).getFloat32(0, true);
      i += 4;
    } else if (w === 0) value = v();
    else if (w === 1) {
      i += 8;
      continue;
    } else throw Error('Unsupported ink data');
    result.set(id, [...(result.get(id) || []), value]);
  }
  return result;
}
function numeric(b: Uint8Array) {
  const f = fields(b),
    scale = Number(f.get(2)?.[0] ?? 1),
    offset = Number(f.get(3)?.[0] ?? 0);
  let sum = 0;
  const values: number[] = [];
  for (const part of f.get(1) || []) {
    if (typeof part === 'number') {
      sum += (part >>> 1) ^ -(part & 1);
      values.push(offset + scale * sum);
    } else {
      let i = 0;
      while (i < part.length) {
        let n = 0,
          s = 0,
          c;
        do {
          c = part[i++];
          n += (c & 127) * 2 ** s;
          s += 7;
          if (s > 35) throw Error('Invalid numeric run');
        } while (c & 128);
        sum += (n >>> 1) ^ -(n & 1);
        values.push(offset + scale * sum);
      }
    }
  }
  return values;
}
export async function decodeInk(ink: NativeInk): Promise<Stroke[]> {
  if (ink.version !== 1) throw Error('Unsupported handwriting version');
  return Promise.all(
    ink.strokes.map(async (s) => {
      const compressed = Uint8Array.from(atob(s.inputs), (c) => c.charCodeAt(0));
      const bytes = new Uint8Array(
        await new Response(
          new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')),
        ).arrayBuffer(),
      );
      const f = fields(bytes);
      const x = numeric(f.get(1)![0] as Uint8Array),
        y = numeric(f.get(2)![0] as Uint8Array),
        p = f.has(4) ? numeric(f.get(4)![0] as Uint8Array) : [];
      if (x.length !== y.length || x.length > 1000000) throw Error('Invalid handwriting points');
      return {
        color: '#' + (s.color >>> 0).toString(16).padStart(8, '0').slice(2),
        width: s.size,
        points: x.map((x, i) => ({ x, y: y[i], p: p[i] ?? 0.5 })),
      };
    }),
  );
}
const vi = (n: number) => {
  const out = [];
  n >>>= 0;
  while (n > 127) {
    out.push((n & 127) | 128);
    n >>>= 7;
  }
  out.push(n);
  return out;
};
const message = (field: number, bytes: number[]) => [
  ...vi(field * 8 + 2),
  ...vi(bytes.length),
  ...bytes,
];
function run(values: number[], scale = 0.001) {
  let last = 0;
  const ds = values.flatMap((v) => {
    const n = Math.round(v / scale),
      delta = n - last;
    last = n;
    return vi(((delta << 1) ^ (delta >> 31)) >>> 0);
  });
  const f = new Uint8Array(4);
  new DataView(f.buffer).setFloat32(0, scale, true);
  return [...message(1, ds), 21, ...f];
}
export async function encodeInk(strokes: Stroke[]): Promise<NativeInk> {
  return {
    version: 1,
    height: Math.max(520, ...strokes.flatMap((s) => s.points.map((p) => p.y + 40))),
    strokes: await Promise.all(
      strokes.map(async (s) => {
        const p = s.points;
        const bytes = new Uint8Array([
          ...message(1, run(p.map((p) => p.x))),
          ...message(2, run(p.map((p) => p.y))),
          ...message(3, run(p.map((_, i) => i * 0.01))),
          ...message(4, run(p.map((p) => p.p))),
          56,
          3,
        ]);
        const zip = new Uint8Array(
          await new Response(
            new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')),
          ).arrayBuffer(),
        );
        let binary = '';
        for (const b of zip) binary += String.fromCharCode(b);
        return {
          color: parseInt('ff' + s.color.slice(1), 16) | 0,
          size: s.width,
          inputs: btoa(binary),
        };
      }),
    ),
  };
}
