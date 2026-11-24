import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const APP_NAME = '지연이와 아이들의 후쿠오카 여행';

export default defineConfig({
  base: '/fukuoka-trip/',
  plugins: [
    react(),
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
      },
    }),
  ],
});
