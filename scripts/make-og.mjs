// public/og-image.png (1200x630) 생성 — 제목만, 귀여운 폰트(Jua)
// 사용: npm run og
//
// 배경: assets/og-bg.png 가 있으면 그 이미지를 사용(AI 생성 배경),
//       없으면 앱 홈 카드와 같은 톤의 단순한 벡터 배경을 직접 그림.
// 글씨: 폰트 파일을 path로 변환해 그리므로 PC에 폰트 설치가 필요 없음.
import sharp from 'sharp';
import opentype from 'opentype.js';
import { existsSync } from 'node:fs';

const W = 1200;
const H = 630;
const BG_FILE = 'assets/og-bg.png';
const FONT_FILE = 'assets/fonts/Jua-Regular.ttf';

const C = {
  navyA: '#232F4B',
  navyB: '#2B3F63',
  coral: '#EC7A6E',
  slate: '#414D6A',
  cream: '#FFF8F1',
};

// ── 제목 (여기 문구/크기만 바꾸면 됨) ──
const LINES = [
  { parts: [{ text: '지연이와 아이들의', color: C.cream }], size: 84 },
  { parts: [{ text: '후쿠오카 ', color: C.cream }, { text: '여행', color: C.coral }], size: 112 },
];
const LEFT = 92;
const LINE_GAP = 26;

const font = opentype.parse((await import('node:fs')).readFileSync(FONT_FILE).buffer);

function textPaths() {
  const heights = LINES.map((l) => l.size);
  const total = heights.reduce((a, b) => a + b, 0) + LINE_GAP * (LINES.length - 1);
  let y = (H - total) / 2;
  let out = '';
  for (const line of LINES) {
    y += line.size * 0.86; // baseline
    let x = LEFT;
    for (const part of line.parts) {
      const p = font.getPath(part.text, x, y, line.size);
      out += `<path d="${p.toPathData(2)}" fill="${part.color}"/>`;
      x += font.getAdvanceWidth(part.text, line.size);
    }
    y += line.size * 0.14 + LINE_GAP;
  }
  return out;
}

const vectorBg = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.navyA}"/>
      <stop offset="1" stop-color="${C.navyB}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="1080" cy="640" r="300" fill="${C.coral}"/>
  <circle cx="900" cy="-10" r="96" fill="${C.slate}" fill-opacity="0.85"/>
  <circle cx="1010" cy="292" r="11" fill="${C.cream}"/>
  <circle cx="1052" cy="268" r="11" fill="${C.cream}"/>
  <circle cx="1094" cy="292" r="11" fill="${C.cream}"/>`;

const useBg = existsSync(BG_FILE);
const overlay = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${useBg ? '' : vectorBg}${textPaths()}</svg>`,
);

const base = useBg
  ? sharp(BG_FILE).resize(W, H, { fit: 'cover', position: 'right' })
  : sharp({ create: { width: W, height: H, channels: 4, background: C.navyA } });

await base
  .composite([{ input: overlay }])
  .png({ compressionLevel: 9 })
  .toFile('public/og-image.png');

console.log(`✔ public/og-image.png (배경: ${useBg ? BG_FILE : '벡터 기본 배경'})`);
