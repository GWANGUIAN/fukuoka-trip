/**
 * Web Push (RFC 8291 aes128gcm 암호화 + RFC 8292 VAPID) — WebCrypto만 사용, 외부 의존성 없음.
 * 단독 모듈이라 node로 직접 테스트할 수 있다 (scripts/test-webpush.mjs).
 */

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface Vapid {
  /** 공개키 (uncompressed P-256, base64url) */
  publicKey: string;
  /** 개인키 JWK (JSON 문자열) */
  privateJwk: string;
  /** 연락처 URL 또는 mailto: */
  subject: string;
}

const enc = new TextEncoder();

export const b64urlEncode = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const b64urlDecode = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

async function hmac(key: Uint8Array, data: Uint8Array) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

/** HKDF (출력 길이 ≤ 32바이트라 expand는 한 블록) */
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) {
  const prk = await hmac(salt, ikm);
  return (await hmac(prk, concat(info, new Uint8Array([1])))).slice(0, len);
}

/** uncompressed 공개키(65바이트) → JWK x/y */
const pubToJwk = (pub: Uint8Array) => ({
  kty: 'EC',
  crv: 'P-256',
  x: b64urlEncode(pub.slice(1, 33)),
  y: b64urlEncode(pub.slice(33, 65)),
});

export interface EncryptOptions {
  /** 테스트용: 고정 salt / 서버 ECDH 키 */
  salt?: Uint8Array;
  serverKeys?: { publicRaw: Uint8Array; privateJwk: JsonWebKey };
}

/** RFC 8291: 페이로드를 aes128gcm 한 레코드로 암호화 */
export async function encryptPayload(sub: PushSubscriptionJSON, plaintext: Uint8Array, opts: EncryptOptions = {}) {
  const uaPublic = b64urlDecode(sub.keys.p256dh);
  const authSecret = b64urlDecode(sub.keys.auth);
  const salt = opts.salt ?? crypto.getRandomValues(new Uint8Array(16));

  let asPublic: Uint8Array;
  let asPrivate: CryptoKey;
  if (opts.serverKeys) {
    asPublic = opts.serverKeys.publicRaw;
    asPrivate = await crypto.subtle.importKey('jwk', opts.serverKeys.privateJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  } else {
    const kp = (await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])) as CryptoKeyPair;
    asPublic = new Uint8Array((await crypto.subtle.exportKey('raw', kp.publicKey)) as ArrayBuffer);
    asPrivate = kp.privateKey;
  }

  const uaKey = await crypto.subtle.importKey('jwk', pubToJwk(uaPublic), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey } as never, asPrivate, 256));

  const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const aes = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const record = concat(plaintext, new Uint8Array([2])); // 마지막 레코드 구분자
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, record));

  const rs = 4096;
  const header = concat(salt, new Uint8Array([(rs >>> 24) & 255, (rs >>> 16) & 255, (rs >>> 8) & 255, rs & 255]), new Uint8Array([asPublic.length]), asPublic);
  return concat(header, cipher);
}

/** RFC 8292 VAPID JWT (ES256) */
export async function vapidAuth(endpoint: string, vapid: Vapid) {
  const aud = new URL(endpoint).origin;
  const header = b64urlEncode(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64urlEncode(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: vapid.subject })));
  const key = await crypto.subtle.importKey('jwk', JSON.parse(vapid.privateJwk), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${header}.${claims}`));
  return `vapid t=${header}.${claims}.${b64urlEncode(sig)}, k=${vapid.publicKey}`;
}

/** 푸시 1건 전송 → HTTP status (201 성공, 404/410 = 만료된 구독) */
export async function sendPush(sub: PushSubscriptionJSON, payload: unknown, vapid: Vapid, ttl = 6 * 3600): Promise<number> {
  const body = await encryptPayload(sub, enc.encode(JSON.stringify(payload)));
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidAuth(sub.endpoint, vapid),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttl),
      Urgency: 'high',
    },
    body,
  });
  return res.status;
}
