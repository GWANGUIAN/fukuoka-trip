# 이미지 생성 프롬프트 가이드

「지연이와 아이들의 후쿠오카 여행」 앱 아이콘 · 파비콘 · OG 이미지를 AI로 생성하기 위한 문서입니다.
지금 레포에는 **임시 플레이스홀더 이미지**가 들어 있으니, 아래 표대로 생성한 뒤 **같은 파일명·같은 위치에 덮어쓰기**만 하면 됩니다.

---

## 0. 공통 스타일 가이드

| 항목 | 값 |
|---|---|
| 톤 | 깔끔 · 심플 · 따뜻함. 미니멀 플랫 일러스트, 그림자/질감 최소화 |
| 메인 컬러 | 코랄 `#F2665A` |
| 서브 컬러 | 딥 네이비 `#1F3A5F` |
| 배경 컬러 | 웜 아이보리 `#FAF7F2` / 샌드 `#F3E9DC` |
| 모티프 | 후쿠오카 타워 실루엣, 하카타 바다 물결, 라멘 그릇(김이 모락), 작은 비행기, 세 개의 동그란 점(=세 사람) |
| 금지 | 사진풍, 복잡한 배경, 작은 글씨, 실제 브랜드 로고, 그라데이션 과다 |

**공통 프롬프트 꼬리말 (모든 프롬프트 끝에 붙이기)**
```
minimal flat vector illustration, clean geometric shapes, soft rounded corners,
limited palette of coral #F2665A, deep navy #1F3A5F and warm ivory #FAF7F2,
no text, no letters, no watermark, centered composition, high contrast, crisp edges
```

> 💡 AI 도구별 팁
> - Midjourney: 끝에 `--ar 1:1 --style raw --v 6` (OG는 `--ar 1200:630` → 생성 후 1200×630으로 크롭)
> - DALL·E / ChatGPT / Gemini: 크기를 문장으로 명시 ("square 1024x1024 image")
> - 글자(한글)는 AI가 자주 깨뜨리므로 **이미지에는 글자를 넣지 말고**, OG 이미지 제목은 후처리(Figma/Canva/미리캔버스)로 얹는 것을 권장합니다.

---

## 1. 마스터 이미지 (먼저 이 2장만 만들면 나머지는 리사이즈로 해결 가능)

### 1-1. 앱 아이콘 마스터
| 항목 | 내용 |
|---|---|
| 파일명 | `icon-only.png` |
| 위치 | `assets/icon-only.png` |
| 크기/형식 | 1024×1024 PNG, 배경 꽉 채움(투명 X), 모서리 둥글리기 X (OS가 알아서 마스킹) |
| 용도 | Android 런처 아이콘, 파비콘·PWA 아이콘의 원본 |

**프롬프트 (EN)**
```
App icon design, square 1024x1024. A cute minimal illustration of a steaming
ramen bowl whose broth surface reflects a tiny Fukuoka Tower silhouette and gentle
sea waves, three small round dots floating above like steam (representing three
friends). Solid warm ivory #FAF7F2 background filling the whole canvas, main
object in coral #F2665A with deep navy #1F3A5F accents, object occupies the
central 60% of the canvas, generous padding.
+ 공통 꼬리말
```
**설명 (KO)**: 김이 나는 라멘 그릇 안에 후쿠오카 타워·바다 물결이 비치고, 김 대신 동그라미 3개(세 사람)가 떠오르는 귀여운 아이콘.

**대안 프롬프트 (더 단순한 버전)**
```
App icon, square. A single bold coral #F2665A circle on a warm ivory background,
inside it a white minimal silhouette of Fukuoka Tower with a small airplane
flying past, three tiny navy dots at the bottom. Ultra simple, reads well at 48px.
+ 공통 꼬리말
```

### 1-2. 안드로이드 Adaptive 아이콘 — 전경
| 항목 | 내용 |
|---|---|
| 파일명 | `icon-foreground.png` |
| 위치 | `assets/icon-foreground.png` |
| 크기/형식 | 1024×1024 PNG, **투명 배경** |
| 주의 | 그림은 **가운데 66% (약 680px 원) 안에만** 배치. 바깥은 기기별로 잘림 |

**프롬프트 (EN)**
```
Same ramen bowl / Fukuoka Tower icon illustration as the main icon, isolated on a
fully transparent background, object scaled to fit inside the central 60% of the
canvas, nothing near the edges.
+ 공통 꼬리말
```
> 투명 배경이 잘 안 나오면 1-1 이미지를 remove.bg 등으로 배경 제거 후 캔버스 1024에 60% 크기로 다시 배치하세요.

### 1-3. 안드로이드 Adaptive 아이콘 — 배경
| 항목 | 내용 |
|---|---|
| 파일명 | `icon-background.png` |
| 위치 | `assets/icon-background.png` |
| 크기/형식 | 1024×1024 PNG |

