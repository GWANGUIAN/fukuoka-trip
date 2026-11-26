import type { Place } from '../data/types';

export type OpenState = 'open' | 'closing' | 'break' | 'beforeOpen' | 'closed' | 'dayoff';
/** live = 지금 이 순간 기준, plan = 일정 예정 시각 기준 */
export type OpenMode = 'live' | 'plan';

export interface OpenStatus {
  state: OpenState;
  label: string;
}

const CLOSING_SOON_MIN = 30;

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const fmt = (min: number) => {
  if (min === 1440) return '24:00';
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** 해당 요일 영업 구간(분). null = 정보 없음 */
function rangesFor(place: Place, dow: number): [number, number][] | null {
  if (place.closedDays?.includes(dow)) return [];
  const rule = place.openHours?.find((r) => r.days.includes(dow));
  return rule ? rule.ranges.map(([s, e]) => [toMin(s), toMin(e)]) : null;
}

const LABEL: Record<OpenMode, (s: OpenState, t?: string) => string> = {
  live: (s, t) =>
    ({
      open: `영업 중 · ${t}까지`,
      closing: `곧 마감 · ${t}`,
      break: `브레이크 · ${t} 재오픈`,
      beforeOpen: `준비 중 · ${t} 오픈`,
      closed: '영업 종료',
      dayoff: '오늘 휴무',
    })[s],
  plan: (s, t) =>
    ({
      open: '예정 시각 영업 중',
      closing: `예정 시각 곧 마감 (${t})`,
      break: `예정 시각 브레이크 (${t} 재오픈)`,
      beforeOpen: `예정 시각엔 오픈 전 (${t})`,
      closed: '예정 시각엔 영업 종료',
      dayoff: '그날 휴무',
    })[s],
};

/** 장소의 영업 상태. 영업시간 정보가 없으면 null */
export function openStatus(place: Place, at: Date, mode: OpenMode): OpenStatus | null {
  if (!place.openHours) return null;
  const dow = at.getDay();
  const m = at.getHours() * 60 + at.getMinutes();
  const make = (state: OpenState, t?: string): OpenStatus => ({ state, label: LABEL[mode](state, t) });

  // 전날 밤에서 자정을 넘겨 이어지는 영업
  const prev = rangesFor(place, (dow + 6) % 7);
  const carry = prev?.find(([, e]) => e > 1440 && m < e - 1440);
  if (carry) {
    const end = carry[1] - 1440;
    return make(end - m <= CLOSING_SOON_MIN ? 'closing' : 'open', fmt(end));
  }

  const today = rangesFor(place, dow);
  if (today === null) return null;
  if (today.length === 0) return make('dayoff');

  for (const [s, e] of today) {
    if (s <= m && m < e) {
      if (s === 0 && e >= 1440) return { state: 'open', label: mode === 'live' ? '24시간 영업' : '예정 시각 영업 중' };
      return make(e - m <= CLOSING_SOON_MIN ? 'closing' : 'open', fmt(e));
    }
  }
  const next = today.find(([s]) => s > m);
  if (!next) return make('closed');
  return make(next === today[0] ? 'beforeOpen' : 'break', fmt(next[0]));
}

export const OPEN_TONE: Record<OpenState, 'confirmed' | 'pending' | 'excluded'> = {
  open: 'confirmed',
  closing: 'pending',
  break: 'pending',
  beforeOpen: 'pending',
  closed: 'excluded',
  dayoff: 'excluded',
};
