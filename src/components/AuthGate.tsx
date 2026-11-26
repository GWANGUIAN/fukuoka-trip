import { useState, type ReactNode } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { trip } from '../data/trip';
import { API_URL, login, logout, shortName, useAuth } from '../lib/api';

/** 로그인(초대 코드 + 멤버)이 필요한 화면을 감싼다 */
export function AuthGate({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const auth = useAuth();
  const [code, setCode] = useState('');
  const [member, setMember] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!API_URL) {
    return <div className="card small muted">백엔드 주소(VITE_API_URL)가 설정되지 않아 이 기능을 쓸 수 없어요.</div>;
  }
  if (auth) return <>{children}</>;

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await login(code, member);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card stack">
      <div className="row" style={{ fontWeight: 700 }}>
        <KeyRound size={16} /> 우리끼리 쓰는 기능이에요
      </div>
      {!compact && <div className="small muted">사진·지갑·번역은 초대 코드로 한 번만 로그인하면 이 기기에서 계속 쓸 수 있어요.</div>}
      <div className="xs faint">나는 누구?</div>
      <div className="chips" style={{ flexWrap: 'wrap' }}>
        {trip.members.map((m) => (
          <button key={m} className={`chip${member === m ? ' active' : ''}`} onClick={() => setMember(m)}>
            {shortName(m)}
          </button>
        ))}
      </div>
      <input
        className="field"
        placeholder="초대 코드"
        autoCapitalize="none"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && member && code && submit()}
      />
      {error && <div className="xs" style={{ color: 'var(--primary)' }}>{error}</div>}
      <button className="btn primary big" disabled={!member || !code || busy} onClick={submit}>
        {busy ? '확인 중…' : '시작하기'}
      </button>
    </div>
  );
}

export function WhoAmI() {
  const auth = useAuth();
  if (!auth) return null;
  return (
    <button className="btn" onClick={() => confirm('이 기기에서 로그아웃할까요?') && logout()}>
      {shortName(auth.member)} <LogOut size={13} />
    </button>
  );
}
