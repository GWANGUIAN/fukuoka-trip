import { useCallback, useState } from 'react';
import type { ScheduleItem } from '../../data/types';
import { API_URL, useAuth } from '../../lib/api';
import { usePhotos } from '../../lib/photos';
import { Lightbox, Thumbs, UploadButton } from './PhotoParts';

/** 일정 카드: 그 일정 사진 썸네일 + 바로 올리기 (로그인 시에만) */
export function ItemPhotos({ day, item }: { day: number; item: ScheduleItem }) {
  const auth = useAuth();
  if (!API_URL || !auth || item.places.length === 0) return null;
  return <Inner day={day} item={item} />;
}

function Inner({ day, item }: { day: number; item: ScheduleItem }) {
  const photos = usePhotos();
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const mine = (photos ?? []).filter((p) => p.itemId === item.id);
  return (
    <div className="tl-photos">
      {mine.length > 0 && <Thumbs photos={mine} size="strip" onOpen={setOpen} />}
      <UploadButton
        ctx={{ day, itemId: item.id, placeId: item.places[0] }}
        label={mine.length ? '' : '사진'}
        className="btn"
      />
      {open !== null && <Lightbox photos={mine} index={open} onClose={close} />}
    </div>
  );
}