**프롬프트 (EN)** — 사실 AI 없이 단색 `#FAF7F2`로 채워도 충분합니다.
```
Plain warm ivory #FAF7F2 square background with an extremely subtle sand #F3E9DC
wave pattern at the bottom 20%, no objects. 1024x1024.
```

---

## 2. 스플래시 (앱 실행 시 첫 화면)

| 파일명 | 위치 | 크기 | 설명 |
|---|---|---|---|
| `splash.png` | `assets/splash.png` | 2732×2732 PNG | 라이트 모드 |
| `splash-dark.png` | `assets/splash-dark.png` | 2732×2732 PNG | 다크 모드 |

**프롬프트 (splash, EN)**
```
Square 2732x2732 splash screen. Solid warm ivory #FAF7F2 background, the app icon
illustration (ramen bowl with Fukuoka Tower reflection and three dots) small in
the exact center, occupying only 25% of the width, lots of empty space around it.
+ 공통 꼬리말
```
**프롬프트 (splash-dark, EN)**
```
Same as above but background is deep navy #14233A, illustration uses coral
#F2665A and ivory #FAF7F2.
+ 공통 꼬리말
```
> 아이콘 이미지를 그대로 가운데에 작게 놓아 직접 만들어도 됩니다 (Figma 2732 캔버스).

---

## 3. 웹 파비콘 · PWA 아이콘 (마스터 `icon-only.png` 리사이즈)

AI로 다시 만들 필요 없이 `assets/icon-only.png`를 리사이즈하면 됩니다.
(아래 "5. 생성 후 적용 방법"의 스크립트가 자동으로 해 줍니다.)

| 파일명 | 위치 | 크기 | 용도 |
|---|---|---|---|
| `favicon.ico` | `public/favicon.ico` | 16·32·48 멀티 사이즈 ICO | 브라우저 탭 |
| `favicon-32.png` | `public/favicon-32.png` | 32×32 | 브라우저 탭(PNG) |
| `apple-touch-icon.png` | `public/apple-touch-icon.png` | 180×180, 배경 채움 | iOS 홈 화면 |
| `pwa-192.png` | `public/pwa-192.png` | 192×192 | PWA manifest |
| `pwa-512.png` | `public/pwa-512.png` | 512×512 | PWA manifest |
| `maskable-512.png` | `public/maskable-512.png` | 512×512, 그림은 가운데 80% 안 | Android PWA 마스커블 |

> 파비콘은 16px에서도 알아봐야 하므로, 너무 복잡하면 **1-1 대안 프롬프트(단순 버전)**를 파비콘용으로 따로 쓰는 것도 좋습니다.

---

## 4. OG 이미지 (카톡·SNS 링크 미리보기)

| 항목 | 내용 |
|---|---|
| AI 원본 파일 | `assets/og-image.png` (글자 없는 배경, 가로형 약 1.91:1, 크기 무관) |
| 최종 파일 | `public/og-image.png` 1200×630 — **`npm run og`가 원본을 리사이즈하고 한글 제목을 자동 합성** |
| 용도 | 카카오톡/인스타/디스코드 등에 링크 공유 시 썸네일 |

> ✅ 현재 `assets/og-image.png`에 생성된 배경이 들어 있고 `public/og-image.png`는 그걸로 합성된 상태입니다. 배경을 바꾸면 `npm run og`만 다시 실행하세요. 제목 문구는 `scripts/make-og.mjs`에서 수정합니다.

### OG 컬러 (앱 홈 상단 카드와 동일 톤)

| 이름 | HEX | 쓰임 |
|---|---|---|
| 미드나잇 네이비 | `#232F4B` → `#2B3F63` | 배경 (왼쪽 위 → 오른쪽 아래 은은한 그라데이션) |
| 코랄 | `#EC7A6E` | 오른쪽 아래 큰 원 (포인트) |
| 소프트 슬레이트 | `#414D6A` | 오른쪽 위 작은 반투명 원 |
| 크림 화이트 | `#FFF8F1` | 제목 글씨 |

> 레이아웃은 홈 카드와 같은 구도입니다: 네이비 바탕 + 오른쪽 아래에서 잘려 들어오는 큰 코랄 원 + 오른쪽 위 작은 원. 글씨는 **`지연이와 아이들의 후쿠오카 여행` 한 줄(또는 두 줄)만** 넣습니다.

### 방법 A (권장) — 배경만 AI로, 글씨는 귀여운 폰트로 합성

AI는 한글을 자주 깨뜨리므로 배경만 생성하고 글씨는 폰트로 얹는 방식이 가장 깔끔합니다.

