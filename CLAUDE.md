# CLAUDE.md — 지연이와 아이들의 후쿠오카 여행

조수빈·이지연·안광의 3인의 **2027-01-22(금) ~ 01-24(일) 후쿠오카 2박 3일** 일정 앱.
웹(GitHub Pages)과 안드로이드 앱(Capacitor WebView)이 **같은 배포 페이지**를 보여준다.

- 웹: https://gwanguian.github.io/fukuoka-trip/ · 레포: https://github.com/GWANGUIAN/fukuoka-trip (**public**)
- 사용자 대상 설명은 [README.md](README.md), 지도 키 설정은 [docs/GOOGLE_MAPS_SETUP.md](docs/GOOGLE_MAPS_SETUP.md), 아이콘·OG 이미지는 [docs/IMAGE_PROMPTS.md](docs/IMAGE_PROMPTS.md)

## 작업 규칙
- **일정 데이터 업데이트**(md 파일·예약 캡처·메시지 반영)는 `update-trip` 스킬([.claude/skills/update-trip/SKILL.md](.claude/skills/update-trip/SKILL.md))을 따른다. 커밋·push 후 배포 대기/확인은 하지 않는다.
- 사용자와 대화·문서·UI 문구는 한국어. 커밋 메시지도 한국어 요약.
- **개인정보**: 레포·사이트가 공개라 예약번호·결제 금액·개인 연락처·이메일은 사용자가 명시적으로 원할 때만 넣는다 (가게 대표 전화 같은 공개 정보는 OK).
- 디자인 톤: 깔끔·심플. 새 UI는 기존 컴포넌트와 `src/styles/global.css` 토큰(라이트/다크 둘 다 정의)을 재사용. 필요 없는 기능은 추가하지 않는다.
- 검증: `npm run build`(= `tsc --noEmit && vite build`) 통과 + 화면 변경이면 프리뷰(`.claude/launch.json`의 `web`, 주소 `http://localhost:5173/fukuoka-trip/#/...`)로 확인.

## 스택
Vite 6 · React 18 · TypeScript · React Router 6 (**HashRouter**, `base: '/fukuoka-trip/'`) · lucide-react 아이콘 · Pretendard(CDN) ·
vite-plugin-pwa(autoUpdate) · `@vis.gl/react-google-maps` · Capacitor 7 (appId `io.github.gwanguian.fukuokatrip`).

## 구조
```
src/
  data/            ★ 일정은 여기만 고친다
    types.ts       Status·Category·Area·Place·ScheduleItem·Day·Trip 타입
    trip.ts        항공·숙소(details/notes)·days(items)·todos·risks·packing·tips·links·updatedAt
    places.ts      모든 장소 + placeMap (id → Place)
  lib/
    date.ts        parseDate·daysUntil·ddayLabel·formatDate·weekday·tripPhase(before/during/after)·timeToMinutes
    maps.ts        구글맵 URL 생성(placeUrl·directionsUrl·legUrl·routeUrl), MAPS_KEY·MAP_ID(env)
    geo.ts         distanceM(하버사인), estimateLeg(직선×1.3, 도보 75m/분, 2.5km 초과 → '지하철·택시 권장')
    labels.ts      STATUS/CATEGORY/AREA 라벨, DAY_COLOR(css var)·DAY_HEX(지도용)
    storage.ts     useLocalStorage (체크 상태·환율 등 기기별 저장)
  components/      StatusBadge · CategoryIcon · PlaceRow(펼침) · PlaceDetail · PlaceActions(지도/길찾기/예약/블로그)
                   LegRow(이동 시간, 탭하면 길찾기) · FlightCard · YenCalculator · BottomNav · PullToRefresh
  pages/           Home · Schedule · MapPage · Checklist · Info
  main.tsx         PWA 자동 업데이트 등록 + 앱(Capacitor)에서 target=_blank 링크 처리
  styles/global.css 디자인 토큰(라이트/다크) + 전체 스타일
scripts/           make-web-icons.mjs(npm run icons:web) · make-og.mjs(npm run og, Jua 폰트 경로 변환) · make-placeholders.mjs
assets/            Capacitor 아이콘·스플래시 소스, fonts/Jua
android/           Capacitor 생성 프로젝트(커밋됨)
```

## 데이터 모델 핵심
- `Status`: `confirmed` 확정 · `booked` 예약완료 · `pending` 조율중 · `walkin` 워크인 · `candidate` 후보 · `optional` 선택 · `excluded` 제외.
  새 상태를 추가하면 `types.ts` + `labels.ts`(STATUS_LABEL) + `global.css`(`.badge.<status>`, 라이트/다크 `--st-<status>` 토큰) 세 곳을 같이 고친다.
- `ScheduleItem.places`: 순서 = 동선(장소 사이 LegRow 표시, 3곳 이상이면 "전체 동선" 버튼). `alternatives`: 접히는 "대안·후보" 목록.
  `status: 'walkin'`이면 places+alternatives를 **번호 매긴 워크인 후보 목록**으로 펼쳐 보여주고, 각 후보에서 **다음 일정 첫 장소까지** 이동 시간을 표시.
