import { useState } from 'react';
import { BadgePercent, Calculator } from 'lucide-react';
import { useLocalStorage } from '../lib/storage';

const DEFAULT_RATE = 9.3; // 원/엔 — 출발 전 실제 환율로 수정해서 쓰기
const TAX_FREE_MIN = 5000; // 세전 기준

const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;
const yen = (n: number) => `¥${Math.round(n).toLocaleString('ja-JP')}`;

/** 엔화 → 원화 + 면세 기준 체크 (가격은 소비세 10% 포함가 기준) */
export function YenCalculator() {
  const [rate, setRate] = useLocalStorage<number>('fk-rate', DEFAULT_RATE);
  const [input, setInput] = useState('');
  const price = Number(input.replace(/[^\d]/g, '')) || 0;
  const preTax = price / 1.1;
  const taxFree = preTax >= TAX_FREE_MIN;

  return (
    <div className="card stack">
      <label className="calc-input">
        <span className="unit">¥</span>
        <input
          inputMode="numeric"
          placeholder="0"
          value={price ? price.toLocaleString('ja-JP') : ''}
          onChange={(e) => setInput(e.target.value)}
          aria-label="엔화 금액"
        />
      </label>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="calc-result">{won(price * rate)}</div>
        <label className="row xs faint">
          100엔 =
          <input
            className="rate-input"
            type="number"
            step="0.1"
            value={Math.round(rate * 1000) / 10}
            onChange={(e) => setRate(Number(e.target.value) / 100 || DEFAULT_RATE)}
            aria-label="환율 (100엔당 원)"
          />
          원
        </label>
      </div>
      {price > 0 && (
        <div className="small muted row" style={{ alignItems: 'flex-start' }}>
          <BadgePercent size={16} style={{ flex: 'none', marginTop: 2, color: taxFree ? 'var(--st-confirmed)' : 'var(--text-3)' }} />
          <span>
            세전 {yen(preTax)} ·{' '}
            {taxFree ? (
              <b style={{ color: 'var(--st-confirmed)' }}>면세 가능 — 약 {yen(price - preTax)} ({won((price - preTax) * rate)}) 절약</b>
            ) : (
              <>면세까지 세전 {yen(TAX_FREE_MIN - preTax)} 더</>
            )}
          </span>
        </div>
      )}
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {[1000, 5500, 10000, 30000].map((v) => (
          <button key={v} className="btn" onClick={() => setInput(String(v))}>{yen(v)}</button>
        ))}
      </div>
      <div className="xs faint row"><Calculator size={12} /> 환율은 직접 수정 가능 (이 기기에 저장) · 면세는 같은 날 같은 매장 합산 기준</div>
    </div>
  );
}
