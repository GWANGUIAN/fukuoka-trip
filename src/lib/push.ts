import { apiFetch } from './api';

export type PushState = 'loading' | 'unsupported' | 'ios-needs-install' | 'capacitor' | 'denied' | 'off' | 'on';

type CapWindow = Window & { Capacitor?: { isNativePlatform?: () => boolean } };
export const isCapacitor = () => !!(window as CapWindow).Capacitor?.isNativePlatform?.();
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** 서비스워커 등록을 기다리되, 개발 모드처럼 등록이 없으면 null */
async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 4000));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

export async function currentSubscription() {
  const reg = await registration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function getPushState(): Promise<PushState> {
  if (isCapacitor()) return 'capacitor';
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) return isIOS() && !isStandalone() ? 'ios-needs-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await registration();
  if (!reg) return 'unsupported';
  return (await reg.pushManager.getSubscription()) ? 'on' : 'off';
}

const keyBytes = (b64: string) => {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

/** 서버에 현재 구독 등록 (켜져 있는 기기는 화면을 열 때마다 다시 보내 동기화) */
export async function syncSubscription(sub: PushSubscription) {
  await apiFetch('/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub.toJSON() }) });
}

export async function enablePush(): Promise<PushState> {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off';
  const reg = await registration();
  if (!reg) throw new Error('서비스워커가 준비되지 않았어요. 새로고침 후 다시 시도해 주세요');
  const { publicKey } = await apiFetch<{ publicKey: string }>('/push/key');
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  await syncSubscription(sub);
  return 'on';
}

export async function disablePush(): Promise<PushState> {
  const sub = await currentSubscription();
  if (sub) {
    await apiFetch('/push/subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
    await sub.unsubscribe();
  }
  return 'off';
}

export async function testPush() {
  const sub = await currentSubscription();
  if (!sub) throw new Error('이 기기는 알림이 꺼져 있어요');
  await apiFetch('/push/test', { method: 'POST', body: JSON.stringify({ endpoint: sub.endpoint }) });
}
