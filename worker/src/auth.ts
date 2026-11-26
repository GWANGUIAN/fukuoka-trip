import { HttpError, bumpUsage, json, readJson, type Env } from './http';

const TOKEN_DAYS = 120;
const enc = new TextEncoder();

const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64url = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const keyCache = new Map<string, Promise<CryptoKey>>();
function hmacKey(secret: string) {
  let k = keyCache.get(secret);
  if (!k) {
    k = crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
    keyCache.set(secret, k);
  }
  return k;
}

export async function sign(env: Env, data: string): Promise<string> {
  return b64url(await crypto.subtle.sign('HMAC', await hmacKey(env.TOKEN_SECRET), enc.encode(data)));
}

async function verify(env: Env, data: string, sig: string): Promise<boolean> {
  try {
    return await crypto.subtle.verify('HMAC', await hmacKey(env.TOKEN_SECRET), fromB64url(sig), enc.encode(data));
  } catch {
    return false;
  }
}

/** 상수 시간 문자열 비교 */
function safeEqual(a: string, b: string) {
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export const members = (env: Env) => env.MEMBERS.split(',').map((s) => s.trim());

/** POST /auth {code, member} → {token, member} */
export async function login(req: Request, env: Env) {
  const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
  const minute = new Date().toISOString().slice(0, 16);
  const { code, member } = await readJson<{ code?: string; member?: string }>(req);
  if (!member || !members(env).includes(member)) throw new HttpError(400, '멤버를 선택해 주세요');
  const fails = await env.DB.prepare(`SELECT count FROM usage WHERE subject = ?1 AND bucket = ?2 AND kind = 'auth-fail'`)
    .bind(ip, minute)
    .first<{ count: number }>();
  if ((fails?.count ?? 0) >= 5) throw new HttpError(429, '잠시 후 다시 시도해 주세요');
  if (!code || !safeEqual(code.trim(), env.INVITE_CODE)) {
    await bumpUsage(env, ip, minute, 'auth-fail', 5);
    throw new HttpError(401, '초대 코드가 맞지 않아요');
  }
  const payload = b64url(enc.encode(JSON.stringify({ m: member, exp: Date.now() + TOKEN_DAYS * 86400_000 })));
  return json({ token: `${payload}.${await sign(env, payload)}`, member });
}

/** Authorization: Bearer <token> → 멤버 이름 */
export async function requireMember(req: Request, env: Env): Promise<string> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const [payload, sig] = token.split('.');
  if (!payload || !sig || !(await verify(env, payload, sig))) throw new HttpError(401, '로그인이 필요해요');
  const { m, exp } = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { m: string; exp: number };
  if (exp < Date.now() || !members(env).includes(m)) throw new HttpError(401, '로그인이 만료됐어요');
  return m;
}

/** 이미지 서명 URL: 만료를 하루 단위로 맞춰 같은 날엔 URL이 같게(브라우저 캐시 재사용) */
export async function signedImgPath(env: Env, id: string, variant: 'thumb' | 'orig') {
  const day = 86400_000;
  const exp = Math.ceil(Date.now() / day) * day + 7 * day;
  const sig = await sign(env, `img:${id}:${variant}:${exp}`);
  return `/img/${id}/${variant}?exp=${exp}&sig=${sig}`;
}

export async function verifyImg(env: Env, id: string, variant: string, exp: string | null, sig: string | null) {
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return verify(env, `img:${id}:${variant}:${exp}`, sig);
}
