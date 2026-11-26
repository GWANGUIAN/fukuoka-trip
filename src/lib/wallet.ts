import { useCallback, useEffect, useState } from 'react';
import { ApiError, apiFetch } from './api';
import type { Expense } from './settle';

type Op = { kind: 'create' | 'update'; expense: Expense } | { kind: 'delete'; id: string };

const OUTBOX_KEY = 'fk-outbox';
const CACHE_KEY = 'fk-wallet-cache';

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

const body = (e: Expense) =>
  JSON.stringify({
    id: e.id,
    title: e.title,
    category: e.category,
    amount: e.amount,
    currency: e.currency,
    payer: e.payer,
    participants: e.participants,
    day: e.day,
    placeId: e.placeId,
  });

async function send(op: Op) {
  if (op.kind === 'delete') return apiFetch(`/expenses/${op.id}`, { method: 'DELETE' });
  if (op.kind === 'create') return apiFetch<Expense>('/expenses', { method: 'POST', body: body(op.expense) });
  return apiFetch<Expense>(`/expenses/${op.expense.id}`, { method: 'PUT', body: body(op.expense) });
}

/** outbox(오프라인에서 쌓인 변경)를 서버 목록 위에 덮어 보여준다 */
function applyOutbox(list: Expense[], outbox: Op[]): Expense[] {
  let out = [...list];
  for (const op of outbox) {
    if (op.kind === 'delete') out = out.filter((e) => e.id !== op.id);
    else {
      const p = { ...op.expense, pending: true };
      const i = out.findIndex((e) => e.id === p.id);
      if (i >= 0) out[i] = p;
      else out.push(p);
    }
  }
  return out;
}

export function useWallet(enabled: boolean) {
  const cached = readJson<{ expenses: Expense[]; rate: number } | null>(CACHE_KEY, null);
  const [server, setServer] = useState<Expense[]>(cached?.expenses ?? []);
  const [rate, setRateState] = useState<number>(cached?.rate ?? 9.3);
  const [outbox, setOutbox] = useState<Op[]>(() => readJson<Op[]>(OUTBOX_KEY, []));
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');

  const saveOutbox = (next: Op[]) => {
    setOutbox(next);
    writeJson(OUTBOX_KEY, next);
  };

  const reload = useCallback(async () => {
    try {
      const d = await apiFetch<{ expenses: Expense[]; rate: number }>('/expenses');
      setServer(d.expenses);
      setRateState(d.rate);
      writeJson(CACHE_KEY, d);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 쌓인 변경을 순서대로 보내고, 네트워크 오류면 멈춘다 */
  const flush = useCallback(async () => {
    let box = readJson<Op[]>(OUTBOX_KEY, []);
    while (box.length) {
      try {
        await send(box[0]);
      } catch (e) {
        if (e instanceof ApiError && e.status === 0) break;
        // 서버가 거절한 변경(검증 실패 등)은 버린다
      }
      box = box.slice(1);
      writeJson(OUTBOX_KEY, box);
    }
    setOutbox(box);
    await reload();
  }, [reload]);

  useEffect(() => {
    if (!enabled) return;
    flush();
    const on = () => document.visibilityState === 'visible' && flush();
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', on);
    return () => {
      window.removeEventListener('online', flush);
      document.removeEventListener('visibilitychange', on);
    };
  }, [enabled, flush]);

  const run = async (op: Op) => {
    try {
      await send(op);
      await reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        saveOutbox([...readJson<Op[]>(OUTBOX_KEY, []), op]);
        return;
      }
      throw e;
    }
  };

  return {
    expenses: applyOutbox(server, outbox),
    rate,
    loading,
    error,
    pending: outbox.length,
    save: (e: Expense, isNew: boolean) => run({ kind: isNew ? 'create' : 'update', expense: e }),
    remove: (id: string) => run({ kind: 'delete', id }),
    setRate: async (r: number) => {
      await apiFetch('/settings/rate', { method: 'PUT', body: JSON.stringify({ rate: r }) });
      await reload();
    },
  };
}