- `time`이 `HH:MM`이면 여행 당일 현재 일정 하이라이트·정렬에 쓰인다("오후"·"밤" 같은 자유 문구도 허용).
- `Day.excluded`: 제외된 장소 id → 일정 탭 하단 "제외됨"(취소선 배지).
- `Place`: `address`(일본어 주소)가 있으면 길찾기 검색에 최우선 → 없으면 `nameJa + 福岡` → `name + 후쿠오카`. `mapUrl`(cid 링크)은 "지도" 버튼에만 쓰임. `lat/lng`는 지도 핀·도보 시간 추정용 대략값.
- `trip.todos[].date`: `YYYY-MM-DD` 또는 `YYYY-MM-DDTHH:mm` → 홈 "다가오는 예약 오픈·할 일"(오늘 이후 3개)·체크 탭 D-day.
- `trip.hotel.details`(label/value) → 홈 숙소 카드 kv-grid. `notes` → 목록.
- 장소를 지우면 `trip.ts`의 places/alternatives/excluded 참조도 `grep`으로 정리. 지도 탭은 일정의 places·alternatives에 쓰인 장소만 보여주므로, 참조 없는 장소는 places.ts에서도 지운다.

## 화면별 기능
- **홈**: 히어로(D-day / 여행 중엔 DAY N / 끝!), 여행 중 "오늘 일정" 카드, 일자별 카드, 항공편, 숙소 카드(상태·details·notes·지도 버튼), 다가오는 할 일, `pending` 일정만 모은 "아직 조율 중"(없으면 숨김), 마지막 업데이트.
- **일정**: DAY 탭(`?day=N`, 여행 당일엔 오늘 자동 선택), 타임라인, 직전 일정 마지막 장소 → 이번 첫 장소 이동, 장소 간 이동, 대안 접기, 워크인 후보, 현재 시각 하이라이트(1분 갱신), 제외 목록.
- **지도**: 날짜 필터, 일자 색 번호 핀(AdvancedMarker)·폴리라인, fitBounds, 권역별 목록, 바텀시트. API 키 없으면 목록+외부 링크로 fallback.
- **체크**: 예약 오픈 D-day, risks, packing 체크(localStorage).
- **정보**: 엔→원 계산기(기본 9.3원/엔, 저장됨, 세전 ¥5,000 면세 체크 = 가격/1.1), tips, links, 앱 설치 안내.

## 플랫폼 동작
- **PWA 자동 업데이트**: `registerSW` — 새 버전 감지 시 즉시 적용·새로고침, 화면 복귀 시와 30분마다 확인. 배포 후 옛 캐시가 보이는 문제를 막기 위한 것이라 제거하지 말 것.
- **앱 감지**: `window.Capacitor?.isNativePlatform?.()` (원격 URL을 로드해도 Capacitor 브리지가 주입됨).
  - 앱에서는 `target=_blank` 링크를 `location.href`로 열어 구글맵 앱/브라우저로 넘김 (`main.tsx`).
  - **당겨서 새로고침**(`PullToRefresh.tsx`): 앱에서만, 최상단에서 아래로 당기면 아이콘 표시 → 72px 이상이면 놓을 때 새로고침. `.gm-style`(지도)·`[data-no-ptr]` 안에서 시작한 터치는 무시. 웹에서 테스트하려면 `/fukuoka-trip/?ptr#/`.
- 안드로이드 앱은 `capacitor.config.ts`의 `server.url`(Pages 주소)을 띄우므로 **웹 배포 = 앱 반영**. APK 재빌드는 아이콘·앱 이름·네이티브 설정 변경 때만(`gh workflow run android.yml` → Releases `fukuoka-trip.apk`).
- 아이폰은 Safari "홈 화면에 추가"(PWA)로 사용.

## 배포·환경
- `main` push → `.github/workflows/deploy.yml`이 빌드 후 Pages 배포. 지도 키는 repo secrets `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_MAP_ID`(로컬은 `.env.local`, 예시 `.env.example`).
- `android.yml`: 수동 실행, JDK 21, `assembleDebug`, 릴리스 태그 `apk-v1.0.<run_number>`.
- 로컬 환경(Windows): Java/Android SDK 없음 → APK는 Actions로만. `@vitejs/plugin-react`는 vite 6 호환 때문에 v4 고정.
- OG 이미지: `npm run og` → `public/og-image.png` (제목만, Jua 폰트, `assets/og-bg.png` 있으면 배경으로 사용). 카카오톡은 OG를 캐시하므로 바꾼 뒤엔 카카오 디버거에서 초기화.

## 주의할 점 (과거에 겪은 문제)
- `useEffect(() => window.scrollTo(0,0))`처럼 값을 반환하는 화살표 함수는 "destroy is not a function" 에러 → 블록 본문으로.
- `google` 전역은 `@types/google.maps`(tsconfig types) + 런타임에 `typeof google === 'undefined'` 체크.
- 브라우저 패널 스크린샷이 잘려 보여도 레이아웃 문제가 아닐 수 있음 → DOM 측정으로 확인.