**프롬프트 (배경, EN)**
```
Minimal flat graphic banner, wide 1200x630 (1.91:1). Solid deep midnight navy
background with a very soft diagonal gradient from #232F4B (top-left) to #2B3F63
(bottom-right). One large perfect coral #EC7A6E circle entering from the
bottom-right corner, cropped by the frame, covering about 30% of the width.
One small muted slate circle #414D6A partially cropped at the top edge, right of
center. Optional: three tiny cream #FFF8F1 dots floating above the coral circle
like steam, and a few very faint thin wave lines in slightly lighter navy at the
bottom-left. Large clean empty area on the left and center for a title.
Flat vector shapes only, perfectly smooth edges, no texture, no noise, no
illustration details, no buildings, no people, no text, no letters, no logo,
no watermark.
```
**설명 (KO)**: 홈 카드처럼 네이비 바탕에 오른쪽 아래 큰 코랄 원, 위쪽 작은 원만 있는 아주 단순한 배경. (선택) 코랄 원 위에 김처럼 떠오르는 작은 점 3개(=세 사람).

**글씨 합성 가이드**
| 항목 | 값 |
|---|---|
| 문구 | `지연이와 아이들의` / `후쿠오카 여행` (두 줄) — 다른 문구 없음 |
| 추천 폰트 (무료, 귀여운 둥근체) | **Jua(주아)** · **Cafe24 써라운드** · **Gaegu(개구) Bold** · 배달의민족 주아 |
| 크기 | 1줄째 76px / 2줄째 96px 전후 (2줄째를 더 크게) |
| 색 | 크림 화이트 `#FFF8F1`, `여행` 두 글자만 코랄 `#EC7A6E`로 포인트(선택) |
| 위치 | 왼쪽 정렬, 왼쪽 여백 88px, 세로 가운데 |
| 효과 | 없음 (그림자·외곽선 X) |

### 방법 B — 글씨까지 AI로 한 번에 (한글 지원 좋은 도구: ChatGPT 이미지 / Ideogram)

**프롬프트 (EN + 한글 문구)**
```
Minimal flat graphic banner, wide 1200x630 (1.91:1). Solid deep midnight navy
background with a very soft diagonal gradient from #232F4B to #2B3F63. One large
coral #EC7A6E circle entering from the bottom-right corner, cropped by the frame.
One small muted slate circle #414D6A partially cropped at the top edge, right of
center. Three tiny cream dots floating above the coral circle like steam.
On the left side, left-aligned and vertically centered, the Korean title written
in two lines in a cute, chunky, rounded handwritten Korean font, cream white
#FFF8F1, with generous letter spacing:
line 1: "지연이와 아이들의"
line 2: "후쿠오카 여행"   (line 2 larger)
The Korean text must be spelled exactly as given. No other text, no English,
no subtitle, no logo, no watermark. Flat vector, smooth edges, no texture.
```
> 생성 후 한글 철자가 정확한지(특히 `아이들의`, `후쿠오카`) 꼭 확인하세요. 하나라도 틀리면 방법 A로.

**결과 파일 넣는 곳**
- 방법 A: 배경을 `assets/og-image.png`에 저장 → 글씨 합성은 `scripts/make-og.mjs`(`npm run og`)로 처리 (현재 스크립트는 날짜·멤버 부제도 넣으므로 제목만 남기도록 수정 필요)
- 방법 B: 완성본을 1200×630으로 맞춰 `public/og-image.png`에 바로 덮어쓰기 (`npm run og` 실행하지 않기)

> 카카오톡은 캐시가 강해서, 이미지를 바꾼 뒤 [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 URL 캐시를 초기화해야 새 이미지가 보입니다.

---

## 5. 생성 후 적용 방법

1. 위 파일들을 지정 위치에 같은 이름으로 저장 (덮어쓰기)
   - 최소: `assets/icon-only.png`, `assets/icon-foreground.png`, `assets/icon-background.png`, `assets/splash.png`, `assets/splash-dark.png`, `assets/og-image.png`
2. 웹 아이콘 일괄 리사이즈 (`assets/icon-only.png` → `public/*` 아이콘들) + OG 합성
   ```bash
   npm run icons:web
   ```
   ```bash
   npm run og
   ```
3. 안드로이드 아이콘·스플래시 생성
   ```bash
   npm run icons:android
   ```
4. 커밋 & 푸시 → 웹은 자동 배포, APK는 GitHub Actions의 **Android APK** 워크플로를 실행
   ```bash
   git add assets public android && git commit -m "Update app icons" && git push
   ```

| 체크 | 내용 |
|---|---|
| ☐ | 아이콘이 48px로 줄여도 알아볼 수 있는가 |
| ☐ | foreground 그림이 가운데 66% 안에 있는가 (원형 마스크에서 잘리지 않는가) |
| ☐ | OG 이미지 한글 제목이 깨지지 않았는가 (후처리로 넣었는가) |
| ☐ | 파일명/위치가 표와 정확히 같은가 |
