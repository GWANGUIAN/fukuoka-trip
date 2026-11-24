import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

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
