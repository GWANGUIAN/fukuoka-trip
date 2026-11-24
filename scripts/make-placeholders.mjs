// 임시 플레이스홀더 이미지 생성 (AI 이미지로 교체 전까지 사용)
// 사용: node scripts/make-placeholders.mjs
import sharp from 'sharp';

const CORAL = '#F2665A';
const NAVY = '#1F3A5F';
const IVORY = '#FAF7F2';

// 라멘 그릇 + 김(점 3개) 미니멀 마크
const mark = (fg = CORAL, accent = NAVY) => `
  <g>
    <circle cx="420" cy="330" r="34" fill="${accent}"/>
    <circle cx="512" cy="300" r="34" fill="${accent}"/>
    <circle cx="604" cy="330" r="34" fill="${accent}"/>
    <path d="M232 470 H792 C792 640 670 760 512 760 C354 760 232 640 232 470 Z" fill="${fg}"/>
    <path d="M300 560 q53 -30 106 0 t106 0 t106 0 t106 0" stroke="${IVORY}" stroke-width="22" fill="none" stroke-linecap="round"/>
    <rect x="392" y="768" width="240" height="28" rx="14" fill="${fg}"/>
  </g>`;

const svg = (w, h, body, bg) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}</svg>`);

const scaled = (size, scale, body) => {
  const s = (size / 1024) * scale;
  const off = (size - 1024 * s) / 2;
  return `<g transform="translate(${off} ${off}) scale(${s})">${body}</g>`;
};

await sharp(svg(1024, 1024, mark(), IVORY)).png().toFile('assets/icon-only.png');
await sharp(svg(1024, 1024, scaled(1024, 0.62, mark()))).png().toFile('assets/icon-foreground.png');
await sharp(svg(1024, 1024, '', IVORY)).png().toFile('assets/icon-background.png');
await sharp(svg(2732, 2732, scaled(2732, 0.28, mark()), IVORY)).png().toFile('assets/splash.png');
await sharp(svg(2732, 2732, scaled(2732, 0.28, mark(CORAL, IVORY)), '#14233A')).png().toFile('assets/splash-dark.png');

// OG 1200x630
const og = `
  <rect width="1200" height="630" fill="${IVORY}"/>
  <circle cx="1060" cy="600" r="260" fill="${CORAL}"/>
  <circle cx="880" cy="110" r="60" fill="#F3E9DC"/>
  <g transform="translate(760 150) scale(0.36)">${mark(NAVY, CORAL)}</g>
  <text x="80" y="270" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="64" font-weight="800" fill="${NAVY}">지연이와 아이들의</text>
  <text x="80" y="350" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="64" font-weight="800" fill="${NAVY}">후쿠오카 여행</text>
  <text x="80" y="420" font-family="Malgun Gothic, Apple SD Gothic Neo, sans-serif" font-size="30" font-weight="600" fill="${CORAL}">2027. 1. 22 – 1. 24 · 수빈 · 지연 · 광의</text>`;
await sharp(svg(1200, 630, og)).png().toFile('public/og-image.png');

console.log('placeholders done');
