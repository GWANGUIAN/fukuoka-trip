import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Route } from 'lucide-react';
import { trip } from '../data/trip';
import { placeMap } from '../data/places';
import type { ScheduleItem } from '../data/types';
import { formatDate, timeToMinutes, tripPhase, weekday } from '../lib/date';
import { routeUrl } from '../lib/maps';
import { DAY_COLOR } from '../lib/labels';
import { StatusBadge } from '../components/StatusBadge';
import { PlaceRow } from '../components/PlaceRow';

function nowItemId(items: ScheduleItem[]): string | null {
  const d = new Date();
  const mins = d.getHours() * 60 + d.getMinutes();
  let found: string | null = null;
  for (const it of items) {
    const t = timeToMinutes(it.time);
    if (t !== null && t <= mins) found = it.id;
  }
  return found;
}

function TimelineItem({ item, isNow, color }: { item: ScheduleItem; isNow: boolean; color: string }) {
  const [altOpen, setAltOpen] = useState(false);
  const mains = item.places.map((id) => placeMap[id]).filter(Boolean);
  const alts = (item.alternatives ?? []).map((id) => placeMap[id]).filter(Boolean);
  const route = mains.length > 2 ? routeUrl(mains) : null;

  return (
    <div className={`tl-item${isNow ? ' now' : ''}`} style={{ ['--day-color' as string]: color }}>
      <div className="tl-time">{item.time}</div>
      <span className="tl-dot" />
      <div className="tl-body">
        <div className="tl-card">
          <div className="tl-title">
            <h3>{item.title}</h3>
            <StatusBadge status={item.status} />
          </div>
          {item.note && <div className="tl-note">{item.note}</div>}
          {mains.map((p, i) => (
            <PlaceRow key={p.id} place={p} index={mains.length > 1 ? i + 1 : undefined} />
          ))}
          {route && (
            <div style={{ marginTop: 10 }}>
              <a className="btn navy" href={route} target="_blank" rel="noreferrer">
                <Route size={14} /> 전체 동선 구글맵으로 보기
              </a>
            </div>
          )}
          {alts.length > 0 && (
            <>
              <button className="alt-toggle" onClick={() => setAltOpen((o) => !o)}>
                대안 · 후보 {alts.length}곳
                <ChevronDown size={14} style={{ transform: altOpen ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />
              </button>
              {altOpen && (
                <div className="alt-box">
                  {alts.map((p) => <PlaceRow key={p.id} place={p} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function Schedule() {
  const [params, setParams] = useSearchParams();
  const phase = tripPhase();
  const todayDay = phase.kind === 'during' ? phase.day : null;
  const paramDay = Number(params.get('day'));
  const day = paramDay >= 1 && paramDay <= trip.days.length ? paramDay : (todayDay ?? 1);
  const current = trip.days[day - 1];
  const color = DAY_COLOR[day - 1];

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const nowId = useMemo(
    () => (todayDay === day ? nowItemId(current.items) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayDay, day, current, tick],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [day]);

  return (
    <div className="page" style={{ paddingTop: 0 }}>
      <div className="day-tabs" role="tablist">
        {trip.days.map((d) => (
          <button
            key={d.day}
            role="tab"
            aria-selected={d.day === day}
            className={`day-tab${d.day === day ? ' active' : ''}`}
            onClick={() => setParams({ day: String(d.day) }, { replace: true })}
          >
            <div className="d">
              DAY {d.day}
              {todayDay === d.day && <span className="today-dot" />}
            </div>
            <div className="w">{formatDate(d.date, false)} {weekday(d.date)}</div>
          </button>
        ))}
      </div>

      <div className="day-head">
        <div className="xs" style={{ color, fontWeight: 700 }}>DAY {day} · {formatDate(current.date)}</div>
        <div className="t">{current.title}</div>
        <div className="small muted">{current.theme}</div>
      </div>

      <div className="timeline">
        {current.items.map((it) => (
          <TimelineItem key={it.id} item={it} isNow={it.id === nowId} color={color} />
        ))}
      </div>

      {current.excluded && current.excluded.length > 0 && (
        <div className="excluded-list">
          <span>제외됨</span>
          {current.excluded.map((id) => (
            <span key={id} className="badge excluded">{placeMap[id]?.name ?? id}</span>
          ))}
        </div>
      )}
    </div>
  );
}
