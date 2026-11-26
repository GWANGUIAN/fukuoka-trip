/**
 * 할 일(trip.todos) → 푸시 알림 일정. 순수 함수 · import 없음.
 * Worker(cron)와 프론트(체크 탭 "🔔 예정" 표시)가 이 파일 하나를 같이 쓴다.
 *
 * 규칙 (KST = JST = UTC+9)
 * - 시각 있음 'YYYY-MM-DDTHH:mm': 전날 21:00 + 10분 전 (전날 알림이 10분 전보다 늦거나 같으면 생략)
 * - 날짜만   'YYYY-MM-DD'       : 전날 21:00 + 당일 09:00
 */

export interface NotifyTodo {
  id: string;
  date: string;
  title: string;
  note?: string;
  url?: string;
}

export interface Notice {
  /** 중복 방지 키 — 날짜가 바뀌면 새 알림으로 취급 */
  key: string;
  todoId: string;
  /** 보낼 시각 (epoch ms) */
  at: number;
  title: string;
  body: string;
  url?: string;
}

const KST = 9 * 3600_000;
const MIN = 60_000;
const DAY = 86400_000;
/** cron이 늦게 돌아도 이 시간 안이면 보낸다 */
export const LATE_LIMIT = 60 * MIN;

/** 'YYYY-MM-DD[THH:mm]' (KST) → epoch ms */
export function kstToEpoch(s: string): number {
  const [d, t = '00:00'] = s.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  return Date.UTC(y, m - 1, day, hh, mm) - KST;
}

/** epoch → KST 달력 정보 */
function kst(ms: number) {
  const d = new Date(ms + KST);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), hh: d.getUTCHours(), mm: d.getUTCMinutes() };
}
const dayIndex = (ms: number) => Math.floor((ms + KST) / DAY);
const hm = (ms: number) => {
  const k = kst(ms);
  return `${String(k.hh).padStart(2, '0')}:${String(k.mm).padStart(2, '0')}`;
};

function dayWord(target: number, from: number) {
  const diff = dayIndex(target) - dayIndex(from);
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  const k = kst(target);
  return `${k.m}/${k.d}`;
}

/** 알림 문구의 '언제' 부분: 자정(00:00)은 '오늘 밤 12시'처럼 전날 밤으로 읽어 준다 */
function whenLabel(event: number, notice: number) {
  if (hm(event) === '00:00') return `${dayWord(event - MIN, notice)} 밤 12시(자정)`;
  return `${dayWord(event, notice)} ${hm(event)}`;
}

/** 할 일 하나의 알림 목록 (시간순) */
export function planNotices(todo: NotifyTodo): Notice[] {
  const timed = todo.date.includes('T');
  const event = kstToEpoch(todo.date);
  const dayStart = kstToEpoch(todo.date.split('T')[0]);
  const eve = dayStart - DAY + 21 * 3600_000; // 전날 21:00
  const tail = todo.note ? ` · ${todo.note}` : '';
  const base = { todoId: todo.id, title: todo.title, url: todo.url };
  const out: Notice[] = [];

  if (timed) {
    const before = event - 10 * MIN;
    if (eve < before) out.push({ ...base, key: `${todo.id}:eve:${todo.date}`, at: eve, body: `${whenLabel(event, eve)}${tail}` });
    out.push({ ...base, key: `${todo.id}:10m:${todo.date}`, at: before, body: `10분 후 (${hm(event)})${tail}` });
  } else {
    out.push({ ...base, key: `${todo.id}:eve:${todo.date}`, at: eve, body: `내일${tail}` });
    out.push({ ...base, key: `${todo.id}:am:${todo.date}`, at: dayStart + 9 * 3600_000, body: `오늘${tail}` });
  }
  return out;
}

/** 지금 보낼 알림: 시각이 지났고, 늦어도 1시간 안이고, 아직 안 보낸 것 */
export function dueNotices(todos: NotifyTodo[], now: number, sent: Set<string>): Notice[] {
  return todos
    .flatMap(planNotices)
    .filter((n) => n.at <= now && now - n.at < LATE_LIMIT && !sent.has(n.key))
    .sort((a, b) => a.at - b.at);
}

/** 체크 탭 표시용: 앞으로 남은 알림 시각 'M/D HH:MM' */
export function upcomingLabels(todo: NotifyTodo, now: number): string[] {
  return planNotices(todo)
    .filter((n) => n.at > now)
    .map((n) => {
      const k = kst(n.at);
      return `${k.m}/${k.d} ${hm(n.at)}`;
    });
}
