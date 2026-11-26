import { Shirt } from 'lucide-react';
import { outfitTips, weatherInfo, type DayWeather } from '../lib/weather';

/** 홈 일자 카드용 작은 칩: 아이콘 + 최고/최저 */
export function WeatherChip({ w }: { w?: DayWeather }) {
  if (!w) return null;
  const { Icon, label } = weatherInfo(w.code);
  return (
    <span className="wx-chip" title={w.normal ? '1월 평년값' : label}>
      <Icon size={15} />
      {w.max}°/{w.min}°
    </span>
  );
}

/** 일정 탭 day-head 아래: 날씨 한 줄 + 옷차림 */
export function DayWeatherLine({ w }: { w?: DayWeather }) {
  if (!w) return null;
  const { Icon, label } = weatherInfo(w.code);
  return (
    <div className="wx-line">
      <div className="row small" style={{ gap: 6 }}>
        <Icon size={16} />
        <b>{w.normal ? '1월 평년' : label}</b>
        <span>{w.max}° / {w.min}°</span>
        <span className="faint">· 강수 {w.pop}%</span>
      </div>
      <div className="row xs muted" style={{ gap: 6 }}>
        <Shirt size={13} /> {outfitTips(w).join(' · ')}
        {w.normal && <span className="faint">(예보는 출발 2주 전부터)</span>}
      </div>
    </div>
  );
}
