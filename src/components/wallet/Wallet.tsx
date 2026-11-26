import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CloudOff, Plus, Receipt } from 'lucide-react';
import { trip } from '../../data/trip';
import { placeMap } from '../../data/places';
import { shortName, useAuth } from '../../lib/api';
import { tripPhase } from '../../lib/date';
import { useLocalStorage } from '../../lib/storage';
import { EXPENSE_CATEGORY_LABEL, money, rawMoney, summarize, toKrw, type Currency, type Expense } from '../../lib/settle';
import { useWallet } from '../../lib/wallet';
import { ExpenseForm, newExpense } from './ExpenseForm';

export function Wallet() {
  const auth = useAuth()!;
  const w = useWallet(true);
  const [cur, setCur] = useLocalStorage<Currency>('fk-wallet-cur', 'KRW');
  const [editing, setEditing] = useState<{ e: Expense; isNew: boolean } | null>(null);
  const [params, setParams] = useSearchParams();
  const s = useMemo(() => summarize(w.expenses, w.rate, trip.members), [w.expenses, w.rate]);
  const phase = tripPhase();
  const today = phase.kind === 'during' ? phase.day : null;

  // 장소 상세의 "지출 추가"에서 넘어온 경우: ?add=<placeId>&day=N
  useEffect(() => {
    const add = params.get('add');
    if (add === null) return;
    const day = Number(params.get('day')) || today;
    setEditing({ e: newExpense(auth.member, day, add || null), isNew: true });
    params.delete('add');
    params.delete('day');
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const groups = useMemo(() => {
    const g = new Map<string, Expense[]>();
    for (const e of w.expenses) {
      const key = e.settled ? 'prepaid' : e.day ? `day${e.day}` : 'etc';
      g.set(key, [...(g.get(key) ?? []), e]);
    }
    const order = ['prepaid', 'etc', ...trip.days.map((d) => `day${d.day}`)];
    const label = (k: string) => (k === 'prepaid' ? '사전 정산 완료' : k === 'etc' ? '여행 전·기타' : `DAY ${k.slice(3)}`);
    return order.filter((k) => g.has(k)).map((k) => ({ key: k, label: label(k), items: g.get(k)! }));
  }, [w.expenses]);

  const fmt = (krw: number) => money(krw, cur, w.rate);
  const prepaidPct = s.total ? (s.prepaid / s.total) * 100 : 0;

  const editRate = async () => {
    const v = prompt('100엔 = 몇 원? (3명 공통 환율)', String(Math.round(w.rate * 1000) / 10));
    if (!v) return;
    const r = Number(v) / 100;
    if (!(r > 1 && r < 30)) return alert('환율이 이상해요');
    try {
      await w.setRate(r);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="seg">
          {(['KRW', 'JPY'] as Currency[]).map((c) => (
            <button key={c} className={cur === c ? 'on' : ''} onClick={() => setCur(c)}>
              {c === 'KRW' ? '₩ 원' : '¥ 엔'}
            </button>
          ))}
        </div>
        <button className="xs faint" onClick={editRate}>
          100엔 = {Math.round(w.rate * 1000) / 10}원 ✎
        </button>
      </div>

      {w.pending > 0 && (
        <div className="card small row" style={{ color: 'var(--st-pending)' }}>
          <CloudOff size={16} /> 전송 대기 {w.pending}건 · 인터넷이 연결되면 자동으로 올라가요
        </div>
      )}
      {w.error && !w.pending && <div className="xs faint">최근 불러오기 실패: {w.error}</div>}

      <section className="card stack">
        <div className="xs faint">총 여행 비용 (3인)</div>
        <div className="calc-result" style={{ fontSize: 28 }}>{fmt(s.total)}</div>
        <div className="bar" aria-hidden>
          <span style={{ width: `${prepaidPct}%`, background: 'var(--navy)' }} />
          <span style={{ width: `${100 - prepaidPct}%`, background: 'var(--primary)' }} />
        </div>
        <div className="row xs muted" style={{ gap: 12, flexWrap: 'wrap' }}>
          <span className="row" style={{ gap: 4 }}><i className="dot" style={{ background: 'var(--navy)' }} />사전 정산 {fmt(s.prepaid)}</span>
          <span className="row" style={{ gap: 4 }}><i className="dot" style={{ background: 'var(--primary)' }} />현지 지출 {fmt(s.local)}</span>
        </div>
        <div className="divider" style={{ margin: '4px 0' }} />
        {s.people.map((p) => (
          <div key={p.member} className="row small" style={{ justifyContent: 'space-between' }}>
            <b>{shortName(p.member)}{p.member === auth.member && <span className="faint xs"> (나)</span>}</b>
            <span style={{ textAlign: 'right' }}>
              <b>{fmt(p.total)}</b>
              <span className="xs faint"> · 현지 {fmt(p.local)}</span>
            </span>
          </div>
        ))}
      </section>

      <section className="card stack">
        <div className="row" style={{ fontWeight: 700 }}>
          <Receipt size={16} /> 정산하기 <span className="xs faint" style={{ fontWeight: 500 }}>현지 지출 기준</span>
        </div>
        {s.transfers.length === 0 ? (
          <div className="row small muted"><CheckCircle2 size={16} color="var(--st-confirmed)" /> 서로 보낼 돈이 없어요</div>
        ) : (
          s.transfers.map((t) => (
            <div key={`${t.from}-${t.to}`} className="row small transfer">
              <b>{shortName(t.from)}</b>
              <ArrowRight size={14} className="faint" />
              <b>{shortName(t.to)}</b>
              <span style={{ marginLeft: 'auto', fontWeight: 800 }}>{fmt(t.krw)}</span>
            </div>
          ))
        )}
        {cur === 'JPY' && s.transfers.length > 0 && <div className="xs faint">송금은 원화 기준으로 계산돼요 (₩ 탭에서 확인)</div>}
      </section>

      {s.byCategory.length > 0 && (
        <div className="chips wrap">
          {s.byCategory.map((c) => (
            <span key={c.category} className="chip static">
              {EXPENSE_CATEGORY_LABEL[c.category]} <b>{fmt(c.krw)}</b>
            </span>
          ))}
        </div>
      )}

      <button className="btn primary big" onClick={() => setEditing({ e: newExpense(auth.member, today, null), isNew: true })}>
        <Plus size={16} /> 지출 추가
      </button>

      {w.loading && <div className="small faint">불러오는 중…</div>}
      {groups.map((g) => (
        <section key={g.key}>
          <h2 className="section-title">{g.label}</h2>
          <div className="card list">
            {g.items.map((e) => {
              const all = e.participants.length === trip.members.length;
              return (
                <button
                  key={e.id}
                  className="list-row expense-row"
                  disabled={e.settled}
                  onClick={() => setEditing({ e, isNew: false })}
                >
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div className="small" style={{ fontWeight: 650 }}>
                      {e.title}
                      {e.pending && <span className="badge pending" style={{ marginLeft: 6 }}>전송 대기</span>}
                    </div>
                    <div className="xs faint">
                      {EXPENSE_CATEGORY_LABEL[e.category]}
                      {!e.settled && ` · ${shortName(e.payer)} 결제`}
                      {!all && ` · ${e.participants.map(shortName).join('·')} 몫`}
                      {e.placeId && placeMap[e.placeId] && !e.settled ? ` · ${placeMap[e.placeId].name}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="small" style={{ fontWeight: 800 }}>{rawMoney(e.amount, e.currency)}</div>
                    {(e.currency === 'JPY') !== (cur === 'JPY') && <div className="xs faint">{fmt(toKrw(e, w.rate))}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {editing && (
        <ExpenseForm
          initial={editing.e}
          isNew={editing.isNew}
          rate={w.rate}
          onClose={() => setEditing(null)}
          onSave={(e) => w.save(e, editing.isNew)}
          onDelete={editing.isNew ? undefined : () => w.remove(editing.e.id)}
        />
      )}
    </div>
  );
}
