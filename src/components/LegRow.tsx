import { Footprints, TrainFront } from 'lucide-react';
import type { Place } from '../data/types';
import { estimateLeg } from '../lib/geo';
import { legUrl } from '../lib/maps';

/** 두 장소 사이 이동 정보 (탭하면 구글맵 길찾기) */
export function LegRow({ from, to }: { from: Place; to: Place }) {
  const leg = estimateLeg(from, to);
  if (!leg) return null;
  const Icon = leg.mode === 'walking' ? Footprints : TrainFront;
  return (
    <a className="leg" href={legUrl(from, to, leg.mode)} target="_blank" rel="noreferrer" title={`${from.name} → ${to.name}`}>
      <Icon size={13} />
      <span>{leg.label}</span>
      <span className="leg-km">· {leg.km}</span>
    </a>
  );
}
