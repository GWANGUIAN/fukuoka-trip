import { useCallback, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { trip } from '../../data/trip';
import { DAY_COLOR } from '../../lib/labels';
import { formatDate } from '../../lib/date';
import { refreshPhotos, usePhotos, type Photo } from '../../lib/photos';
import { Lightbox, Thumbs, UploadButton, UploadStatus } from './PhotoParts';

interface Group {
  key: string;
  title: string;
  color?: string;
  sub: { key: string; title?: string; photos: Photo[] }[];
}

export function Album() {
  const photos = usePhotos();
  const [open, setOpen] = useState<{ key: string; i: number } | null>(null);

  const close = useCallback(() => setOpen(null), []);

  const groups = useMemo<Group[]>(() => {
    if (!photos) return [];
    const out: Group[] = [];
    for (const d of trip.days) {
      const dayPhotos = photos.filter((p) => p.day === d.day);
      if (!dayPhotos.length) continue;
      const sub = [
        ...d.items.map((it) => ({ key: it.id, title: `${it.time ?? ''} ${it.title}`.trim(), photos: dayPhotos.filter((p) => p.itemId === it.id) })),
        { key: `${d.day}-etc`, title: '그 외', photos: dayPhotos.filter((p) => !d.items.some((it) => it.id === p.itemId)) },
      ].filter((s) => s.photos.length);
      out.push({ key: `day${d.day}`, title: `DAY ${d.day} · ${formatDate(d.date)}`, color: DAY_COLOR[d.day - 1], sub });
    }
    const etc = photos.filter((p) => !trip.days.some((d) => d.day === p.day));
    if (etc.length) out.push({ key: 'etc', title: '여행 전·기타', sub: [{ key: 'etc', photos: etc }] });
    return out;
  }, [photos]);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row" style={{ gap: 8 }}>
        <div style={{ flex: 1, display: 'grid' }}>
          <UploadButton />
        </div>
        <button className="icon-btn" onClick={() => refreshPhotos()} aria-label="새로고침"><RefreshCw size={16} /></button>
      </div>
      <div className="xs faint" style={{ marginTop: -8 }}>
        촬영 시각으로 일정에 자동 분류돼요 · 원본도 함께 저장 · {photos ? `${photos.length}장` : '불러오는 중…'}
      </div>
      <UploadStatus />

      {photos && photos.length === 0 && (
        <div className="card small muted" style={{ textAlign: 'center', padding: 28 }}>
          아직 사진이 없어요. 여행 중 찍은 사진을 올려 같이 봐요 📷
        </div>
      )}

      {groups.map((g) => (
        <section key={g.key} className="stack">
          <h2 className="section-title" style={{ color: g.color, marginBottom: 0 }}>{g.title}</h2>
          {g.sub.map((s) => (
            <div key={s.key} className="stack" style={{ gap: 6 }}>
              {s.title && <div className="xs muted" style={{ fontWeight: 650 }}>{s.title}</div>}
              <Thumbs photos={s.photos} onOpen={(i) => setOpen({ key: s.key, i })} />
            </div>
          ))}
        </section>
      ))}

      {open && (
        <Lightbox
          photos={groups.flatMap((g) => g.sub).find((s) => s.key === open.key)?.photos ?? []}
          index={open.i}
          onClose={close}
        />
      )}
    </div>
  );
}
