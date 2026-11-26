export type Currency = 'JPY' | 'KRW';
export type ExpenseCategory = 'food' | 'cafe' | 'shopping' | 'transport' | 'sight' | 'bar' | 'etc' | 'prepaid';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: Currency;
  payer: string;
  participants: string[];
  day: number | null;
  placeId: string | null;
  settled: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  /** 오프라인으로 아직 서버에 안 간 항목 */
  pending?: boolean;
}

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  food: '식당',
  cafe: '카페',
  shopping: '쇼핑',
  transport: '교통',
  sight: '관광',
  bar: '술집',
  etc: '기타',
  prepaid: '사전 정산',
};

export const toKrw = (e: Pick<Expense, 'amount' | 'currency'>, rate: number) => (e.currency === 'KRW' ? e.amount : e.amount * rate);

export interface Transfer {
  from: string;
  to: string;
  krw: number;
}

export interface PersonSummary {
  member: string;
  /** 사전 정산분 중 내 몫 */
  prepaid: number;
  /** 현지 지출 중 내 몫 */
  local: number;
  /** 현지 지출에서 내가 낸 돈 */
  paid: number;
  total: number;
}

export interface WalletSummary {
  total: number;
  prepaid: number;
  local: number;
  people: PersonSummary[];
  byCategory: { category: ExpenseCategory; krw: number }[];
  transfers: Transfer[];
}

/** 원화 기준 요약 + 최소 송금 목록 (사전 정산분은 송금 계산에서 제외) */
export function summarize(expenses: Expense[], rate: number, members: string[]): WalletSummary {
  const people = new Map<string, PersonSummary>(
    members.map((m) => [m, { member: m, prepaid: 0, local: 0, paid: 0, total: 0 }]),
  );
  const byCat = new Map<ExpenseCategory, number>();
  let prepaid = 0;
  let local = 0;

  for (const e of expenses) {
    const krw = toKrw(e, rate);
    const parts = e.participants.filter((p) => people.has(p));
    if (parts.length === 0) continue;
    const share = krw / parts.length;
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + krw);
    if (e.settled) {
      prepaid += krw;
      for (const p of parts) people.get(p)!.prepaid += share;
    } else {
      local += krw;
      for (const p of parts) people.get(p)!.local += share;
      const payer = people.get(e.payer);
      if (payer) payer.paid += krw;
    }
  }
  for (const p of people.values()) p.total = p.prepaid + p.local;

  // 잔액: +면 받을 돈, -면 낼 돈
  const bal = [...people.values()].map((p) => ({ m: p.member, v: p.paid - p.local }));
  const transfers: Transfer[] = [];
  const cred = bal.filter((b) => b.v > 0.5).sort((a, b) => b.v - a.v);
  const debt = bal.filter((b) => b.v < -0.5).sort((a, b) => a.v - b.v);
  let i = 0;
  let j = 0;
  while (i < cred.length && j < debt.length) {
    const amt = Math.min(cred[i].v, -debt[j].v);
    const rounded = Math.round(amt / 100) * 100;
    if (rounded > 0) transfers.push({ from: debt[j].m, to: cred[i].m, krw: rounded });
    cred[i].v -= amt;
    debt[j].v += amt;
    if (cred[i].v <= 0.5) i++;
    if (debt[j].v >= -0.5) j++;
  }

  return {
    total: prepaid + local,
    prepaid,
    local,
    people: [...people.values()],
    byCategory: [...byCat.entries()].map(([category, krw]) => ({ category, krw })).sort((a, b) => b.krw - a.krw),
    transfers,
  };
}

/** 표시 통화로 포맷: 원화 금액을 받아 ₩ 또는 ¥ */
export function money(krw: number, cur: Currency, rate: number): string {
  return cur === 'KRW' ? `₩${Math.round(krw).toLocaleString('ko-KR')}` : `¥${Math.round(krw / rate).toLocaleString('ja-JP')}`;
}

/** 원래 통화 그대로 */
export const rawMoney = (amount: number, cur: Currency) =>
  cur === 'KRW' ? `₩${Math.round(amount).toLocaleString('ko-KR')}` : `¥${Math.round(amount).toLocaleString('ja-JP')}`;
