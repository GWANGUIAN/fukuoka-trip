# 지연이와 아이들의 후쿠오카 여행 🍜

수빈 · 지연 · 광의의 **2027.1.22(금) – 1.24(일) 후쿠오카 2박 3일** 여행 일정 앱.

- 🌐 웹: https://gwanguian.github.io/fukuoka-trip/
- 📱 안드로이드: [Releases](https://github.com/GWANGUIAN/fukuoka-trip/releases/latest)에서 `fukuoka-trip.apk` 설치

웹과 앱이 **같은 페이지**를 보여줍니다. 일정 데이터를 고쳐 push 하면 1–2분 뒤 웹·앱 모두 자동 반영됩니다 (앱 재설치 필요 없음).

## 기능

| 탭 | 내용 |
|---|---|
| 홈 | D-day, 일자별 요약, 항공편·숙소, 다가오는 예약 오픈일, 아직 조율 중인 일정 |
| 일정 | DAY 1·2·3 타임라인, 상태 배지(확정/예약완료/조율중/후보/선택/제외), 장소별 영업시간·메모·블로그 후기·예약·지도·길찾기, 대안 접기, 여행 당일 현재 일정 하이라이트 |
| 지도 | 일자별 색상·순서 번호 핀, 동선 점선, 권역(하카타/나카스/텐진…)별 목록, 구글맵 전체 동선 열기 |
| 체크 | 예약 오픈 D-day, 리스크 확인, 준비물 체크 (기기별 저장) |
| 정보 | 숙박세·면세·공항 이동 팁, 유용한 링크 |

오프라인 지원(PWA): 한 번 열어두면 현지에서 데이터가 끊겨도 일정을 볼 수 있습니다.

## ✏️ 일정 수정하는 법

**`src/data/` 폴더의 두 파일만 고치면 됩니다.**

| 파일 | 내용 |
|---|---|
| [`src/data/trip.ts`](src/data/trip.ts) | 항공편, 숙소, **일자별 일정**, 할 일(예약 오픈일), 리스크, 준비물, 팁, 링크 |
| [`src/data/places.ts`](src/data/places.ts) | 장소 정보 (이름, 영업시간, 좌표, 구글맵/예약 링크, **블로그 후기 링크**, 메모) |

### 일정 항목 예시 (`trip.ts`)
```ts
{
  id: 'd2-dinner',            // 고유 id (아무거나, 중복만 안 되게)
  time: '18:00',              // "HH:MM" 이면 여행 당일 현재 일정 하이라이트에 사용
  title: '저녁 — 1차 스시 → 2차 야키니쿠',
  status: 'confirmed',        // confirmed | booked | pending | candidate | optional | excluded
  places: ['kego-takami', 'akatan'],   // places.ts 의 id (순서 = 동선)
  alternatives: ['nikuichi'],          // (선택) 대안 장소
  note: '메모',                         // (선택)
},
```

### 장소 예시 (`places.ts`)
```ts
{
  id: 'akatan',
  name: '야키니쿠 아카탄',
  nameJa: '焼肉 あかたん',     // (선택) 구글맵 검색 정확도↑
  category: 'food',           // food | cafe | shopping | sight | hotel | transport | bar
  area: 'tenjin',             // hakata | nakasu | tenjin | daimyo | yakuin | airport
  lat: 33.5853, lng: 130.4032, // 지도 핀 위치 (구글맵에서 장소 우클릭 → 좌표 복사)
  hours: '17:00–23:00',
  mapUrl: 'https://maps.google.com/?cid=...',  // (선택) 없으면 이름으로 자동 검색
  reserveUrl: 'https://...',                   // (선택) 예약 버튼
  blogs: [{ title: '후기', url: 'https://...' }], // (선택) 블로그 링크
  memo: '메모',
},
```

수정 후 `trip.ts`의 `updatedAt`도 바꾸고 push:
```bash
git add src/data && git commit -m "일정 업데이트" && git push
```

> Claude에게 "토요일 저녁 아카탄 19시로 바꿔줘"처럼 요청해도 이 두 파일을 수정합니다.

## 개발

```bash
npm install
cp .env.example .env.local   # 지도 키 입력 (docs/GOOGLE_MAPS_SETUP.md)
npm run dev                  # http://localhost:5173/fukuoka-trip/
npm run build
```

- Vite + React 18 + TypeScript, React Router(Hash), vite-plugin-pwa
- 지도: `@vis.gl/react-google-maps` — 설정은 [docs/GOOGLE_MAPS_SETUP.md](docs/GOOGLE_MAPS_SETUP.md)
- 아이콘·OG 이미지: [docs/IMAGE_PROMPTS.md](docs/IMAGE_PROMPTS.md)

## 배포

- **웹**: `main`에 push → GitHub Actions `Deploy to GitHub Pages` 자동 실행
- **안드로이드 APK**: Actions → `Android APK` → *Run workflow* → Releases에 `fukuoka-trip.apk` 업로드
  - 앱은 웹 페이지를 띄우는 구조(Capacitor, `capacitor.config.ts`의 `server.url`)라서 **아이콘/앱 이름을 바꿀 때만** 다시 빌드하면 됩니다.
  - 디버그 서명 APK라 새 버전을 설치할 때 "앱이 설치되지 않음"이 뜨면 기존 앱을 삭제 후 설치하세요.

```bash
gh workflow run android.yml
```

### 폰에 설치
1. Releases 페이지에서 `fukuoka-trip.apk` 다운로드
2. "출처를 알 수 없는 앱 설치" 허용 → 설치
3. 또는 APK 없이: 크롬에서 웹 주소 열기 → 메뉴 → **홈 화면에 추가** / **앱 설치**
