import { CalendarCheck, MapPin, Navigation, BookOpen } from 'lucide-react';
import type { Place } from '../data/types';
import { directionsUrl, placeUrl } from '../lib/maps';

export function PlaceActions({ place }: { place: Place }) {
  return (
    <div className="actions">
      <a className="btn" href={placeUrl(place)} target="_blank" rel="noreferrer">
        <MapPin size={14} /> 지도
      </a>
      <a className="btn navy" href={directionsUrl(place)} target="_blank" rel="noreferrer">
        <Navigation size={14} /> 길찾기
      </a>
      {place.reserveUrl && (
        <a className="btn primary" href={place.reserveUrl} target="_blank" rel="noreferrer">
          <CalendarCheck size={14} /> 예약
        </a>
      )}
    </div>
  );
}

export function BlogLinks({ place }: { place: Place }) {
  if (!place.blogs?.length) return null;
  return (
    <div className="blog-list">
      {place.blogs.map((b) => (
        <a key={b.url} href={b.url} target="_blank" rel="noreferrer">
          <BookOpen size={13} /> {b.title}
        </a>
      ))}
    </div>
  );
}
