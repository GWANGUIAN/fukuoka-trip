export interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  AI: Ai;
  ALLOWED_ORIGINS: string;
  MEMBERS: string;
  INVITE_CODE: string;
  TOKEN_SECRET: string;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });

/** 허용 origin이면 그대로 반사 + 프리플라이트 헤더 */
export function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin');
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  const h: Record<string, string> = { Vary: 'Origin' };
  if (origin && allowed.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}

export function withCors(res: Response, cors: Record<string, string>): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
  return out;
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, '잘못된 요청 본문');
  }
}

export const nowIso = () => new Date().toISOString();

/** 일본/한국 기준(UTC+9) 날짜 YYYY-MM-DD */
export const jstDate = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

/** 사용량 카운터 증가 후 한도 초과면 429 */
export async function bumpUsage(env: Env, subject: string, bucket: string, kind: string, limit: number) {
  const row = await env.DB.prepare(
    `INSERT INTO usage (subject, bucket, kind, count) VALUES (?1, ?2, ?3, 1)
     ON CONFLICT(subject, bucket, kind) DO UPDATE SET count = count + 1
     RETURNING count`,
  )
    .bind(subject, bucket, kind)
    .first<{ count: number }>();
  if ((row?.count ?? 0) > limit) throw new HttpError(429, '오늘 사용 한도를 넘었어요');
}
