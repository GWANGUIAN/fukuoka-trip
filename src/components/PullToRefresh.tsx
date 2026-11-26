import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

type CapWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };

/** 안드로이드 앱(Capacitor) 안에서만 켜짐. 웹에서 테스트하려면 주소에 ?ptr 추가 */
export const PTR_ENABLED =
  !!(window as CapWindow).Capacitor?.isNativePlatform?.() || new URLSearchParams(window.location.search).has('ptr');

const THRESHOLD = 72; // 이만큼 당기면 새로고침
const MAX = 110;

/** 최상단에서 아래로 당기면 로딩 표시 후 새로고침 */
export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    if (!PTR_ENABLED) return;

    const onStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      // 지도 드래그·별도 스크롤 영역에서는 동작하지 않음
      if (window.scrollY > 0 || e.touches.length !== 1 || target.closest?.('.gm-style, [data-no-ptr]')) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        if (pullRef.current) set(0);
        return;
      }
      e.preventDefault(); // 기본 오버스크롤 대신 직접 표시
      set(Math.min(MAX, dy * 0.5));
    };
    const onEnd = () => {
      if (startY.current === null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        set(THRESHOLD);
        setTimeout(() => window.location.reload(), 350);
      } else {
        set(0);
      }
    };
    const set = (v: number) => {
      pullRef.current = v;
      setPull(v);
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  if (!PTR_ENABLED || (pull === 0 && !refreshing)) return null;

  const ready = pull >= THRESHOLD;
  return (
    <div
      className={`ptr${refreshing ? ' refreshing' : ''}${ready ? ' ready' : ''}`}
      style={{ transform: `translate(-50%, ${pull - 48}px)`, opacity: Math.min(1, pull / 40) }}
      aria-live="polite"
      aria-label={refreshing ? '새로고침 중' : ready ? '놓으면 새로고침' : '당겨서 새로고침'}
    >
      <RefreshCw size={20} style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }} />
    </div>
  );
}
