import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Download, ImagePlus, RotateCcw, Trash2, X } from 'lucide-react';
import { trip } from '../../data/trip';
import { placeMap } from '../../data/places';
import { shortName, useAuth } from '../../lib/api';
import { deletePhoto, dismissFailed, downloadUrl, retryFailed, uploadPhotos, useUploadJobs, type Photo, type UploadContext } from '../../lib/photos';

/** 사진 올리기 버튼 (숨긴 file input) */
export function UploadButton({ ctx, label = '사진 올리기', className = 'btn primary big' }: { ctx?: UploadContext; label?: string; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button className={className} onClick={() => ref.current?.click()}>
        <ImagePlus size={15} /> {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) uploadPhotos(e.target.files, ctx);
          e.target.value = '';
        }}
      />
    </>
  );
}

/** 업로드 진행 상태 한 줄 */
export function UploadStatus() {
  const jobs = useUploadJobs();
  if (jobs.length === 0) return null;
  const active = jobs.filter((j) => j.status === 'wait' || j.status === 'up').length;
  const done = jobs.filter((j) => j.status === 'done').length;
  const failed = jobs.filter((j) => j.status === 'fail');
  return (
    <div className="card small stack" style={{ gap: 6 }}>
      {active > 0 && (
        <div className="row">
          <span className="spinner" /> 사진 올리는 중 {done}/{done + active}
        </div>
      )}
      {failed.length > 0 && (
        <div className="row" style={{ color: 'var(--primary)', flexWrap: 'wrap' }}>
          {failed.length}장 실패 · {failed[0].error}
          <button className="btn" onClick={retryFailed}><RotateCcw size={13} /> 다시 시도</button>
          <button className="btn" onClick={dismissFailed}>닫기</button>
        </div>
      )}
    </div>
  );
}

export function Thumbs({ photos, onOpen, size = 'grid' }: { photos: Photo[]; onOpen: (i: number) => void; size?: 'grid' | 'strip' }) {
  return (
    <div className={size === 'grid' ? 'photo-grid' : 'photo-strip'}>
      {photos.map((p, i) => (
        <button key={p.id} className="photo-cell" onClick={() => onOpen(i)} aria-label="사진 크게 보기">
          <img src={p.thumbUrl} alt="" loading="lazy" decoding="async" />
        </button>
      ))}
    </div>
  );
}

const itemTitle = (p: Photo) => {
  const d = trip.days.find((x) => x.day === p.day);
  return d?.items.find((i) => i.id === p.itemId)?.title;
};
const fmtTaken = (s: string | null) => {
  if (!s) return '';
  const [d, t] = s.split('T');
  const [, m, day] = d.split('-');
  return `${Number(m)}/${Number(day)} ${t.slice(0, 5)}`;
};

/** 전체 화면 보기 · 스와이프 · 원본 다운로드 · 내 사진 삭제 */
export function Lightbox({ photos, index, onClose }: { photos: Photo[]; index: number; onClose: () => void }) {
  const auth = useAuth();
  const [i, setI] = useState(index);
  const touch = useRef<number | null>(null);
  const p = photos[Math.min(i, photos.length - 1)];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
      if (e.key === 'ArrowRight') setI((x) => Math.min(photos.length - 1, x + 1));
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, photos.length]);

  useEffect(() => {
    if (photos.length === 0) onClose();
  }, [photos.length, onClose]);

  if (!p) return null;
  const place = p.placeId ? placeMap[p.placeId] : undefined;
  const title = itemTitle(p);

  return createPortal(
    <div
      className="lightbox"
      data-no-ptr
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (dx > 50) setI((x) => Math.max(0, x - 1));
        if (dx < -50) setI((x) => Math.min(photos.length - 1, x + 1));
      }}
    >
      <div className="lb-top">
        <span className="xs">{i + 1} / {photos.length}</span>
        <button className="icon-btn dark" onClick={onClose} aria-label="닫기"><X size={18} /></button>
      </div>
      <div className="lb-img">
        <img key={p.id} src={p.thumbUrl} alt="" />
        {i > 0 && <button className="lb-nav left" onClick={() => setI(i - 1)} aria-label="이전"><ChevronLeft size={22} /></button>}
        {i < photos.length - 1 && <button className="lb-nav right" onClick={() => setI(i + 1)} aria-label="다음"><ChevronRight size={22} /></button>}
      </div>
      <div className="lb-info">
        <div className="small">
          <b>{shortName(p.member)}</b> · {fmtTaken(p.takenAt)}
          {(title || place) && <div className="xs" style={{ opacity: 0.75 }}>{[p.day ? `DAY ${p.day}` : '', title, place?.name].filter(Boolean).join(' · ')}</div>}
        </div>
        <div className="row">
          <a className="btn" href={downloadUrl(p)} target="_blank" rel="noreferrer"><Download size={14} /> 원본</a>
          {auth?.member === p.member && (
            <button
              className="btn"
              onClick={async () => {
                if (!confirm('이 사진을 지울까요? 3명 모두에게서 사라져요.')) return;
                try {
                  await deletePhoto(p.id);
                  setI((x) => Math.max(0, x - (x === photos.length - 1 ? 1 : 0)));
                } catch (e) {
                  alert((e as Error).message);
                }
              }}
            >
              <Trash2 size={14} /> 삭제
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
