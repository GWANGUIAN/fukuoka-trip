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
백엔드: `worker/` Cloudflare Worker `fukuoka-trip-api` (D1 `fukuoka-trip` · R2 `fukuoka-trip-photos` · Workers AI) — https://fukuoka-trip-api.bbaa3218.workers.dev

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
    hours.ts       openStatus(place, at, 'live'|'plan') → 영업 중/곧 마감/브레이크/오픈 전/종료/휴무
    weather.ts     useWeather (Open-Meteo, 16일 이내만 예보 → 그 전엔 1월 평년값, 3시간 캐시), outfitTips, rainSummary
    api.ts         API_URL(VITE_API_URL)·apiFetch(Bearer)·useAuth·login (localStorage fk-auth)
    settle.ts      지출 타입·summarize(총비용·인당·분류별·최소 송금)·money
    wallet.ts      useWallet (fk-wallet-cache 캐시 + fk-outbox 오프라인 큐, online/화면 복귀 시 전송)
    photos.ts      사진 전역 스토어(usePhotos)·업로드 큐(동시 2장, 1600px webp + 원본)·촬영 시각 → 일정 자동 매칭
    image.ts       resizeImage(canvas)·exifTakenAt(JPEG EXIF)
  components/      StatusBadge · CategoryIcon · PlaceRow(펼침, 영업 배지) · PlaceDetail · PlaceActions(지도/길찾기/예약/블로그)
                   PlaceExtras(로그인 시 메뉴 번역·지출 추가·지도에선 장소 사진) · LegRow · FlightCard · YenCalculator
                   BottomNav · PullToRefresh · Weather(WeatherChip/DayWeatherLine) · Modal(바텀시트) · AuthGate/WhoAmI
                   Translate(TranslateButton/TranslateCard) · album/(Album, PhotoParts: Upload·Thumbs·Lightbox, ItemPhotos)
                   wallet/(Wallet, ExpenseForm)
  pages/           Home · Schedule · MapPage · Checklist · Together(?tab=album|wallet) · Info
  main.tsx         PWA 자동 업데이트 등록 + 앱(Capacitor)에서 target=_blank 링크 처리
  styles/global.css 디자인 토큰(라이트/다크) + 전체 스타일
worker/            Cloudflare Worker (별도 package, wrangler.toml)
  src/index.ts     라우터·CORS·에러 → http.ts(Env·json·usage 제한) auth.ts(초대코드 로그인·HMAC 토큰·이미지 서명 URL)
                   expenses.ts · photos.ts(R2 thumb/orig, /img 서명 URL, ?dl=1 다운로드) · translate.ts
  migrations/      D1 스키마 (photos · expenses · settings(rate) · usage)
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
- `Place.openHours`(`{days, ranges}[]`, 0=일…6=토, 자정 넘김 "25:30") + `closedDays` → 영업 배지. 규칙에 없는 요일은 '모름'(배지 숨김). `hours`는 표시용 문구라 둘 다 같이 고친다.
- 장소를 지우면 `trip.ts`의 places/alternatives/excluded 참조도 `grep`으로 정리. 지도 탭은 일정의 places·alternatives에 쓰인 장소만 보여주므로, 참조 없는 장소는 places.ts에서도 지운다.

## 화면별 기능
- **홈**: 히어로(D-day / 여행 중엔 DAY N / 끝!), 여행 중 "오늘 일정" 카드(남은 시간 비 소식), 일자별 카드(날씨 칩 최고/최저), 항공편, 숙소 카드(상태·details·notes·지도 버튼), 다가오는 할 일, `pending` 일정만 모은 "아직 조율 중"(없으면 숨김), 마지막 업데이트.
- **일정**: DAY 탭(`?day=N`, 여행 당일엔 오늘 자동 선택), 날씨·옷차림 줄, 타임라인, 직전 일정 마지막 장소 → 이번 첫 장소 이동, 장소 간 이동, 대안 접기, 워크인 후보, 현재 시각 하이라이트(1분 갱신), 영업 배지(당일 = 지금 기준 live, 그 외 = 일정 HH:MM 기준 plan), 로그인 시 일정별 사진 줄·업로드, 제외 목록.
- **함께**: 초대 코드 + 멤버 선택 로그인(AuthGate). 앨범(일자→일정별 그리드, 라이트박스 스와이프·원본·내 사진 삭제) / 지갑(표시 통화 ₩/¥, 3인 공통 환율 `settings.rate`, 총비용·인당, 송금 목록 100원 반올림, 분류별, 일자별 목록). 사전 정산분(`settled=1`, category `prepaid` — 항공·호텔)은 총비용에만 포함, 수정·삭제 불가. 장소 상세 "지출 추가" → `/together?tab=wallet&add=<placeId>&day=N`.
- **지도**: 날짜 필터, 일자 색 번호 핀(AdvancedMarker)·폴리라인, fitBounds, 권역별 목록, 바텀시트. API 키 없으면 목록+외부 링크로 fallback.
- **체크**: 푸시 알림 켜기 카드(PushCard: 켜기·테스트·끄기, 아이폰 비설치·APK·차단 안내), 예약 오픈 D-day + 🔔 남은 알림 시각, risks, packing 체크(localStorage).
- **정보**: 메뉴판·간판 번역(사진 → 1280px jpeg → Worker: Llama 4 Scout로 글자 읽기 → gpt-oss-120b(reasoning low)로 한국어 이름·설명, 20–40초, 번역 형식 깨지면 1회 재시도 후 원문+"다시 번역", 1인 하루 40회, 최근 5개 기기 저장), 엔→원 계산기(기본 9.3원/엔, 저장됨, 세전 ¥5,000 면세 체크 = 가격/1.1), tips, links, 앱 설치 안내.

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

