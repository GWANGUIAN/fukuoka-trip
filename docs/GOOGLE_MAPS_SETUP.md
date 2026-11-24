# Google Maps API 설정 가이드

앱의 **지도 탭**은 Google Maps JavaScript API로 그립니다. 키가 없어도 앱은 동작하고(장소 목록 + 구글맵 링크로 대체), 아래 순서대로 키를 등록하면 지도가 나타납니다.

- 배포 주소: `https://gwanguian.github.io/fukuoka-trip/`
- 사용하는 API: **Maps JavaScript API** 1개 (장소 검색·길찾기는 구글맵 앱/웹 링크로 처리하므로 Places/Directions API 불필요)
- 키 이름(환경변수): `VITE_GOOGLE_MAPS_API_KEY`, (선택) `VITE_GOOGLE_MAPS_MAP_ID`

---

## 1. Google Cloud 프로젝트 만들기

1. https://console.cloud.google.com/ 접속 → 구글 계정 로그인
2. 상단 프로젝트 선택 드롭다운 → **새 프로젝트**
   - 프로젝트 이름: `fukuoka-trip` (자유)
   - 만들기 → 생성된 프로젝트가 선택되어 있는지 확인

## 2. 결제 계정 연결 (필수)

Maps API는 결제 계정이 연결되어 있어야 동작합니다. (안 하면 지도에 "개발자 전용" 워터마크 + 회색 화면)

1. 왼쪽 메뉴 ☰ → **결제(Billing)** → **결제 계정 연결**
2. 카드 등록 (해외결제 가능한 카드)
3. 요금 참고: Maps JavaScript API의 *Dynamic Maps*는 매월 일정량 무료 사용량이 제공되고, 이 앱(3명이 여행 중 몇 백 번 열람) 수준이면 **사실상 무료 범위**입니다. 최신 무료 한도는 [가격 페이지](https://mapsplatform.google.com/pricing/)에서 확인하세요.

## 3. Maps JavaScript API 사용 설정

1. ☰ → **API 및 서비스 → 라이브러리**
2. `Maps JavaScript API` 검색 → **사용(Enable)**

## 4. API 키 만들기 + 제한 걸기 (중요)

웹 앱 특성상 **키가 브라우저에 그대로 노출**됩니다. 그래서 "이 주소에서만 쓸 수 있게" 제한을 거는 것이 유일한 보안 장치입니다. 반드시 설정하세요.

1. ☰ → **API 및 서비스 → 사용자 인증 정보(Credentials)**
2. **+ 사용자 인증 정보 만들기 → API 키** → 생성된 키 복사
3. 생성된 키 이름 클릭 → 편집 화면에서:

**애플리케이션 제한사항**
- `웹사이트(HTTP 리퍼러)` 선택
- 웹사이트 제한사항에 아래 2줄 추가
  ```
  https://gwanguian.github.io/fukuoka-trip/*
  http://localhost:5173/*
  ```

**API 제한사항**
- `키 제한` 선택 → **Maps JavaScript API** 만 체크

4. **저장** (반영까지 최대 5분)

> 📱 안드로이드 앱은 WebView가 `https://gwanguian.github.io/fukuoka-trip/` 페이지를 그대로 띄우는 방식이라, **같은 키·같은 리퍼러 제한으로 동작**합니다. Android 앱 제한(SHA-1)은 설정하지 마세요.

## 5. (권장) 과금 사고 방지

1. ☰ → **API 및 서비스 → Maps JavaScript API → 할당량(Quotas)**
   - `Map loads per day` 를 예: **1,000** 으로 낮추기
2. ☰ → **결제 → 예산 및 알림** → 예산 만들기
   - 금액: 예 $5 / 알림 50%·90%·100% → 이메일 알림

## 6. (선택) Map ID 만들기 — 지도 스타일

앱은 번호 핀(Advanced Marker)을 사용합니다. Map ID가 없으면 구글의 테스트용 `DEMO_MAP_ID`로 동작하는데, 정식으로 쓰려면 Map ID를 만드는 것을 권장합니다.

1. ☰ → **Google Maps Platform → 지도 관리(Map Management)** → **지도 ID 만들기**
   - 이름: `fukuoka-trip` / 지도 유형: **JavaScript** / **벡터(Vector)** 선택
2. 생성된 Map ID 복사 (`VITE_GOOGLE_MAPS_MAP_ID` 로 사용)
3. (선택) **지도 스타일(Map Styles)** 에서 밝고 단순한 스타일을 만들어 이 Map ID에 연결

---

## 7. 로컬 개발에 키 넣기

프로젝트 루트에 `.env.local` 파일을 만듭니다. (`.gitignore` 처리되어 커밋되지 않음)

```bash
cp .env.example .env.local
```

```
VITE_GOOGLE_MAPS_API_KEY=AIza...복사한키
VITE_GOOGLE_MAPS_MAP_ID=선택사항
```

```bash
npm run dev
```
→ http://localhost:5173/fukuoka-trip/#/map 에서 지도 확인

## 8. GitHub Pages 배포에 키 넣기

배포는 GitHub Actions가 빌드하면서 **레포 Secret**의 값을 주입합니다.

```bash
gh secret set VITE_GOOGLE_MAPS_API_KEY --repo GWANGUIAN/fukuoka-trip
```
(프롬프트에 키 붙여넣기 → Enter)

```bash
gh secret set VITE_GOOGLE_MAPS_MAP_ID --repo GWANGUIAN/fukuoka-trip
```

웹에서 하려면: 레포 → **Settings → Secrets and variables → Actions → New repository secret**

등록 후 다시 배포:
```bash
gh workflow run deploy.yml --repo GWANGUIAN/fukuoka-trip
```

> Secret이라도 빌드 결과(JS)에는 키가 들어갑니다. 이건 정상이며, 4번의 **리퍼러 제한**이 보호 장치입니다.

---

## 9. 문제 해결

| 증상 (브라우저 콘솔) | 원인 / 해결 |
|---|---|
| `RefererNotAllowedMapError` | 4번 리퍼러 목록에 현재 주소가 없음. 끝에 `/*` 포함했는지, `https`/`http` 맞는지 확인 |
| `ApiNotActivatedMapError` | 3번 Maps JavaScript API 사용 설정 안 됨 |
| `InvalidKeyMapError` | 키 오타, 또는 Secret 등록 후 재배포 안 함 |
| `BillingNotEnabledMapError` / "개발자 전용" 워터마크 | 2번 결제 계정 미연결 |
| `ApiTargetBlockedMapError` | 4번 API 제한에 Maps JavaScript API가 체크 안 됨 |
| 지도는 뜨는데 핀이 안 보임 | Map ID 문제 → `VITE_GOOGLE_MAPS_MAP_ID` 비우면 DEMO_MAP_ID로 동작 |
| 지도 탭에 "키가 설정되지 않았어요" | 빌드 시 키가 비어 있었음 → Secret 이름 철자 확인 후 재배포 |
| 키 바꿨는데 반영 안 됨 | 최대 5분 대기 / PWA 캐시 → 앱 완전히 닫았다가 다시 열기 |
