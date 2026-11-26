import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Place } from '../data/types';
import { AREA_LABEL, CATEGORY_LABEL } from '../lib/labels';
import { CategoryIcon } from './CategoryIcon';
import { PlaceDetail } from './PlaceDetail';
import { OPEN_TONE, openStatus, type OpenMode } from '../lib/hours';

export interface OpenAt {
  date: Date;
  mode: OpenMode;
}

export function PlaceRow({ place, index, defaultOpen = false, at }: { place: Place; index?: number; defaultOpen?: boolean; at?: OpenAt }) {
  const [open, setOpen] = useState(defaultOpen);
  const status = at ? openStatus(place, at.date, at.mode) : null;
  return (
    <div className={`place${open ? ' open' : ''}`}>
      <button className="place-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="place-icon"><CategoryIcon category={place.category} /></span>
        <span style={{ minWidth: 0 }}>
          <div className="place-name">{index !== undefined ? `${index}. ` : ''}{place.name}</div>
          <div className="place-meta">
            {CATEGORY_LABEL[place.category]} · {AREA_LABEL[place.area]}
            {place.hours ? ` · ${place.hours}` : ''}
          </div>
          {status && <span className={`open-badge ${OPEN_TONE[status.state]}`}>{status.label}</span>}
        </span>
        <ChevronDown size={18} className="place-chev" />
      </button>
      {open && <PlaceDetail place={place} />}
    </div>
  );
}
