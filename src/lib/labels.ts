import type { Area, Category, Status } from '../data/types';

export const STATUS_LABEL: Record<Status, string> = {
  confirmed: '확정',
  booked: '예약완료',
  pending: '조율중',
  walkin: '워크인',
  candidate: '후보',
  optional: '선택',
  excluded: '제외',
};

export const CATEGORY_LABEL: Record<Category, string> = {
  food: '식당',
  cafe: '카페',
  shopping: '쇼핑',
  sight: '관광',
  hotel: '숙소',
  transport: '교통',
  bar: '술집',
};

export const AREA_LABEL: Record<Area, string> = {
  hakata: '하카타',
  nakasu: '나카스',
  tenjin: '텐진',
  daimyo: '다이묘',
  yakuin: '야쿠인',
  airport: '공항',
};

export const DAY_COLOR = ['var(--day1)', 'var(--day2)', 'var(--day3)'];
export const DAY_HEX = ['#F2665A', '#2F6FDB', '#1F9D6B'];
