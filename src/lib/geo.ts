import type { Place } from '../data/types';

/** 두 장소 직선거리 (m) */
export function distanceM(a: Place, b: Place): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface Leg {
  km: string;
  label: string;
  mode: 'walking' | 'transit';
}

/**
 * 이동 시간 대략 추정 (좌표가 대략값이므로 참고용)
 * 실제 도로 우회 감안 직선거리 × 1.3, 도보 75m/분. 2.5km 넘으면 대중교통/택시 권장.
 */
export function estimateLeg(a: Place, b: Place): Leg | null {
  if (a.id === b.id) return null;
  const road = distanceM(a, b) * 1.3;
  const km = road < 1000 ? `${Math.round(road / 10) * 10}m` : `${(road / 1000).toFixed(1)}km`;
  if (road > 2500) {
    return { km, label: '지하철·택시 권장', mode: 'transit' };
  }
  const min = Math.max(1, Math.round(road / 75));
  return { km, label: `도보 약 ${min}분`, mode: 'walking' };
}
