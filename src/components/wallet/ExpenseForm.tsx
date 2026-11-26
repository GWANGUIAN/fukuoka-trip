import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { trip } from '../../data/trip';
import { placeMap } from '../../data/places';
import { shortName } from '../../lib/api';
import { EXPENSE_CATEGORY_LABEL, type Currency, type Expense, type ExpenseCategory } from '../../lib/settle';
import { Modal } from '../Modal';

const CATS: ExpenseCategory[] = ['food', 'cafe', 'shopping', 'transport', 'sight', 'bar', 'etc'];

/** 그날 일정에 나오는 장소들 (지출에 연결용) */
function dayPlaces(day: number | null) {
  const d = trip.days.find((x) => x.day === day);
  if (!d) return [];
  const ids = [...new Set(d.items.flatMap((i) => [...i.places, ...(i.alternatives ?? [])]))];
  return ids.map((id) => placeMap[id]).filter(Boolean);
}

const CAT_FROM_PLACE: Record<string, ExpenseCategory> = { food: 'food', cafe: 'cafe', shopping: 'shopping', sight: 'sight', bar: 'bar', transport: 'transport' };

export function newExpense(me: string, day: number | null, placeId: string | null): Expense {
  const place = placeId ? placeMap[placeId] : undefined;
  return {
    id: crypto.randomUUID(),
    title: place?.name ?? '',
    category: (place && CAT_FROM_PLACE[place.category]) || 'food',
    amount: 0,
    currency: 'JPY',
    payer: me,
    participants: [...trip.members],
    day,
    placeId,
    settled: false,
  };
}

export function ExpenseForm({
  initial,
  isNew,
  rate,
  onSave,
  onDelete,
  onClose,
}: {
  initial: Expense;
  isNew: boolean;
  rate: number;
  onSave: (e: Expense) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const [e, setE] = useState<Expense>(initial);
  const [amountText, setAmountText] = useState(initial.amount ? String(initial.amount) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof Expense>(k: K, v: Expense[K]) => setE((p) => ({ ...p, [k]: v }));
  const amount = Number(amountText.replace(/[^\d.]/g, '')) || 0;
  const places = dayPlaces(e.day);

  const toggleParticipant = (m: string) =>
    set('participants', e.participants.includes(m) ? e.participants.filter((p) => p !== m) : trip.members.filter((x) => x === m || e.participants.includes(x)));

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await onSave({ ...e, amount, title: e.title.trim() });
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const valid = amount > 0 && e.title.trim() && e.participants.length > 0;
  const converted = e.currency === 'JPY' ? `≈ ₩${Math.round(amount * rate).toLocaleString('ko-KR')}` : `≈ ¥${Math.round(amount / rate).toLocaleString('ja-JP')}`;

  return (
    <Modal title={isNew ? '지출 추가' : '지출 수정'} onClose={onClose}>
      <div className="stack">
        <div className="calc-input">
          <div className="seg">
            {(['JPY', 'KRW'] as Currency[]).map((c) => (
              <button key={c} className={e.currency === c ? 'on' : ''} onClick={() => set('currency', c)}>
                {c === 'JPY' ? '¥' : '₩'}
              </button>
            ))}
          </div>
          <input
            inputMode="decimal"
            placeholder="0"
            autoFocus={isNew}
            value={amountText}
            onChange={(ev) => setAmountText(ev.target.value)}
            aria-label="금액"
          />
        </div>
        {amount > 0 && <div className="xs faint" style={{ marginTop: -4 }}>{converted} (100엔 = {Math.round(rate * 100)}원)</div>}

        <input className="field" placeholder="내용 (예: 이치란 라멘)" value={e.title} onChange={(ev) => set('title', ev.target.value)} />

        <div className="form-label">분류</div>
        <div className="chips wrap">
          {CATS.map((c) => (
            <button key={c} className={`chip${e.category === c ? ' active' : ''}`} onClick={() => set('category', c)}>
              {EXPENSE_CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <div className="form-label">결제한 사람</div>
        <div className="chips wrap">
          {trip.members.map((m) => (
            <button key={m} className={`chip${e.payer === m ? ' active' : ''}`} onClick={() => set('payer', m)}>
              {shortName(m)}
            </button>
          ))}
        </div>

        <div className="form-label">누구 몫? <span className="faint">(나눠서 부담할 사람)</span></div>
        <div className="chips wrap">
          {trip.members.map((m) => (
            <button key={m} className={`chip${e.participants.includes(m) ? ' active' : ''}`} onClick={() => toggleParticipant(m)}>
              {shortName(m)}
            </button>
          ))}
        </div>
        {amount > 0 && e.participants.length > 0 && (
          <div className="xs faint" style={{ marginTop: -4 }}>
            1인당 {e.currency === 'JPY' ? '¥' : '₩'}
            {Math.round(amount / e.participants.length).toLocaleString()}
          </div>
        )}

        <div className="form-label">날짜</div>
        <div className="chips wrap">
          {trip.days.map((d) => (
            <button key={d.day} className={`chip${e.day === d.day ? ' active' : ''}`} onClick={() => setE((p) => ({ ...p, day: d.day, placeId: null }))}>
              DAY {d.day}
            </button>
          ))}
          <button className={`chip${e.day === null ? ' active' : ''}`} onClick={() => setE((p) => ({ ...p, day: null, placeId: null }))}>
            여행 전·기타
          </button>
        </div>

        {places.length > 0 && (
          <select className="field" value={e.placeId ?? ''} onChange={(ev) => set('placeId', ev.target.value || null)} aria-label="장소">
            <option value="">장소 연결 안 함</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {error && <div className="xs" style={{ color: 'var(--primary)' }}>{error}</div>}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          {onDelete ? (
            <button
              className="btn"
              disabled={busy}
              onClick={async () => {
                if (!confirm('이 지출을 지울까요?')) return;
                setBusy(true);
                try {
                  await onDelete();
                  onClose();
                } catch (err) {
                  setError((err as Error).message);
                  setBusy(false);
                }
              }}
            >
              <Trash2 size={14} /> 삭제
            </button>
          ) : (
            <span />
          )}
          <button className="btn primary big" disabled={!valid || busy} onClick={submit}>
            {busy ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
