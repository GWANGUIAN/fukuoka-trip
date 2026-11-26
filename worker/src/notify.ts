import { HttpError, bumpUsage, jstDate, json, nowIso, readJson, type Env } from './http';
import { dueNotices, type Notice, type NotifyTodo } from './notifyRules';
import { sendPush, type PushSubscriptionJSON, type Vapid } from './webpush';

interface SubRow {
  endpoint: string;
  member: string;
  p256dh: string;
  auth: string;
}

const vapid = (env: Env): Vapid => ({ publicKey: env.VAPID_PUBLIC, privateJwk: env.VAPID_PRIVATE_JWK, subject: env.VAPID_SUBJECT });
const toSub = (r: SubRow): PushSubscriptionJSON => ({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } });
const APP_URL = (env: Env) => env.VAPID_SUBJECT; // 사이트 주소

/** 구독 목록에 보내고 결과 반영 (만료 구독 삭제) */
async function deliver(env: Env, subs: SubRow[], payload: unknown) {
  let ok = 0;
  for (const s of subs) {
    let status = 0;
    try {
      status = await sendPush(toSub(s), payload, vapid(env));
    } catch (e) {
      console.error('push error', e);
    }
    if (status >= 200 && status < 300) {
      ok++;
      await env.DB.prepare('UPDATE push_subs SET last_ok = ?2, fail_count = 0 WHERE endpoint = ?1').bind(s.endpoint, nowIso()).run();
    } else if (status === 404 || status === 410) {
      await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?1').bind(s.endpoint).run();
    } else {
      console.warn('push failed', status, new URL(s.endpoint).host);
      await env.DB.prepare(
        'UPDATE push_subs SET fail_count = fail_count + 1 WHERE endpoint = ?1',
      ).bind(s.endpoint).run();
      await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?1 AND fail_count >= 20').bind(s.endpoint).run();
    }
  }
  return ok;
}

const noticePayload = (env: Env, n: Notice) => ({
  title: n.title,
  body: n.body,
  tag: n.key,
  url: n.url ?? `${APP_URL(env)}#/checklist`,
});

/** cron: 배포된 notify.json을 읽어 때가 된 알림 전송 */
export async function runCron(env: Env, now = Date.now()) {
  const res = await fetch(env.NOTIFY_SOURCE, { cf: { cacheTtl: 300 } } as RequestInit);
  if (!res.ok) throw new Error(`notify.json ${res.status}`);
  const { todos } = (await res.json()) as { todos: NotifyTodo[] };
  const { results: sentRows } = await env.DB.prepare('SELECT key FROM push_sent').all<{ key: string }>();
  const due = dueNotices(todos, now, new Set(sentRows.map((r) => r.key)));
  if (due.length === 0) return { sent: 0 };
  const { results: subs } = await env.DB.prepare('SELECT endpoint, member, p256dh, auth FROM push_subs').all<SubRow>();
  for (const n of due) {
    // 먼저 기록해서 다음 cron과 겹쳐도 두 번 가지 않게
    await env.DB.prepare('INSERT OR IGNORE INTO push_sent (key, sent_at) VALUES (?1, ?2)').bind(n.key, nowIso()).run();
    const ok = await deliver(env, subs, noticePayload(env, n));
    console.log('notice', n.key, `${ok}/${subs.length}`);
  }
  return { sent: due.length };
}

// ───── API ─────
export const pushKey = (env: Env) => json({ publicKey: env.VAPID_PUBLIC });

export async function subscribe(req: Request, env: Env, member: string) {
  const { subscription } = await readJson<{ subscription?: PushSubscriptionJSON }>(req);
  const s = subscription;
  if (!s?.endpoint || !/^https:\/\//.test(s.endpoint) || !s.keys?.p256dh || !s.keys?.auth) throw new HttpError(400, '구독 정보가 잘못됐어요');
  await env.DB.prepare(
    `INSERT INTO push_subs (endpoint, member, p256dh, auth, ua, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT(endpoint) DO UPDATE SET member = ?2, p256dh = ?3, auth = ?4, ua = ?5, fail_count = 0`,
  )
    .bind(s.endpoint, member, s.keys.p256dh, s.keys.auth, (req.headers.get('User-Agent') ?? '').slice(0, 200), nowIso())
    .run();
  return json({ ok: true });
}

export async function unsubscribe(req: Request, env: Env) {
  const { endpoint } = await readJson<{ endpoint?: string }>(req);
  if (endpoint) await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?1').bind(endpoint).run();
  return json({ ok: true });
}

/** 이 기기(endpoint)로 테스트 알림 */
export async function testPush(req: Request, env: Env, member: string) {
  const { endpoint } = await readJson<{ endpoint?: string }>(req);
  await bumpUsage(env, member, jstDate(), 'push-test', 10);
  const row = await env.DB.prepare('SELECT endpoint, member, p256dh, auth FROM push_subs WHERE endpoint = ?1').bind(endpoint ?? '').first<SubRow>();
  if (!row) throw new HttpError(404, '이 기기는 알림이 꺼져 있어요');
  const ok = await deliver(env, [row], { title: '알림 테스트 ✅', body: '예약 오픈 전날 21시와 직전에 이렇게 알려 드려요', tag: 'test', url: `${APP_URL(env)}#/checklist` });
  if (!ok) throw new HttpError(502, '알림 서버 전송에 실패했어요');
  return json({ ok: true });
}
