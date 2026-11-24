import { Plane } from 'lucide-react';
import type { Flight } from '../data/types';
import { formatDate } from '../lib/date';
import { StatusBadge } from './StatusBadge';

export function FlightRow({ f }: { f: Flight }) {
  return (
    <div>
      <div className="flight-head">
        <span><b>{f.direction}</b> <span className="faint">· {f.airline} {f.code} · {formatDate(f.date)}</span></span>
        <StatusBadge status={f.status} />
      </div>
      <div className="flight">
        <div>
          <div className="time">{f.depTime}</div>
          <div className="apt">{f.depAirport}</div>
        </div>
        <div className="mid">
          <Plane size={16} />
          <div className="line" />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="time">{f.arrTime}</div>
          <div className="apt">{f.arrAirport}</div>
        </div>
      </div>
    </div>
  );
}
