import { trip } from '../data/trip';

const DAY_MS = 86_400_000;
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** YYYY-MM-DD → 로컬 자정 Date */
export function parseDate(s: string): Date {
  const [d, t] = s.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = (t ?? '00:00').split(':').map(Number);
  return new Date(y, m - 1, day, hh, mm);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 오늘 기준 남은 일수 (양수 = 미래) */
export function daysUntil(s: string, now = new Date()): number {
  return Math.round((startOfDay(parseDate(s)).getTime() - startOfDay(now).getTime()) / DAY_MS);
}

export function ddayLabel(s: string, now = new Date()): string {
  const n = daysUntil(s, now);
  if (n === 0) return 'D-DAY';
  return n > 0 ? `D-${n}` : `D+${-n}`;
}

export function formatDate(s: string, withWeek = true): string {
  const d = parseDate(s);
  const base = `${d.getMonth() + 1}/${d.getDate()}`;
  return withWeek ? `${base}(${WEEK[d.getDay()]})` : base;
}

export function weekday(s: string): string {
  return WEEK[parseDate(s).getDay()];
}

export type Phase = { kind: 'before'; days: number } | { kind: 'during'; day: number } | { kind: 'after' };

export function tripPhase(now = new Date()): Phase {
  const toStart = daysUntil(trip.startDate, now);
  const toEnd = daysUntil(trip.endDate, now);
  if (toStart > 0) return { kind: 'before', days: toStart };
  if (toEnd < 0) return { kind: 'after' };
  return { kind: 'during', day: -toStart + 1 };
}

/** "HH:MM" 이면 분 단위로 변환, 아니면 null */
export function timeToMinutes(t?: string): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}
