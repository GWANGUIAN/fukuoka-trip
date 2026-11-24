// assets/icon-only.png → public/ 웹 아이콘(파비콘·PWA·apple-touch) 일괄 생성
// 사용: npm run icons:web
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { writeFile } from 'node:fs/promises';

const SRC = 'assets/icon-only.png';
const BG = '#FAF7F2';

const out = [
  ['public/favicon-32.png', 32],
  ['public/apple-touch-icon.png', 180],
  ['public/pwa-192.png', 192],
  ['public/pwa-512.png', 512],
];

for (const [file, size] of out) {
  await sharp(SRC).resize(size, size).flatten({ background: BG }).png().toFile(file);
  console.log('✔', file);
}

// maskable: 그림을 80% 크기로 줄여 가운데 배치
const inner = await sharp(SRC).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: BG } })
  .composite([{ input: inner, gravity: 'center' }])
  .png()
  .toFile('public/maskable-512.png');
console.log('✔ public/maskable-512.png');

const icoSizes = await Promise.all([16, 32, 48].map((s) => sharp(SRC).resize(s, s).png().toBuffer()));
await writeFile('public/favicon.ico', await pngToIco(icoSizes));
console.log('✔ public/favicon.ico');
