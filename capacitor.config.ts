import type { CapacitorConfig } from '@capacitor/cli';

// 앱은 GitHub Pages에 배포된 웹을 WebView로 띄웁니다.
// → 일정(trip.ts)을 수정해 push 하면 앱 재설치 없이 바로 반영됩니다.
const config: CapacitorConfig = {
  appId: 'io.github.gwanguian.fukuokatrip',
  appName: '지연이와 아이들의 후쿠오카 여행',
  webDir: 'dist',
  server: {
    url: 'https://gwanguian.github.io/fukuoka-trip/',
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#FAF7F2',
  },
};

export default config;
