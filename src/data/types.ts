/** 일정/장소 상태 */
export type Status =
  | 'confirmed' // 확정
  | 'booked' // 예약완료
  | 'pending' // 조율중
  | 'candidate' // 후보
  | 'optional' // 선택
  | 'excluded'; // 제외

export type Category = 'food' | 'cafe' | 'shopping' | 'sight' | 'hotel' | 'transport' | 'bar';

export type Area = 'hakata' | 'nakasu' | 'tenjin' | 'daimyo' | 'yakuin' | 'airport';

export interface LinkItem {
  title: string;
  url: string;
}

export interface Place {
  id: string;
  name: string;
  /** 일본어 상호 — 구글맵 검색 정확도용 */
  nameJa?: string;
  /** 일본어 주소 — 있으면 길찾기 검색에 최우선 사용 */
  address?: string;
  category: Category;
  area: Area;
  /** 대략 좌표 (지도 핀용). 정확한 위치는 구글맵 링크 기준 */
  lat: number;
  lng: number;
  hours?: string;
  closed?: string;
  /** 구글맵 링크 (cid 링크 등). 없으면 이름으로 검색 링크 자동 생성 */
  mapUrl?: string;
  reserveUrl?: string;
  reservation?: { required: boolean; note?: string };
  blogs?: LinkItem[];
  memo?: string;
}

export interface ScheduleItem {
  id: string;
  /** "09:30", "오후", "밤" 등 자유 형식 */
  time?: string;
  title: string;
  status: Status;
  /** 메인 장소 (순서대로 = 동선) */
  places: string[];
  /** 대안/후보 장소 */
  alternatives?: string[];
  note?: string;
  links?: LinkItem[];
}

export interface Day {
  day: number;
  date: string; // YYYY-MM-DD
  title: string;
  theme: string;
  items: ScheduleItem[];
  excluded?: string[];
}

export interface Flight {
  code: string;
  airline: string;
  direction: '가는 편' | '오는 편';
  date: string;
  depTime: string;
  depAirport: string;
  arrTime: string;
  arrAirport: string;
  status: Status;
}

export interface Todo {
  id: string;
  /** YYYY-MM-DD 또는 YYYY-MM-DDTHH:mm */
  date: string;
  title: string;
  note?: string;
  url?: string;
}

export interface Trip {
  title: string;
  startDate: string;
  endDate: string;
  members: string[];
  updatedAt: string;
  flights: Flight[];
  baggage: string;
  hotel: {
    placeId: string;
    status: Status;
    statusNote: string;
    condition: string;
    details?: { label: string; value: string }[];
    notes: string[];
  };
  days: Day[];
  todos: Todo[];
  risks: string[];
  packing: string[];
  tips: { title: string; body: string }[];
  links: LinkItem[];
}
