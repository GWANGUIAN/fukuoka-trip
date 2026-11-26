import { signedImgPath, verifyImg } from './auth';
import { HttpError, bumpUsage, jstDate, json, nowIso, type Env } from './http';

const MAX_THUMB = 3 * 1024 * 1024;
const MAX_ORIG = 25 * 1024 * 1024;
const DAILY_LIMIT = 300;

interface PhotoRow {
  id: string;
  member: string;
  day: number | null;
  item_id: string | null;
  place_id: string | null;
  taken_at: string | null;
  caption: string | null;
  w: number | null;
  h: number | null;
  thumb_key: string;
  orig_key: string | null;
  orig_name: string | null;
  orig_size: number | null;
  created_at: string;
}

interface PhotoMeta {
  day?: number | null;
  itemId?: string | null;
  placeId?: string | null;
  takenAt?: string | null;
  caption?: string | null;
  w?: number;
  h?: number;
}

const origin = (req: Request) => new URL(req.url).origin;

async function toApi(req: Request, env: Env, r: PhotoRow) {
  const base = origin(req);
  return {
    id: r.id,
    member: r.member,
    day: r.day,
    itemId: r.item_id,
    placeId: r.place_id,
    takenAt: r.taken_at,
    caption: r.caption,
    w: r.w,
    h: r.h,
    origName: r.orig_name,
    origSize: r.orig_size,
    createdAt: r.created_at,
    thumbUrl: base + (await signedImgPath(env, r.id, 'thumb')),
    origUrl: r.orig_key ? base + (await signedImgPath(env, r.id, 'orig')) : null,
  };
}

export async function listPhotos(req: Request, env: Env) {
  const { results } = await env.DB.prepare('SELECT * FROM photos ORDER BY day, taken_at, created_at').all<PhotoRow>();
  return json({ photos: await Promise.all(results.map((r) => toApi(req, env, r))) });
}

const extOf = (name: string, type: string) => {
  const m = /\.([a-z0-9]{2,5})$/i.exec(name);
  if (m) return m[1].toLowerCase();
  return type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin';
};

/** multipart: thumb(webp) · orig(원본, 선택) · meta(JSON) */
export async function uploadPhoto(req: Request, env: Env, member: string) {
  const form = await req.formData().catch(() => {
    throw new HttpError(400, '업로드 형식이 잘못됐어요');
  });
  const thumb = form.get('thumb');
  const orig = form.get('orig');
  if (!(thumb instanceof File) || thumb.size === 0) throw new HttpError(400, '사진이 없어요');
  if (thumb.size > MAX_THUMB) throw new HttpError(413, '미리보기 사진이 너무 커요');
  if (orig instanceof File && orig.size > MAX_ORIG) throw new HttpError(413, '원본이 25MB를 넘어요');
  if (!thumb.type.startsWith('image/') || (orig instanceof File && !orig.type.startsWith('image/'))) {
    throw new HttpError(415, '이미지 파일만 올릴 수 있어요');
  }
  let meta: PhotoMeta = {};
  try {
    meta = JSON.parse(String(form.get('meta') ?? '{}'));
  } catch {
    /* 메타 없음 */
  }
  await bumpUsage(env, member, jstDate(), 'photo', DAILY_LIMIT);

  const id = crypto.randomUUID();
  const thumbKey = `photos/${id}/thumb.webp`;
  await env.PHOTOS.put(thumbKey, thumb.stream(), { httpMetadata: { contentType: thumb.type } });
  let origKey: string | null = null;
  if (orig instanceof File && orig.size > 0) {
    origKey = `photos/${id}/orig.${extOf(orig.name, orig.type)}`;
    await env.PHOTOS.put(origKey, orig.stream(), { httpMetadata: { contentType: orig.type } });
  }
  const str = (v: unknown, n: number) => (typeof v === 'string' && v ? v.slice(0, n) : null);
  await env.DB.prepare(
    `INSERT INTO photos (id, member, day, item_id, place_id, taken_at, caption, w, h, thumb_key, orig_key, orig_name, orig_size, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
  )
    .bind(
      id,
      member,
      typeof meta.day === 'number' ? Math.trunc(meta.day) : null,
      str(meta.itemId, 64),
      str(meta.placeId, 64),
      str(meta.takenAt, 32),
      str(meta.caption, 200),
      typeof meta.w === 'number' ? Math.trunc(meta.w) : null,
      typeof meta.h === 'number' ? Math.trunc(meta.h) : null,
      thumbKey,
      origKey,
      orig instanceof File ? orig.name.slice(0, 120) : null,
      orig instanceof File ? orig.size : null,
      nowIso(),
    )
    .run();
  const row = await env.DB.prepare('SELECT * FROM photos WHERE id = ?1').bind(id).first<PhotoRow>();
  return json(await toApi(req, env, row!), 201);
}

export async function deletePhoto(env: Env, id: string, member: string) {
  const row = await env.DB.prepare('SELECT * FROM photos WHERE id = ?1').bind(id).first<PhotoRow>();
  if (!row) return json({ ok: true });
  if (row.member !== member) throw new HttpError(403, '올린 사람만 지울 수 있어요');
  await env.PHOTOS.delete([row.thumb_key, ...(row.orig_key ? [row.orig_key] : [])]);
  await env.DB.prepare('DELETE FROM photos WHERE id = ?1').bind(id).run();
  return json({ ok: true });
}

/** GET /img/:id/:variant?exp&sig[&dl=1] — 서명 URL로만 접근 */
export async function serveImage(req: Request, env: Env, id: string, variant: string) {
  const url = new URL(req.url);
  if (variant !== 'thumb' && variant !== 'orig') throw new HttpError(404, '없음');
  if (!(await verifyImg(env, id, variant, url.searchParams.get('exp'), url.searchParams.get('sig')))) {
    throw new HttpError(403, '링크가 만료됐어요');
  }
  const row = await env.DB.prepare('SELECT thumb_key, orig_key, orig_name FROM photos WHERE id = ?1')
    .bind(id)
    .first<Pick<PhotoRow, 'thumb_key' | 'orig_key' | 'orig_name'>>();
  const key = variant === 'thumb' ? row?.thumb_key : row?.orig_key;
  if (!key) throw new HttpError(404, '사진이 없어요');
  const obj = await env.PHOTOS.get(key);
  if (!obj) throw new HttpError(404, '사진이 없어요');
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('ETag', obj.httpEtag);
  headers.set('Cache-Control', 'private, max-age=604800, immutable');
  if (url.searchParams.get('dl') === '1') {
    const name = row?.orig_name || `${id}.${key.split('.').pop()}`;
    headers.set('Content-Disposition', `attachment; filename="photo.${key.split('.').pop()}"; filename*=UTF-8''${encodeURIComponent(name)}`);
  }
  return new Response(obj.body, { headers });
}
