import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, ImageIcon, Languages, RotateCcw } from 'lucide-react';
import { apiFetch, useAuth } from '../lib/api';
import { resizeImage } from '../lib/image';
import { useLocalStorage } from '../lib/storage';
import { AuthGate } from './AuthGate';
import { Modal } from './Modal';

export interface TranslateItem {
  ja: string;
  ko: string;
  desc?: string;
  price_yen?: number | null;
}

export interface TranslateResult {
  type: 'menu' | 'sign' | 'other' | string;
  summary: string;
  items: TranslateItem[];
  raw?: string;
  /** 글자는 읽었지만 번역 단계가 실패 → raw(원문)만 있음 */
  failed?: boolean;
}

interface Saved extends TranslateResult {
  at: number;
  title?: string;
}

const RECENT_MAX = 5;

function useRecent() {
  return useLocalStorage<Saved[]>('fk-translations', []);
}

function ResultView({ r }: { r: TranslateResult }) {
  const [rate] = useLocalStorage<number>('fk-rate', 9.3);
  return (
    <div className="stack" style={{ gap: 8 }}>
      {r.summary && <div className="small muted">{r.summary}</div>}
      {r.items.length > 0 && (
        <div className="card list" style={{ padding: '12px 14px' }}>
          {r.items.map((it, i) => (
            <div key={i} className="list-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="small" style={{ fontWeight: 750 }}>{it.ko}</div>
                <div className="xs faint">{it.ja}</div>
                {it.desc && <div className="xs muted">{it.desc}</div>}
              </div>
              {typeof it.price_yen === 'number' && (
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div className="small" style={{ fontWeight: 800 }}>¥{it.price_yen.toLocaleString('ja-JP')}</div>
                  <div className="xs faint">≈ {Math.round(it.price_yen * rate).toLocaleString('ko-KR')}원</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {r.items.length === 0 && r.raw && (
        <>
          <div className="small muted">글자는 읽었는데 번역이 안 됐어요. 아래 원문을 확인하고 다시 번역해 보세요.</div>
          <div className="card small" style={{ whiteSpace: 'pre-wrap' }}>{r.raw}</div>
        </>
      )}
      {r.items.length === 0 && !r.raw && !r.summary && <div className="small muted">읽을 수 있는 글자를 찾지 못했어요. 더 가까이서 다시 찍어 보세요.</div>}
      <div className="xs faint">AI 번역이라 틀릴 수 있어요 · 알레르기 등 중요한 건 직원에게 확인</div>
    </div>
  );
}

/** 서버는 한 번의 요청이라 단계는 경과 시간으로 안내 (글자 읽기 ≈ 6초, 번역 ≈ 15초) */
function Progress() {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const step = sec < 7 ? '사진에서 글자 읽는 중' : sec < 35 ? '한국어로 번역하는 중' : '조금만 더 기다려 주세요';
  return (
    <div className="row small muted">
      <span className="spinner" /> {step}… <span className="faint" style={{ fontVariantNumeric: 'tabular-nums' }}>{sec}초</span>
    </div>
  );
}

function TranslateSheet({ title, onClose }: { title?: string; onClose: () => void }) {
  const auth = useAuth();
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [, setRecent] = useRecent();

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const send = async (blob: Blob) => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const r = await apiFetch<TranslateResult>('/translate', { method: 'POST', body: blob, headers: { 'Content-Type': 'image/jpeg' } });
      setResult(r);
      if (r.items.length > 0) setRecent((prev) => [{ ...r, at: Date.now(), title }, ...prev].slice(0, RECENT_MAX));
    } catch (e) {
      setError((e as Error).message || '번역하지 못했어요');
    } finally {
      setBusy(false);
    }
  };

  const run = async (file: File) => {
    setError('');
    try {
      const { blob } = await resizeImage(file, 1280, 'image/jpeg', 0.8);
      blobRef.current = blob;
      setPreview(URL.createObjectURL(blob));
      await send(blob);
    } catch (e) {
      setError((e as Error).message || '사진을 읽지 못했어요');
    }
  };

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) run(f);
  };

  const canRetry = !busy && blobRef.current && (error || result?.failed);

  return (
    <Modal title={title ? `메뉴 번역 · ${title}` : '메뉴판·간판 번역'} onClose={onClose}>
      <AuthGate compact>
        <div className="stack">
          <div className="row" style={{ gap: 8 }}>
            <button className="btn primary big" style={{ flex: 1 }} disabled={busy || !auth} onClick={() => camRef.current?.click()}>
              <Camera size={16} /> {preview ? '다시 찍기' : '사진 찍기'}
            </button>
            <button className="btn big" style={{ flex: 1 }} disabled={busy || !auth} onClick={() => galRef.current?.click()}>
              <ImageIcon size={16} /> 갤러리
            </button>
          </div>
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
          <input ref={galRef} type="file" accept="image/*" hidden onChange={pick} />
          {!preview && <div className="xs faint">글자가 화면에 꽉 차게, 흔들리지 않게 찍으면 더 정확해요. 메뉴가 길면 나눠서 찍어 주세요.</div>}
          {preview && <img src={preview} alt="" className={`tr-preview${result ? ' small' : ''}`} />}
          {busy && <Progress />}
          {error && <div className="small" style={{ color: 'var(--primary)' }}>{error}</div>}
          {canRetry && (
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => send(blobRef.current!)}>
              <RotateCcw size={14} /> 같은 사진으로 다시 번역
            </button>
          )}
          {result && <ResultView r={result} />}
        </div>
      </AuthGate>
    </Modal>
  );
}

export function TranslateButton({ title, className = 'btn', label = '메뉴 번역' }: { title?: string; className?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        <Languages size={14} /> {label}
      </button>
      {open && <TranslateSheet title={title} onClose={() => setOpen(false)} />}
    </>
  );
}

/** 정보 탭: 번역 시작 + 최근 번역 */
export function TranslateCard() {
  const [recent, setRecent] = useRecent();
  const [view, setView] = useState<Saved | null>(null);
  return (
    <div className="card stack">
      <div className="small muted">메뉴판·간판·안내문을 찍으면 한국어로 읽어 주고, 가격은 원화로 바꿔 보여줘요.</div>
      <TranslateButton className="btn primary big" label="사진으로 번역하기" />
      {recent.length > 0 && (
        <div className="list">
          {recent.map((r) => (
            <button key={r.at} className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setView(r)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="small" style={{ fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.title ? `${r.title} · ` : ''}{r.items.slice(0, 3).map((i) => i.ko).join(', ') || r.summary || '번역 결과'}
                </div>
                <div className="xs faint">{new Date(r.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {r.items.length}개</div>
              </div>
            </button>
          ))}
          <button className="xs faint" style={{ marginTop: 8 }} onClick={() => setRecent([])}>최근 번역 지우기</button>
        </div>
      )}
      {view && (
        <Modal title={view.title ? `메뉴 번역 · ${view.title}` : '최근 번역'} onClose={() => setView(null)}>
          <ResultView r={view} />
        </Modal>
      )}
    </div>
  );
}
