import { Clock, Info, Ticket, CalendarX } from 'lucide-react';
import type { Place } from '../data/types';
import { BlogLinks, PlaceActions } from './PlaceActions';

export function PlaceDetail({ place }: { place: Place }) {
  return (
    <div className="place-detail">
      {place.nameJa && <div className="faint xs">{place.nameJa}</div>}
      {place.hours && (
        <div className="kv"><Clock size={14} /> <span>{place.hours}</span></div>
      )}
      {place.closed && (
        <div className="kv"><CalendarX size={14} /> <span>휴무 {place.closed}</span></div>
      )}
      {place.reservation && (
        <div className="kv"><Ticket size={14} /> <span>{place.reservation.required ? '예약 필요' : '예약 불필요'}{place.reservation.note ? ` · ${place.reservation.note}` : ''}</span></div>
      )}
      {place.memo && (
        <div className="kv"><Info size={14} /> <span>{place.memo}</span></div>
      )}
      <BlogLinks place={place} />
      <PlaceActions place={place} />
    </div>
  );
}
