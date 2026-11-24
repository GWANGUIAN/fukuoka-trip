import { Link } from 'react-router-dom';
import { AlertCircle, BedDouble, CalendarClock, ChevronRight, Plane, Sun } from 'lucide-react';
import { trip } from '../data/trip';
import { placeMap } from '../data/places';
import { ddayLabel, daysUntil, formatDate, tripPhase } from '../lib/date';
import { FlightRow } from '../components/FlightCard';
import { StatusBadge } from '../components/StatusBadge';
import { PlaceActions } from '../components/PlaceActions';
import { DAY_COLOR } from '../lib/labels';

export function Home() {
  const phase = tripPhase();
  const hotel = placeMap[trip.hotel.placeId];
  const upcoming = trip.todos.filter((t) => daysUntil(t.date) >= 0).slice(0, 3);
  const undecided = trip.days.flatMap((d) =>
    d.items.filter((i) => i.status === 'pending').map((i) => ({ day: d.day, item: i })),
  );

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-kicker">FUKUOKA · 2027</div>
        <h1 className="hero-title">지연이와 아이들의<br />후쿠오카 여행</h1>
        <div className="hero-date">
          {formatDate(trip.startDate)} – {formatDate(trip.endDate)} · 2박 3일
        </div>
        <div className="hero-dday">
          <div className="members">
            {trip.members.map((m) => (
              <span key={m} className="member">{m}</span>
            ))}
          </div>
          <div className="num">
            {phase.kind === 'before' ? `D-${phase.days}` : phase.kind === 'during' ? `DAY ${phase.day}` : '끝!'}
          </div>
        </div>
      </section>

      {phase.kind === 'during' && (
        <Link to={`/schedule?day=${phase.day}`} className="card today-card row">
          <Sun size={20} color="var(--primary)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>오늘은 {phase.day}일차 · {trip.days[phase.day - 1]?.title}</div>
            <div className="small muted">오늘 일정 바로 보기</div>
          </div>
          <ChevronRight size={18} />
        </Link>
      )}

      <section>
        <h2 className="section-title">
          <CalendarClock size={16} /> 일자별 일정
        </h2>
        <div className="stack">
          {trip.days.map((d) => (
            <Link key={d.day} to={`/schedule?day=${d.day}`} className="card row" style={{ padding: 14 }}>
              <span className="dday-chip" style={{ background: 'transparent', color: DAY_COLOR[d.day - 1], border: `1.5px solid ${DAY_COLOR[d.day - 1]}` }}>
                DAY {d.day}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{d.title}</div>
                <div className="xs faint">{formatDate(d.date)} · {d.theme}</div>
              </div>
              <ChevronRight size={18} className="faint" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title"><Plane size={16} /> 항공편 <span className="more">{trip.baggage}</span></h2>
        <div className="card">
          {trip.flights.map((f, i) => (
            <div key={f.code}>
              {i > 0 && <div className="divider" />}
              <FlightRow f={f} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title"><BedDouble size={16} /> 숙소</h2>
        <div className="card stack">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{hotel.name}</div>
              <div className="xs faint">{trip.hotel.condition}</div>
            </div>
            <StatusBadge status={trip.hotel.status} label={trip.hotel.statusNote} />
          </div>
          <div className="small muted">{hotel.memo}</div>
          <ul className="small muted" style={{ margin: 0, paddingLeft: 18 }}>
            {trip.hotel.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
          <PlaceActions place={hotel} />
        </div>
      </section>

      {upcoming.length > 0 && (
        <section>
          <h2 className="section-title">
            <CalendarClock size={16} /> 다가오는 예약 오픈 · 할 일
            <Link to="/checklist" className="more">전체 보기</Link>
          </h2>
          <div className="card list">
            {upcoming.map((t) => (
              <div key={t.id} className="list-row">
                <span className="dday-chip">{ddayLabel(t.date)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="small" style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="xs faint">{formatDate(t.date.split('T')[0])}</div>
                </div>
                {t.url && <a className="btn" href={t.url} target="_blank" rel="noreferrer">열기</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {undecided.length > 0 && (
        <section>
          <h2 className="section-title"><AlertCircle size={16} /> 아직 조율 중</h2>
          <div className="card list">
            {undecided.map(({ day, item }) => (
              <Link key={item.id} to={`/schedule?day=${day}`} className="list-row">
                <span className="badge pending">DAY {day}</span>
                <div style={{ flex: 1, minWidth: 0 }} className="small">
                  <b>{item.time}</b> {item.title}
                </div>
                <ChevronRight size={16} className="faint" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="footer-note">마지막 업데이트 {trip.updatedAt}</div>
    </div>
  );
}
