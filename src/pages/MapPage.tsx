import { useEffect, useMemo, useState } from 'react';
import { APIProvider, AdvancedMarker, Map, useMap } from '@vis.gl/react-google-maps';
import { MapPinOff, Route, X } from 'lucide-react';
import { trip } from '../data/trip';
import { placeMap } from '../data/places';
import type { Place } from '../data/types';
import { MAP_ID, MAPS_KEY, routeUrl } from '../lib/maps';
import { AREA_LABEL, CATEGORY_LABEL, DAY_HEX } from '../lib/labels';
import { PlaceDetail } from '../components/PlaceDetail';
import { PlaceRow } from '../components/PlaceRow';
import { CategoryIcon } from '../components/CategoryIcon';

interface Pin {
  key: string;
  place: Place;
  day: number;
  order: number;
  alt: boolean;
}

/** 일자별 동선(메인 장소 순서) + 대안 핀 */
function buildPins(): Pin[] {
  const pins: Pin[] = [];
  for (const d of trip.days) {
    let order = 0;
    const seen = new Set<string>();
    for (const it of d.items) {
      for (const id of it.places) {
        const p = placeMap[id];
        if (!p || seen.has(id)) continue;
        seen.add(id);
        order += 1;
        pins.push({ key: `${d.day}-${id}`, place: p, day: d.day, order, alt: false });
      }
      for (const id of it.alternatives ?? []) {
        const p = placeMap[id];
        if (p && !seen.has(id)) {
          seen.add(id);
          pins.push({ key: `${d.day}-alt-${id}`, place: p, day: d.day, order: 0, alt: true });
        }
      }
    }
  }
  return pins;
}

function dayRoute(day: number): Place[] {
  const d = trip.days[day - 1];
  return d.items.flatMap((it) => it.places.map((id) => placeMap[id]).filter(Boolean));
}

function Polylines({ days }: { days: number[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof google === "undefined") return;
    const lines = days.map(
      (day) =>
        new google.maps.Polyline({
          map,
          path: dayRoute(day).map((p) => ({ lat: p.lat, lng: p.lng })),
          strokeColor: DAY_HEX[day - 1],
          strokeOpacity: 0,
          icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.8, scale: 3 }, offset: '0', repeat: '12px' }],
        }),
    );
    return () => lines.forEach((l) => l.setMap(null));
  }, [map, days]);
  return null;
}

function FitBounds({ pins }: { pins: Pin[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof google === "undefined" || pins.length === 0) return;
    const b = new google.maps.LatLngBounds();
    // 공항은 시내와 멀어서 전체 보기에서는 범위 계산에서 제외
    const city = pins.filter((p) => p.place.area !== 'airport');
    (city.length ? city : pins).forEach((p) => b.extend({ lat: p.place.lat, lng: p.place.lng }));
    map.fitBounds(b, 48);
  }, [map, pins]);
  return null;
}

export function MapPage() {
  const [filter, setFilter] = useState<number>(0); // 0 = 전체
  const [selected, setSelected] = useState<Pin | null>(null);
  const allPins = useMemo(buildPins, []);
  const pins = useMemo(() => (filter ? allPins.filter((p) => p.day === filter) : allPins), [allPins, filter]);
  const days = useMemo(() => (filter ? [filter] : trip.days.map((d) => d.day)), [filter]);
  const route = filter ? routeUrl(dayRoute(filter).filter((p) => p.area !== 'airport')) : null;

  // 권역별 그룹 (리스트용, 같은 장소 중복 제거)
  const grouped = useMemo(() => {
    const g: Record<string, Pin[]> = {};
    const seen = new Set<string>();
    pins.forEach((p) => {
      if (seen.has(p.place.id)) return;
      seen.add(p.place.id);
      (g[AREA_LABEL[p.place.area]] ??= []).push(p);
    });
    return g;
  }, [pins]);

  const pick = (d: number) => {
    setFilter(d);
    setSelected(null);
  };

  return (
    <div className="page">
      <div>
        <h1 className="page-title">지도</h1>
        <p className="page-sub">일자별 동선 · 핀 번호는 방문 순서, 흐린 핀은 대안</p>
      </div>

      <div className="chips">
        <button className={`chip${filter === 0 ? ' active' : ''}`} onClick={() => pick(0)}>전체</button>
        {trip.days.map((d) => (
          <button key={d.day} className={`chip${filter === d.day ? ' active' : ''}`} onClick={() => pick(d.day)}>
            <span className="sw" style={{ background: DAY_HEX[d.day - 1] }} />
            DAY {d.day}
          </button>
        ))}
      </div>

      <div className="map-wrap">
        {MAPS_KEY ? (
          <APIProvider apiKey={MAPS_KEY} language="ko" region="JP">
            <Map
              mapId={MAP_ID}
              defaultCenter={{ lat: 33.5902, lng: 130.408 }}
              defaultZoom={14}
              gestureHandling="greedy"
              disableDefaultUI
              zoomControl
              clickableIcons={false}
              onClick={() => setSelected(null)}
            >
              <Polylines days={days} />
              <FitBounds pins={pins} />
              {pins.map((p) => (
                <AdvancedMarker
                  key={p.key}
                  position={{ lat: p.place.lat, lng: p.place.lng }}
                  zIndex={p.alt ? 1 : 10}
                  onClick={() => setSelected(p)}
                  title={p.place.name}
                >
                  <div
                    className={`pin${p.alt ? ' alt' : ''}${selected?.key === p.key ? ' sel' : ''}`}
                    style={{ background: DAY_HEX[p.day - 1] }}
                  >
                    <span>{p.alt ? '' : p.order}</span>
                  </div>
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        ) : (
          <div className="map-fallback">
            <MapPinOff size={28} className="faint" />
            <div style={{ fontWeight: 700 }}>지도 API 키가 아직 설정되지 않았어요</div>
            <div className="small muted">
              docs/GOOGLE_MAPS_SETUP.md 가이드대로 키를 등록하면 지도가 표시됩니다. 아래 목록에서 장소별로 구글맵을 열 수 있어요.
            </div>
            <a className="btn navy" href="https://www.google.com/maps/search/?api=1&query=%E5%8D%9A%E5%A4%9A%E9%A7%85" target="_blank" rel="noreferrer">
              구글맵에서 하카타 열기
            </a>
          </div>
        )}
      </div>

      {route && (
        <a className="btn navy" style={{ alignSelf: 'flex-start' }} href={route} target="_blank" rel="noreferrer">
          <Route size={14} /> DAY {filter} 전체 동선 구글맵으로 보기
        </a>
      )}

      <section className="stack">
        {Object.entries(grouped).map(([area, list]) => (
          <div key={area} className="card" style={{ paddingTop: 10 }}>
            <div className="area-label">{area}</div>
            {list.map((p) => (
              <PlaceRow key={p.key} place={p.place} />
            ))}
          </div>
        ))}
      </section>

      {selected && (
        <div className="sheet">
          <div className="card">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <span className="place-icon" style={{ color: DAY_HEX[selected.day - 1] }}>
                <CategoryIcon category={selected.place.category} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{selected.place.name}</div>
                <div className="xs faint">
                  DAY {selected.day}
                  {selected.alt ? ' · 대안' : ` · ${selected.order}번째`} · {CATEGORY_LABEL[selected.place.category]} ·{' '}
                  {AREA_LABEL[selected.place.area]}
                </div>
              </div>
              <button aria-label="닫기" onClick={() => setSelected(null)}>
                <X size={20} />
              </button>
            </div>
            <PlaceDetail place={selected.place} />
          </div>
        </div>
      )}
    </div>
  );
}
