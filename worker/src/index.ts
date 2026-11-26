import { login, requireMember } from './auth';
import { createExpense, deleteExpense, listExpenses, setRate, updateExpense } from './expenses';
import { HttpError, corsHeaders, json, withCors, type Env } from './http';
import { deletePhoto, listPhotos, serveImage, uploadPhoto } from './photos';
import { translate } from './translate';
import { pushKey, runCron, subscribe, testPush, unsubscribe } from './notify';

async function route(req: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(req.url);
  const m = req.method;
  const seg = pathname.split('/').filter(Boolean);

  if (m === 'GET' && pathname === '/health') return json({ ok: true });
  if (m === 'POST' && pathname === '/auth') return login(req, env);
  if (m === 'GET' && pathname === '/push/key') return pushKey(env);
  // 이미지는 <img>로 불러오므로 헤더 대신 서명 URL로 검증
  if (m === 'GET' && seg[0] === 'img' && seg.length === 3) return serveImage(req, env, seg[1], seg[2]);

  const member = await requireMember(req, env);

  if (m === 'GET' && pathname === '/me') return json({ member });

  if (seg[0] === 'expenses') {
    if (seg.length === 1 && m === 'GET') return listExpenses(env);
    if (seg.length === 1 && m === 'POST') return createExpense(req, env, member);
    if (seg.length === 2 && m === 'PUT') return updateExpense(req, env, seg[1]);
    if (seg.length === 2 && m === 'DELETE') return deleteExpense(env, seg[1]);
  }
  if (m === 'PUT' && pathname === '/settings/rate') return setRate(req, env);

  if (seg[0] === 'photos') {
    if (seg.length === 1 && m === 'GET') return listPhotos(req, env);
    if (seg.length === 1 && m === 'POST') return uploadPhoto(req, env, member);
    if (seg.length === 2 && m === 'DELETE') return deletePhoto(env, seg[1], member);
  }

  if (m === 'POST' && pathname === '/translate') return translate(req, env, member);

  if (m === 'POST' && pathname === '/push/subscribe') return subscribe(req, env, member);
  if (m === 'DELETE' && pathname === '/push/subscribe') return unsubscribe(req, env);
  if (m === 'POST' && pathname === '/push/test') return testPush(req, env, member);

  throw new HttpError(404, '없는 주소예요');
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(req, env);
    // 프리플라이트는 인증 전에 바로 응답
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      return withCors(await route(req, env), cors);
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      const message = e instanceof HttpError ? e.message : '서버 오류가 났어요';
      if (status === 500) console.error(e);
      return withCors(json({ error: message }, status), cors);
    }
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runCron(env).catch((e) => console.error('cron', e)));
  },
} satisfies ExportedHandler<Env>;
