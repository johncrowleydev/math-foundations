import { useEffect, useState } from 'react';
import { get, saveMedia, useRevision } from './storage';
import type { Photo } from './types';
import { Modal } from './Rich';
export function Media({ hash, rotation = 0 }: { hash: string; rotation?: number }) {
  const revision = useRevision();
  const [url, set] = useState('');
  useEffect(() => {
    let live = true,
      u = '';
    set('');
    void (rotation ? normalizedPhoto({ hash, rotation }) : get<Blob>('media', hash))
      .then((b) => {
        if (b && live) {
          u = URL.createObjectURL(b);
          set(u);
        }
      })
      .catch(() => {
        if (live) set('');
      });
    return () => {
      live = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [hash, rotation, revision]);
  return url ? (
    <img className="response-image" src={url} alt="Submitted written work" />
  ) : (
    <p className="muted">Image not available locally yet. Sync to download it.</p>
  );
}
export async function normalizedPhoto(p: Photo) {
  const blob = await get<Blob>('media', p.hash);
  if (!blob) throw Error('Photo missing');
  const image = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  const swap = p.rotation % 180 !== 0;
  const scale = Math.min(1, 2400 / Math.max(image.width, image.height));
  const c = document.createElement('canvas');
  c.width = (swap ? image.height : image.width) * scale;
  c.height = (swap ? image.width : image.height) * scale;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  image.close();
  return new Promise<Blob>((resolve) => c.toBlob((b) => resolve(b!), 'image/jpeg', 0.9));
}
export function Photos({ photos, onChange }: { photos: Photo[]; onChange: (p: Photo[]) => void }) {
  const [error, setError] = useState(''),
    [expanded, setExpanded] = useState<Photo | null>(null),
    [removed, setRemoved] = useState<Photo[] | null>(null);
  async function add(files: FileList | null) {
    if (!files) return;
    try {
      const list = [];
      for (const f of files) {
        if (!f.type.startsWith('image/')) throw Error('Choose an image file');
        if (f.size > 64 * 1024 * 1024) throw Error('Photo must be smaller than 64 MiB');
        list.push({ hash: await saveMedia(f), rotation: 0 });
      }
      onChange([...photos, ...list]);
    } catch (e) {
      setError(String(e));
    }
  }
  return (
    <div className="photos">
      <div className="toolbar">
        <label className="button">
          Add photos
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => void add(e.target.files)}
          />
        </label>
        <label className="button">
          Take photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => void add(e.target.files)}
          />
        </label>
        {removed && (
          <button
            onClick={() => {
              onChange(removed);
              setRemoved(null);
            }}
          >
            Undo removal
          </button>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {photos.map((p, i) => (
        <div className="photo" key={i}>
          <button className="image-button" onClick={() => setExpanded(p)}>
            <Media {...p} />
          </button>
          <div className="toolbar">
            <button
              onClick={() =>
                onChange(
                  photos.map((x, j) => (j === i ? { ...x, rotation: (x.rotation + 90) % 360 } : x)),
                )
              }
            >
              Rotate
            </button>
            <button
              disabled={!i}
              onClick={() => {
                const next = [...photos];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                onChange(next);
              }}
            >
              Move earlier
            </button>
            <button
              onClick={() => {
                setRemoved(photos);
                onChange(photos.filter((_, j) => i !== j));
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      {expanded && (
        <Modal title="Photo" onClose={() => setExpanded(null)} wide>
          <Media {...expanded} />
        </Modal>
      )}
    </div>
  );
}
