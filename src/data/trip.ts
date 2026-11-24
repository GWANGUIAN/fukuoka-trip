import type { Trip } from './types';

/**
 * ★ 여행 일정 데이터 — 일정이 바뀌면 이 파일만 고치고 push 하세요.
 *   status: confirmed(확정) | booked(예약완료) | pending(조율중) | candidate(후보) | optional(선택) | excluded(제외)
 *   places / alternatives 에는 places.ts 의 id 를 넣습니다.
 *   수정할 때 updatedAt 도 같이 바꿔 주세요.
 */
export const trip: Trip = {
  title: '지연이와 아이들의 후쿠오카 여행',
  startDate: '2027-01-22',
  endDate: '2027-01-24',
  members: ['조수빈', '이지연', '안광의'],
  updatedAt: '2026-11-25',

  flights: [
    {
      code: 'LJ421',
      airline: '진에어',
      direction: '가는 편',
      date: '2027-01-22',
      depTime: '06:55',
      depAirport: '인천 T2',
      arrTime: '08:15',
      arrAirport: '후쿠오카',
      status: 'confirmed',
    },
    {
      code: 'LJ456',
      airline: '진에어',
      direction: '오는 편',
      date: '2027-01-24',
      depTime: '14:40',
      depAirport: '후쿠오카',
      arrTime: '16:10',
      arrAirport: '인천 T2',
      status: 'confirmed',
    },
  ],
  baggage: '위탁수하물 15kg 포함',

  hotel: {
    placeId: 'hotel-apa',
    status: 'pending',
    statusNote: '후보 합의 · 최종 예약 전',
    condition: '1/22(금) – 1/24(일) 2박 · 성인 3명 · 방 2개',
    notes: [
      '기존 아고다 예약 취소 후 다른 예약처·조건으로 재예약 예정',
      '최종 예약처 및 체크인/체크아웃 시간 미확정',
      '숙박세 1인 1박 200엔 (3인 2박 총 1,200엔) 현장 납부',
    ],
  },

  days: [
    {
      day: 1,
      date: '2027-01-22',
      title: '하카타 집중',
      theme: '도착 · 장어덮밥 · 캐널시티 · 모츠나베',
      items: [
        {
          id: 'd1-arrive',
          time: '08:15',
          title: '후쿠오카 공항 도착 (LJ421)',
          status: 'confirmed',
          places: ['airport'],
        },
        {
          id: 'd1-hotel',
          time: '09:30',
          title: '숙소 짐 보관',
          status: 'pending',
          places: ['hotel-apa'],
        },
        {
          id: 'd1-lunch',
          time: '10:00',
          title: '점심 — 장어덮밥',
          status: 'candidate',
          places: ['yoshizuka-unagi'],
          alternatives: ['tetsu-minoshima'],
        },
        {
          id: 'd1-afternoon',
          time: '오후',
          title: '볼거리 · 쇼핑',
          status: 'candidate',
          places: ['kushida', 'canal-city'],
          alternatives: ['tochoji'],
          note: '토초지는 선택',
        },
        {
          id: 'd1-dinner',
          time: '17:00',
          title: '저녁 — 모츠나베',
          status: 'booked',
          places: ['maedaya-honten'],
          alternatives: ['maedaya-hakata'],
          note: '총본점 17:00 / 하카타점 19:30 둘 다 예약 상태 → 1곳 확정 후 나머지는 전날까지 전화 취소',
        },
        {
          id: 'd1-night',
          time: '밤',
          title: '장보기 → 하카타 오뎅바',
          status: 'confirmed',
          places: ['kitte-mart', 'hotel-apa', 'oden-bar'],
          note: '3인 합의 확정 · KITTE B1F 마트(21:00 마감)에서 장보고 숙소에 짐 둔 뒤 오뎅바',
        },
      ],
      excluded: ['lalaport'],
    },
    {
      day: 2,
      date: '2027-01-23',
      title: '텐진 면세 · 쇼핑 투어',
      theme: '라멘 · 명란바게트 · 함바그 · 이와타야 · 다이묘',
      items: [
        {
          id: 'd2-breakfast',
          time: '08:30',
          title: '아침 — 이치란 라멘 (~09:00)',
          status: 'confirmed',
          places: ['ichiran-tenjin'],
        },
        {
          id: 'd2-snack',
          time: '10:00',
          title: '오픈런 — 명란바게트',
          status: 'confirmed',
          places: ['fullfull-tenjin'],
        },
        {
          id: 'd2-lunch',
          time: '12:00',
          title: '점심 — 함바그',
          status: 'confirmed',
          places: ['hikiniku'],
          note: '예약 방식 미정: 12/1 우선 티켓 vs 1/15 자정 무료 일반 예약',
        },
        {
          id: 'd2-taxfree',
          time: '13:00',
          title: '면세 일괄 쇼핑 (~15:00)',
          status: 'candidate',
          places: ['iwataya'],
        },
        {
          id: 'd2-route',
          time: '15:30',
          title: '쇼핑 · 카페 루트 (~19:00)',
          status: 'candidate',
          places: ['montbell', 'kego', 'northface', 'latte-mania', 'onitsuka', 'tenjin-chika', 'donki-tenjin'],
        },
        {
          id: 'd2-dinner',
          time: '저녁',
          title: '저녁 — 1차 스시 → 2차 야키니쿠',
          status: 'confirmed',
          places: ['kego-takami', 'akatan'],
          note: '3인 합의 확정 · 케고 타카미 스시 전화 예약 예정 / 아카탄은 타베로그 온라인 예약',
        },
      ],
    },
    {
      day: 3,
      date: '2027-01-24',
      title: '오전 마무리 & 출국',
      theme: '우동 · 기념품 · 귀국',
      items: [
        {
          id: 'd3-brunch',
          time: '10:00',
          title: '아점 — 우동',
          status: 'confirmed',
          places: ['daichi-udon'],
          note: '다이치노우동 등',
        },
        {
          id: 'd3-souvenir',
          time: '11:00',
          title: '기념품 쇼핑',
          status: 'candidate',
          places: ['ming'],
        },
        {
          id: 'd3-checkout',
          time: '11:30',
          title: '숙소 짐 찾아 공항 출발',
          status: 'confirmed',
          places: ['hotel-apa'],
        },
        {
          id: 'd3-airport',
          time: '12:00',
          title: '공항 도착 (면세 환급 절차 대응)',
          status: 'confirmed',
          places: ['airport'],
          note: '2026-11-01 시행 공항 면세 환급 절차 때문에 여유 있게 도착',
        },
        {
          id: 'd3-depart',
          time: '14:40',
          title: '인천행 출발 (LJ456)',
          status: 'confirmed',
          places: [],
        },
      ],
    },
  ],

  todos: [
    { id: 't1', date: '2026-12-01', title: '히키니쿠 토 코메 우선 티켓 오픈 — 구매 여부 결정', url: 'https://www.tablecheck.com/shops/hikinikutocome-imaizumi/reserve' },
    { id: 't2', date: '2026-12-19', title: '니쿠이치 야쿠인점 예약 오픈', url: 'https://tablecheck.com/ko/nikuichi-yakuin/reserve' },
    { id: 't3', date: '2027-01-15T00:00', title: '히키니쿠 토 코메 무료 일반 예약 오픈 (자정)', url: 'https://www.tablecheck.com/shops/hikinikutocome-imaizumi/reserve' },
    { id: 't4', date: '2027-01-21', title: '마에다야 총본점/하카타점 중 미사용 1곳 전화 취소' },
  ],

  risks: [
    '야구라 카츠동(やぐら): 구글맵상 임시 휴업 표시 — 1월 중순 재개 여부 재확인',
    '숙소 최종 예약처 · 체크인/아웃 시간 미확정',
    '1일차 저녁 마에다야 총본점(17:00) vs 하카타점(19:30) 최종 1곳 확정',
    '히키니쿠 토 코메 예약 방식(우선 티켓 vs 일반 예약) 결정',
    '케고 타카미 스시 전화 예약 · 야키니쿠 아카탄 타베로그 예약',
  ],

  packing: [
    '여권 (유효기간 확인)',
    'Visit Japan Web QR 등록',
    'eSIM / 포켓와이파이',
    '엔화 현금 · 해외결제 카드',
    '돼지코(110V 어댑터)',
    '보조배터리 (기내 반입)',
    '상비약',
    '접이식 장바구니 / 여분 가방',
  ],

  tips: [
    { title: '숙박세', body: '1인 1박 200엔, 3인 2박 총 1,200엔 — 호텔 현장 납부' },
    { title: '면세', body: '세전 5,000엔 이상 구매 시 면세. 2026-11-01부터 공항에서 환급 확인 절차가 생겨 귀국일 12:00 공항 도착 목표' },
    { title: '공항 ↔ 하카타역', body: '지하철 공항선은 국내선역 출발이라 국제선에선 셔틀/버스 환승 필요. 짐 많으면 택시(약 15–20분)가 편함' },
    { title: '위탁수하물', body: '진에어 15kg 포함 — 면세 쇼핑 후 무게 체크' },
  ],

  links: [
    { title: 'Visit Japan Web (입국 수속)', url: 'https://www.vjw.digital.go.jp/' },
    { title: '진에어 예약 조회', url: 'https://www.jinair.com/' },
    { title: '후쿠오카 공항 국제선', url: 'https://www.fukuoka-airport.jp/ko/' },
    { title: '후쿠오카 모츠나베 맛집 BEST 3', url: 'https://www.tsunagujapan.com/ko/fukuoka-motsunabe-restaurant-bset-3/' },
    { title: '후쿠오카 쇼핑리스트 총정리', url: 'https://brunch.co.kr/@ssoxxl/526' },
    { title: '후쿠오카 날씨 (tenki.jp)', url: 'https://tenki.jp/forecast/9/43/8210/40130/' },
  ],
};
