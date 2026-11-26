import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react';
import { trip } from '../data/trip';
import { currentTime, daysUntil } from './date';

export interface HourWeather {
  hour: number;
  temp: number;
  pop: number;
  code: number;
}

export interface DayWeather {
  date: string;
  code: number;
  max: number;
  min: number;
  pop: number;
  wind: number;
  hours: HourWeather[];
  /** true = 예보가 아직 없어 1월 평년값 */
  normal: boolean;
}

const LAT = 33.59;
const LNG = 130.4;
const CACHE_KEY = 'fk-weather';
const CACHE_MS = 3 * 60 * 60 * 1000;
const FORECAST_DAYS = 16;

/** 후쿠오카 1월 평년값 (기상청 평년값 기준 대략) */
const NORMAL = { max: 10, min: 3, pop: 40, code: 3, wind: 15 };

function normals(): Record<string, DayWeather> {
  return Object.fromEntries(
    trip.days.map((d) => [d.date, { date: d.date, ...NORMAL, hours: [], normal: true }]),
  );
}

interface OpenMeteo {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: (number | null)[];
    weather_code: number[];
  };
}

function parse(j: OpenMeteo): Record<string, DayWeather> {
  const out: Record<string, DayWeather> = {};
  j.daily.time.forEach((date, i) => {
    out[date] = {
      date,
      code: j.daily.weather_code[i],
      max: Math.round(j.daily.temperature_2m_max[i]),
      min: Math.round(j.daily.temperature_2m_min[i]),
      pop: j.daily.precipitation_probability_max[i] ?? 0,
      wind: Math.round(j.daily.wind_speed_10m_max[i]),
      hours: [],
      normal: false,
    };
  });
  j.hourly.time.forEach((t, i) => {
    const [date, hm] = t.split('T');
    out[date]?.hours.push({
      hour: Number(hm.slice(0, 2)),
      temp: Math.round(j.hourly.temperature_2m[i]),
      pop: j.hourly.precipitation_probability[i] ?? 0,
      code: j.hourly.weather_code[i],
    });
  });
  return out;
}

async function fetchForecast(): Promise<Record<string, DayWeather>> {
  const q = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LNG),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
    hourly: 'temperature_2m,precipitation_probability,weather_code',
    timezone: 'Asia/Tokyo',
    start_date: trip.startDate,
    end_date: trip.endDate,
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  return parse(await res.json());
}

function readCache(): { at: number; data: Record<string, DayWeather> } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 여행 날짜별 날씨. 예보 범위(16일) 밖이면 평년값, 실패하면 마지막 캐시 → 평년값 */
export function useWeather(): Record<string, DayWeather> {
  const [data, setData] = useState<Record<string, DayWeather>>(() => readCache()?.data ?? normals());

  useEffect(() => {
    const inRange = daysUntil(trip.startDate) < FORECAST_DAYS;
    if (!inRange) {
      setData(normals());
      return;
    }
    const cache = readCache();
    if (cache && Date.now() - cache.at < CACHE_MS && !Object.values(cache.data)[0]?.normal) {
      setData(cache.data);
      return;
    }
    let alive = true;
    fetchForecast()
      .then((d) => {
        if (!alive) return;
        setData(d);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data: d }));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* 오프라인 등: 기존 값 유지 */
      });
    return () => {
      alive = false;
    };
  }, []);

  return data;
}

export function weatherInfo(code: number): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: '맑음', Icon: Sun };
  if (code <= 2) return { label: '구름 조금', Icon: CloudSun };
  if (code === 3) return { label: '흐림', Icon: Cloud };
  if (code === 45 || code === 48) return { label: '안개', Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: '이슬비', Icon: CloudDrizzle };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: '비', Icon: CloudRain };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: '눈', Icon: CloudSnow };
  if (code >= 95) return { label: '뇌우', Icon: CloudLightning };
  return { label: '흐림', Icon: Cloud };
}

const isSnow = (c: number) => (c >= 71 && c <= 77) || c === 85 || c === 86;

/** 옷차림·준비물 한 줄 */
export function outfitTips(w: DayWeather): string[] {
  const tips: string[] = [];
  if (w.min <= 3) tips.push('패딩·장갑 필수');
  else if (w.min <= 8) tips.push('두꺼운 코트');
  else tips.push('가벼운 외투');
  if (w.pop >= 50) tips.push('우산 챙기기');
  else if (w.pop >= 30) tips.push('접이식 우산');
  if (isSnow(w.code)) tips.push('미끄럼 주의');
  if (w.wind >= 30) tips.push('바람 강해 체감 더 추움');
  return tips;
}

/** 여행 당일: 지금 이후 비 소식 요약 */
export function rainSummary(w: DayWeather): string | null {
  if (w.normal || w.hours.length === 0) return null;
  const nowH = currentTime().getHours();
  const rest = w.hours.filter((h) => h.hour >= nowH);
  const rainy = rest.find((h) => h.pop >= 50);
  if (rainy) return rainy.hour === nowH ? `지금 비 소식 ${rainy.pop}%` : `${rainy.hour}시부터 비 ${rainy.pop}%`;
  return '오늘 남은 시간 비 소식 없음';
}
