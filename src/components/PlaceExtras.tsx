import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReceiptText } from 'lucide-react';
import type { Place } from '../data/types';
import { trip } from '../data/trip';
import { API_URL, useAuth } from '../lib/api';
import { usePhotos } from '../lib/photos';
import { Lightbox, Thumbs } from './album/PhotoParts';
import { TranslateButton } from './Translate';

const EATS = ['food', 'cafe', 'bar'];

/** 그 장소가 처음 나오는 여행 일자 */
const dayOf = (id: string) => trip.days.find((d) => d.items.some((i) => i.places.includes(id) || i.alternatives?.includes(id)))?.day;

/** 로그인했을 때만: 메뉴 번역 · 지출 추가 · (지도) 장소 사진 */
export function PlaceExtras({ place, showPhotos }: { place: Place; showPhotos: boolean }) {
  const auth = useAuth();
  if (!API_URL || !auth || place.category === 'hotel' || place.category === 'transport') return null;
  const day = dayOf(place.id);
  return (
    <>
      <div className="actions">
        {EATS.includes(place.category) && <TranslateButton title={place.name} />}
        <Link className="btn" to={`/together?tab=wallet&add=${place.id}${day ? `&day=${day}` : ''}`}>
          <ReceiptText size={14} /> 지출 추가
        </Link>
      </div>
      {showPhotos && <PlacePhotos placeId={place.id} />}
    </>
  );
}

function PlacePhotos({ placeId }: { placeId: string }) {
  const photos = usePhotos();
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const list = (photos ?? []).filter((p) => p.placeId === placeId);
  if (!list.length) return null;
  return (
    <>
      <Thumbs photos={list} size="strip" onOpen={setOpen} />
      {open !== null && <Lightbox photos={list} index={open} onClose={close} />}
    </>
  );
}