## 백엔드 (worker/)
- 배포: `cd worker && npx wrangler deploy` (CLI 로그인됨). 스키마 변경은 `migrations/000N_*.sql` 추가 후 `npm run migrate`(원격) / `npx wrangler d1 migrations apply fukuoka-trip --local`.
- 비밀값: `INVITE_CODE`·`TOKEN_SECRET`은 `wrangler secret`으로만 저장, 로컬은 gitignore된 `worker/.dev.vars`. 레포(공개)에 커밋 금지.
- 사진·지출 금액은 D1/R2에만 있고 레포에는 없다. 사전 정산분 seed도 `wrangler d1 execute --remote`로 넣었다(레포에 SQL 없음).
- CORS: `ALLOWED_ORIGINS`(wrangler.toml vars)에 있는 origin만 반사. OPTIONS는 인증 전 204, 모든 에러 응답에도 CORS 헤더. 쿠키 없이 Bearer 토큰. `<img>`는 서명 URL(`/img/:id/:variant?exp&sig`, 하루 단위 만료로 URL 고정 → 캐시).
- 프론트 API 주소: GitHub repo variable `VITE_API_URL` → deploy.yml. 로컬은 `.env.local`. 로컬 Worker로 테스트하려면 `.env.development.local`에 `VITE_API_URL=http://localhost:8787` + launch.json `api`(wrangler dev, D1·R2 로컬, AI는 원격).
- Workers AI 응답 형식은 모델마다 다름: Llama류는 `{response}`, gpt-oss·Qwen·Gemma 등은 OpenAI식 `choices[0].message.content` → translate.ts `outputOf`로 둘 다 처리. (Gemma 4·Qwen 3.8은 번역에 50초 넘게 걸리고 결과도 비어서 제외)
- 개발 서버(5173)에서 옛 화면이 보이면 같은 포트의 `web-prod`가 등록한 서비스워커 때문일 수 있음 → SW 해제 후 새로고침.
- Workers AI 무료 플랜: Gemma 3·DeepSeek 등 일부 모델은 막혀 있고 Qwen3-30B는 지원 종료. 모델 바꿀 땐 `npx wrangler ai models`로 확인.
  하루 10,000 뉴런 무료(넘으면 과금 없이 요청 실패). 번역 1회 ≈ 200–300 뉴런 → 3인 합계 하루 40–50회 정도. 출력 토큰 단가가 커서 모델 고를 땐 출력 단가를 본다(gpt-oss-120b 68k/M < Llama 3.3 70B 205k/M 뉴런).
- **푸시 알림**(예약 오픈·할 일만): 빌드 때 vite 플러그인이 `trip.todos` → `dist/notify.json`. Worker cron(`*/5 * * * *`) → `runCron`(notify.ts)이 그 json을 읽고 `dueNotices`(worker/src/notifyRules.ts — 프론트 체크 탭 🔔 표시도 같은 파일을 import)로 계산 → `push_subs` 전체에 Web Push(webpush.ts: RFC 8291 aes128gcm + VAPID, 의존성 없음) → `push_sent`에 키 기록(중복 방지, 날짜 바뀌면 새 키).
  - 규칙: 시각 있음 = 전날 21:00 + 10분 전 / 날짜만 = 전날 21:00 + 당일 09:00 (KST), 1시간 넘게 늦은 알림은 버림.
  - 서비스워커: `public/push-sw.js`(push·notificationclick)를 workbox `importScripts`로 포함. 개발 서버(`npm run dev`)에선 SW가 없으니 `web-prod`(빌드 후 vite preview) 설정으로 확인.
  - 키: `VAPID_PUBLIC`(wrangler.toml vars) · `VAPID_PRIVATE_JWK`(secret, 로컬은 `.dev.vars`). 키를 바꾸면 기존 구독이 전부 무효.
  - 지원: 안드로이드 크롬/크롬 PWA, 아이폰은 홈 화면에 추가한 PWA(iOS 16.4+)만. **APK(Capacitor) 앱은 웹 푸시 불가** → 체크 탭에서 크롬으로 안내.
  - 암호화 검증: `node worker/scripts/test-webpush.mjs` (RFC 8291 부록 A 벡터).
- 제한: 번역 1인 하루 40회, 사진 1인 하루 300장(원본 ≤25MB), 테스트 알림 하루 10회, 로그인 실패 IP당 분당 5회 (`usage` 테이블).

## 주의할 점 (과거에 겪은 문제)
- `useEffect(() => window.scrollTo(0,0))`처럼 값을 반환하는 화살표 함수는 "destroy is not a function" 에러 → 블록 본문으로.
- `google` 전역은 `@types/google.maps`(tsconfig types) + 런타임에 `typeof google === 'undefined'` 체크.
- 브라우저 패널 스크린샷이 잘려 보여도 레이아웃 문제가 아닐 수 있음 → DOM 측정으로 확인. (모달·라이트박스가 반투명하게 찍혀도 애니메이션/캡처 문제일 수 있음)
- 시간 의존 화면은 `?now=2027-01-23T19:30`(해시 앞)으로 확인 — `currentTime()`을 쓰는 곳(tripPhase·하이라이트·영업 배지·날씨)에 적용.
- Windows git bash의 curl로 한글 JSON을 보내면 인코딩이 깨짐 → API 테스트는 node 스크립트나 브라우저 fetch로.
