import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { trip } from './src/data/trip';

const APP_NAME = '지연이와 아이들의 후쿠오카 여행';

/** 푸시 알림용: 빌드 때 할 일 목록을 notify.json으로 내보내 Worker cron이 읽게 한다 */
function notifyJson(): Plugin {
  return {
    name: 'notify-json',
    generateBundle() {
      const todos = trip.todos.map(({ id, date, title, note, url }) => ({ id, date, title, note, url }));
      this.emitFile({ type: 'asset', fileName: 'notify.json', source: JSON.stringify({ title: trip.title, updatedAt: trip.updatedAt, todos }, null, 2) });
    },
  };
}

export default defineConfig({
  base: '/fukuoka-trip/',
  plugins: [
    react(),
    notifyJson(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon-32.png', 'apple-touch-icon.png', 'og-image.png'],
      manifest: {
        name: APP_NAME,
        short_name: '후쿠오카 여행',
        description: '수빈 · 지연 · 광의의 2027 후쿠오카 2박 3일 여행 일정',
        lang: 'ko',
        theme_color: '#FAF7F2',
        background_color: '#FAF7F2',
        display: 'standalone',
        start_url: '/fukuoka-trip/',
        scope: '/fukuoka-trip/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,ico,svg}'],
        navigateFallback: 'index.html',
        // 푸시 수신·알림 클릭 처리 (public/push-sw.js)
        importScripts: ['push-sw.js'],
      },
    }),
  ],
});
