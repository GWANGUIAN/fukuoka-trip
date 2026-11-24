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

**프롬프트 (배경 일러스트, EN)**
```
Wide horizontal banner illustration, 1200x630. Minimal flat illustration of the
Fukuoka city skyline at golden hour: Fukuoka Tower on the right, calm Hakata bay
waves at the bottom, a small airplane leaving a dotted trail in the sky, a steaming
ramen bowl and a yatai food stall lantern small in the foreground on the right.
Leave the LEFT 55% of the image as clean empty warm ivory #FAF7F2 space for a title.
Palette: coral #F2665A, deep navy #1F3A5F, sand #F3E9DC, ivory #FAF7F2.
+ 공통 꼬리말
```
**설명 (KO)**: 오른쪽에 후쿠오카 타워·바다·비행기·라멘을 배치하고, 왼쪽 절반은 비워 두어 제목을 얹을 공간 확보.

**합성되는 텍스트 (왼쪽 여백에 — `npm run og`가 자동 처리)**
- 제목: `지연이와 아이들의 후쿠오카 여행` (굵게, 네이비 `#1F3A5F`, Pretendard Bold 64px 전후)
- 부제: `2027. 1. 22 – 1. 24 · 수빈 · 지연 · 광의` (코랄 `#F2665A`, 32px)
- 안전 여백: 상하좌우 60px

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
