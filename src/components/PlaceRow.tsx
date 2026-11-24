import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Place } from '../data/types';
import { AREA_LABEL, CATEGORY_LABEL } from '../lib/labels';
import { CategoryIcon } from './CategoryIcon';
import { PlaceDetail } from './PlaceDetail';

export function PlaceRow({ place, index, defaultOpen = false }: { place: Place; index?: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
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
        </span>
        <ChevronDown size={18} className="place-chev" />
      </button>
      {open && <PlaceDetail place={place} />}
    </div>
  );
}
