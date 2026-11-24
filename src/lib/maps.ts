import type { Place } from '../data/types';

function query(p: Place) {
  if (p.address) return encodeURIComponent(p.address);
  return encodeURIComponent(p.nameJa ? `${p.nameJa} 福岡` : `${p.name} 후쿠오카`);
}

/** 구글맵에서 장소 열기 */
export function placeUrl(p: Place): string {
  return p.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${query(p)}`;
}

/** 현재 위치 → 장소 길찾기 (대중교통/도보) */
export function directionsUrl(p: Place, mode: 'transit' | 'walking' = 'transit'): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${query(p)}&travelmode=${mode}`;
}

/** A → B 길찾기 */
export function legUrl(a: Place, b: Place, mode: 'transit' | 'walking'): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${query(a)}&destination=${query(b)}&travelmode=${mode}`;
}

/** 여러 장소를 경유하는 동선 (최대 10곳) */
export function routeUrl(ps: Place[], mode: 'transit' | 'walking' = 'walking'): string | null {
  if (ps.length < 2) return null;
  const list = ps.slice(0, 10);
  const dest = query(list[list.length - 1]);
  const origin = query(list[0]);
  const way = list.slice(1, -1).map(query).join('%7C');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${way ? `&waypoints=${way}` : ''}&travelmode=${mode}`;
}

export const MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? '';
export const MAP_ID = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) || 'DEMO_MAP_ID';
