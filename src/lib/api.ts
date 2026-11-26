import { useEffect, useState } from 'react';

/** Cloudflare Worker 주소 (.env.local / GitHub repo variable VITE_API_URL) */
export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '');

export interface Auth {
  member: string;
  token: string;
}

const AUTH_KEY = 'fk-auth';
const AUTH_EVENT = 'fk-auth-change';

export function getAuth(): Auth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as Auth) : null;
  } catch {
    return null;
  }
}

function setAuth(a: Auth | null) {
  if (a) localStorage.setItem(AUTH_KEY, JSON.stringify(a));
  else localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export const logout = () => setAuth(null);

/** 로그인 상태 (여러 컴포넌트가 같이 갱신되도록 이벤트로 동기화) */
export function useAuth(): Auth | null {
  const [auth, set] = useState<Auth | null>(getAuth);
  useEffect(() => {
    const on = () => set(getAuth());
    window.addEventListener(AUTH_EVENT, on);
    window.addEventListener('storage', on);
    return () => {
      window.removeEventListener(AUTH_EVENT, on);
      window.removeEventListener('storage', on);
    };
  }, []);
  return auth;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError(0, '백엔드 주소가 설정되지 않았어요');
  const auth = getAuth();
  const headers = new Headers(init.headers);
  if (auth) headers.set('Authorization', `Bearer ${auth.token}`);
  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let res: Response;
  try {
    res = await fetch(API_URL + path, { ...init, headers });
  } catch {
    throw new ApiError(0, '인터넷 연결을 확인해 주세요');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth) logout();
    throw new ApiError(res.status, (data as { error?: string }).error ?? `오류 ${res.status}`);
  }
  return data as T;
}

export async function login(code: string, member: string) {
  const a = await apiFetch<Auth>('/auth', { method: 'POST', body: JSON.stringify({ code, member }) });
  setAuth(a);
  return a;
}

/** 짧은 이름: '안광의' → '광의' */
export const shortName = (m: string) => (m.length >= 3 ? m.slice(1) : m);
