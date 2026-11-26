import { members } from './auth';
import { HttpError, json, nowIso, readJson, type Env } from './http';

const CATEGORIES = ['food', 'cafe', 'shopping', 'transport', 'sight', 'bar', 'etc', 'prepaid'];

interface ExpenseInput {
  id?: string;
  title?: string;
  category?: string;
  amount?: number;
  currency?: 'JPY' | 'KRW';
  payer?: string;
  participants?: string[];
  day?: number | null;
  placeId?: string | null;
}

interface ExpenseRow {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: 'JPY' | 'KRW';
  payer: string;
  participants: string;
  day: number | null;
  place_id: string | null;
  settled: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const toApi = (r: ExpenseRow) => ({
  id: r.id,
  title: r.title,
  category: r.category,
  amount: r.amount,
  currency: r.currency,
  payer: r.payer,
  participants: JSON.parse(r.participants) as string[],
  day: r.day,
  placeId: r.place_id,
  settled: r.settled === 1,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

function validate(env: Env, b: ExpenseInput) {
  const ms = members(env);
  const title = b.title?.trim().slice(0, 60);
  if (!title) throw new HttpError(400, '내용을 입력해 주세요');
  if (!b.category || !CATEGORIES.includes(b.category) || b.category === 'prepaid') throw new HttpError(400, '분류가 잘못됐어요');
  if (typeof b.amount !== 'number' || !(b.amount > 0) || b.amount > 100_000_000) throw new HttpError(400, '금액이 잘못됐어요');
  if (b.currency !== 'JPY' && b.currency !== 'KRW') throw new HttpError(400, '통화가 잘못됐어요');
  if (!b.payer || !ms.includes(b.payer)) throw new HttpError(400, '결제자가 잘못됐어요');
  const participants = [...new Set(b.participants ?? [])].filter((p) => ms.includes(p));
  if (participants.length === 0) throw new HttpError(400, '참여자를 한 명 이상 골라 주세요');
  const day = b.day == null ? null : Math.trunc(b.day);
  return { title, category: b.category, amount: b.amount, currency: b.currency, payer: b.payer, participants, day, placeId: b.placeId ?? null };
}

export async function listExpenses(env: Env) {
  const { results } = await env.DB.prepare('SELECT * FROM expenses ORDER BY settled DESC, day, created_at').all<ExpenseRow>();
  const rate = await env.DB.prepare(`SELECT value FROM settings WHERE key = 'rate'`).first<{ value: string }>();
  return json({ expenses: results.map(toApi), rate: Number(rate?.value ?? 9.3) });
}

/** 클라이언트가 만든 id를 받아 재전송(오프라인 outbox) 시 중복 생성 방지 */
export async function createExpense(req: Request, env: Env, member: string) {
  const b = await readJson<ExpenseInput>(req);
  const v = validate(env, b);
  const id = b.id && /^[\w-]{8,64}$/.test(b.id) ? b.id : crypto.randomUUID();
  const now = nowIso();
  await env.DB.prepare(
    `INSERT INTO expenses (id, title, category, amount, currency, payer, participants, day, place_id, settled, created_by, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, ?10, ?11, ?11)
     ON CONFLICT(id) DO NOTHING`,
  )
    .bind(id, v.title, v.category, v.amount, v.currency, v.payer, JSON.stringify(v.participants), v.day, v.placeId, member, now)
    .run();
  const row = await env.DB.prepare('SELECT * FROM expenses WHERE id = ?1').bind(id).first<ExpenseRow>();
  return json(toApi(row!), 201);
}

export async function updateExpense(req: Request, env: Env, id: string) {
  const existing = await env.DB.prepare('SELECT * FROM expenses WHERE id = ?1').bind(id).first<ExpenseRow>();
  if (!existing) throw new HttpError(404, '없는 지출이에요');
  if (existing.settled) throw new HttpError(403, '정산 완료된 항목은 수정할 수 없어요');
  const v = validate(env, await readJson<ExpenseInput>(req));
  await env.DB.prepare(
    `UPDATE expenses SET title=?2, category=?3, amount=?4, currency=?5, payer=?6, participants=?7, day=?8, place_id=?9, updated_at=?10 WHERE id=?1`,
  )
    .bind(id, v.title, v.category, v.amount, v.currency, v.payer, JSON.stringify(v.participants), v.day, v.placeId, nowIso())
    .run();
  const row = await env.DB.prepare('SELECT * FROM expenses WHERE id = ?1').bind(id).first<ExpenseRow>();
  return json(toApi(row!));
}

export async function deleteExpense(env: Env, id: string) {
  const existing = await env.DB.prepare('SELECT settled FROM expenses WHERE id = ?1').bind(id).first<{ settled: number }>();
  if (!existing) return json({ ok: true });
  if (existing.settled) throw new HttpError(403, '정산 완료된 항목은 지울 수 없어요');
  await env.DB.prepare('DELETE FROM expenses WHERE id = ?1').bind(id).run();
  return json({ ok: true });
}

export async function setRate(req: Request, env: Env) {
  const { rate } = await readJson<{ rate?: number }>(req);
  if (typeof rate !== 'number' || !(rate > 1 && rate < 30)) throw new HttpError(400, '환율이 잘못됐어요');
  await env.DB.prepare(`INSERT INTO settings (key, value) VALUES ('rate', ?1) ON CONFLICT(key) DO UPDATE SET value = ?1`)
    .bind(String(rate))
    .run();
  return json({ rate });
}
