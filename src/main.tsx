import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/global.css';

// 새 배포가 있으면 서비스워커를 갱신하고 페이지를 자동 새로고침 (일정 업데이트 즉시 반영)
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    // 앱을 다시 볼 때마다 + 30분마다 새 버전 확인
    const check = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
    setInterval(check, 30 * 60 * 1000);
  },
  onNeedRefresh() {
    updateSW(true);
  },
});

// 안드로이드 앱(Capacitor WebView) 안에서는 target=_blank 링크가 열리지 않으므로
// 외부 링크(구글맵·예약·블로그)를 직접 이동시켜 시스템 브라우저/구글맵 앱으로 넘깁니다.
type CapWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };
if ((window as CapWindow).Capacitor?.isNativePlatform?.()) {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest?.('a[target="_blank"]') as HTMLAnchorElement | null;
    if (!a?.href) return;
    e.preventDefault();
    window.location.href = a.href;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
