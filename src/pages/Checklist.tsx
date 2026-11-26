import type { ReactNode } from 'react';
import { AlertTriangle, BellRing, CalendarClock, Check, Luggage } from 'lucide-react';
import { trip } from '../data/trip';
import { currentTime, daysUntil, ddayLabel, formatDate } from '../lib/date';
import { PushCard } from '../components/PushCard';
import { upcomingLabels } from '../../worker/src/notifyRules';
import { useLocalStorage } from '../lib/storage';

function CheckRow({
  id,
  label,
  sub,
  checked,
  onToggle,
  right,
}: {
  id: string;
  label: string;
  sub?: ReactNode;
  checked: boolean;
  onToggle: (id: string) => void;
  right?: ReactNode;
}) {
  return (
    <div className={`list-row${checked ? ' done' : ''}`}>
      <button className={`check${checked ? ' on' : ''}`} onClick={() => onToggle(id)} aria-pressed={checked} aria-label={label}>
        {checked && <Check size={14} strokeWidth={3} />}
      </button>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onToggle(id)}>
        <div className="small label" style={{ fontWeight: 600 }}>{label}</div>
        {sub && <div className="xs faint">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function Checklist() {
  const [done, setDone] = useLocalStorage<Record<string, boolean>>('fk-checks', {});
  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));

  return (
    <div className="page">
      <div>
        <h1 className="page-title">체크리스트</h1>
        <p className="page-sub">체크 표시는 이 기기에만 저장돼요</p>
      </div>

      <section>
        <h2 className="section-title"><CalendarClock size={16} /> 예약 오픈 · 할 일</h2>
        <div className="stack">
        <PushCard />
        <div className="card list">
          {trip.todos.map((t) => {
            const key = `todo-${t.id}`;
            const [d, time] = t.date.split('T');
            const bells = upcomingLabels(t, currentTime().getTime());
            return (
              <CheckRow
                key={t.id}
                id={key}
                label={t.title}
                sub={
                  <>
                    {formatDate(d)}{time ? ` ${time}` : ''}{t.note ? ` · ${t.note}` : ''}
                    {bells.length > 0 && (
                      <span className="bell-line"><BellRing size={11} /> {bells.join(' · ')}</span>
                    )}
                  </>
                }
                checked={!!done[key]}
                onToggle={toggle}
                right={
                  <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>
                    <span className={`dday-chip${daysUntil(t.date) < 0 ? ' past' : ''}`}>{ddayLabel(t.date)}</span>
                    {t.url && <a className="btn" href={t.url} target="_blank" rel="noreferrer">열기</a>}
                  </div>
                }
              />
            );
          })}
        </div>
        </div>
      </section>

      <section>
        <h2 className="section-title"><AlertTriangle size={16} /> 확인 필요 · 리스크</h2>
        <div className="card list">
          {trip.risks.map((r) => (
            <CheckRow key={r} id={`risk-${r}`} label={r} checked={!!done[`risk-${r}`]} onToggle={toggle} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title"><Luggage size={16} /> 준비물</h2>
        <div className="card list">
          {trip.packing.map((p) => (
            <CheckRow key={p} id={`pack-${p}`} label={p} checked={!!done[`pack-${p}`]} onToggle={toggle} />
          ))}
        </div>
      </section>
    </div>
  );
}
