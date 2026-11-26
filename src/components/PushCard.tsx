import { useEffect, useState, type ReactNode } from 'react';
import { Bell, BellOff, BellRing, Copy, Share } from 'lucide-react';
import { API_URL, useAuth } from '../lib/api';
import { currentSubscription, disablePush, enablePush, getPushState, syncSubscription, testPush, type PushState } from '../lib/push';
import { AuthGate } from './AuthGate';

const SITE = 'https://gwanguian.github.io/fukuoka-trip/';
const CHROME_INTENT = 'intent://gwanguian.github.io/fukuoka-trip/#Intent;scheme=https;package=com.android.chrome;end';

/** 체크 탭: 예약 오픈·할 일 푸시 알림 켜기 */
export function PushCard() {
  const auth = useAuth();
  const [state, setState] = useState<PushState>('loading');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getPushState().then(setState);
  }, []);

  // 켜져 있는 기기는 서버 구독을 최신으로 (다른 멤버로 다시 로그인한 경우 등)
  useEffect(() => {
    if (state !== 'on' || !auth) return;
    currentSubscription().then((s) => s && syncSubscription(s).catch(() => {}));
  }, [state, auth]);

  if (!API_URL || state === 'loading') return null;

  const act = async (fn: () => Promise<PushState | void>, done?: string) => {
    setBusy(true);
    setMsg('');
    try {
      const next = await fn();
      if (next) setState(next);
      if (done) setMsg(done);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const head = (icon: ReactNode, title: string, sub: string) => (
    <div className="row" style={{ alignItems: 'flex-start' }}>
      <span className="place-icon">{icon}</span>
      <div style={{ flex: 1 }}>
        <div className="small" style={{ fontWeight: 700 }}>{title}</div>
        <div className="xs faint">{sub}</div>
      </div>
    </div>
  );

  let body: ReactNode;
  if (state === 'capacitor') {
    body = (
      <>
        {head(<BellOff size={16} />, '이 앱에서는 알림을 못 받아요', '크롬에서 "홈 화면에 추가"한 앱으로 쓰면 알림을 받을 수 있어요')}
        <div className="actions">
          <a className="btn primary" href={CHROME_INTENT}>크롬으로 열기</a>
          <button className="btn" onClick={() => navigator.clipboard?.writeText(SITE).then(() => setMsg('주소를 복사했어요'))}>
            <Copy size={13} /> 주소 복사
          </button>
        </div>
      </>
    );
  } else if (state === 'ios-needs-install') {
    body = head(<Share size={16} />, '아이폰은 홈 화면 앱에서 알림을 받아요', 'Safari 공유 버튼 → "홈 화면에 추가" → 추가된 앱을 열고 여기서 알림 켜기');
  } else if (state === 'unsupported') {
    body = head(<BellOff size={16} />, '이 브라우저는 알림을 지원하지 않아요', '안드로이드는 크롬, 아이폰은 홈 화면에 추가한 앱에서 켜 주세요');
  } else if (state === 'denied') {
    body = head(<BellOff size={16} />, '알림이 차단돼 있어요', '브라우저/앱 설정 → 알림 → 이 사이트 허용 후 새로고침');
  } else if (state === 'on') {
    body = (
      <>
        {head(<BellRing size={16} color="var(--st-confirmed)" />, '예약 오픈 알림 받는 중', '전날 밤 9시 + 오픈 10분 전(날짜만 있으면 당일 오전 9시)')}
        <div className="actions">
          <button className="btn" disabled={busy || !auth} onClick={() => act(() => testPush(), '테스트 알림을 보냈어요')}>테스트</button>
          <button className="btn" disabled={busy} onClick={() => act(disablePush)}>끄기</button>
        </div>
      </>
    );
  } else {
    body = (
      <AuthGate compact>
        {head(<Bell size={16} />, '예약 오픈 알림 받기', '할 일마다 전날 밤 9시와 직전에 폰으로 알려 드려요')}
        <button className="btn primary big" disabled={busy} onClick={() => act(enablePush)}>
          {busy ? '설정 중…' : '알림 켜기'}
        </button>
      </AuthGate>
    );
  }

  return (
    <div className="card stack">
      {body}
      {msg && <div className="xs muted">{msg}</div>}
    </div>
  );
}
