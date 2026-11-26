import { useSearchParams } from 'react-router-dom';
import { AuthGate, WhoAmI } from '../components/AuthGate';
import { Album } from '../components/album/Album';
import { Wallet } from '../components/wallet/Wallet';

const TABS = [
  { key: 'album', label: '앨범' },
  { key: 'wallet', label: '지갑' },
] as const;

export function Together() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'wallet' ? 'wallet' : 'album';

  return (
    <div className="page">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">함께</h1>
          <p className="page-sub">우리 셋만 보는 사진과 지갑</p>
        </div>
        <WhoAmI />
      </div>
      <AuthGate>
        <div className="seg wide" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? 'on' : ''}
              onClick={() => setParams({ tab: t.key }, { replace: true })}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'album' ? <Album /> : <Wallet />}
      </AuthGate>
    </div>
  );
}
