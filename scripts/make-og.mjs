// assets/og-image.png (AI 배경 원본, 왼쪽 여백 있는 가로 이미지) → public/og-image.png (1200x630 + 한글 제목 합성)
// 사용: npm run og
import sharp from 'sharp';

const NAVY = '#1F3A5F';
const CORAL = '#F2665A';
const FONT = "'Pretendard', 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

const text = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <text x="72" y="236" font-family="${FONT}" font-size="34" font-weight="700" fill="${CORAL}" letter-spacing="4">FUKUOKA 2027</text>
  <text x="72" y="318" font-family="${FONT}" font-size="66" font-weight="800" fill="${NAVY}">지연이와 아이들의</text>
  <text x="72" y="398" font-family="${FONT}" font-size="66" font-weight="800" fill="${NAVY}">후쿠오카 여행</text>
  <text x="72" y="460" font-family="${FONT}" font-size="28" font-weight="600" fill="${NAVY}" fill-opacity="0.7">2027. 1. 22 – 1. 24 · 수빈 · 지연 · 광의</text>
</svg>`);

await sharp('assets/og-image.png')
  .resize(1200, 630, { fit: 'cover', position: 'right' })
  .composite([{ input: text }])
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile('public/og-image.png');

console.log('✔ public/og-image.png');
