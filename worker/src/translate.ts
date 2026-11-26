import { HttpError, bumpUsage, jstDate, json, type Env } from './http';

/** 1단계: 사진에서 일본어 읽기 (비전) → 2단계: 한국어 번역·설명 (큰 텍스트 모델) */
const VISION_MODEL = '@cf/meta/llama-4-scout-17b-16e-instruct';
const TEXT_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_BYTES = 1.5 * 1024 * 1024;
const DAILY_LIMIT = 40;

const OCR_PROMPT = `Transcribe the Japanese text in this photo (menu, sign, notice, label).
Return JSON only: {"type":"menu"|"sign"|"other","lines":[{"ja":"exact Japanese text of one item or sentence","price_yen":number or null}]}
- Copy characters exactly as printed (keep symbols like 〆, （）, 個).
- One menu item per line, in printed order. Put the price of that item in price_yen (number only).
- Headings or notices are separate lines with price_yen null.`;

const OCR_SCHEMA = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['menu', 'sign', 'other'] },
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: { ja: { type: 'string' }, price_yen: { type: ['number', 'null'] } },
        required: ['ja'],
      },
    },
  },
  required: ['type', 'lines'],
};

const TR_PROMPT = `너는 일본 음식과 일본어를 잘 아는 한국인 통역사야. 후쿠오카를 여행하는 한국인에게 아래 일본어를 설명해 줘.
입력은 사진에서 읽은 줄 목록(JSON)이야. 각 줄마다 같은 순서로 번역하고 JSON 하나만 출력해:
{"summary":"무엇인지 한국어 한 문장 (예: 이자카야 오늘의 추천 메뉴)","items":[{"ja":"원문 그대로","ko":"한국 사람이 아는 이름","desc":"재료·맛·먹는 법을 한국어 한 줄","price_yen":원문 가격}]}
규칙:
- ko: 한국어 이름 + 필요하면 일본어 발음 괄호 (예: 冷奴 → 히야얏코(차가운 두부), 醤油 → 간장, 〆 → 마무리 식사).
- desc: 이름을 반복하지 말고 무엇이 들어가고 어떤 맛인지/어떻게 먹는지 15~40자로. 확실하지 않으면 "~로 보임"이라고 써.
- 제목·안내문 줄은 ko에 번역, desc에 뜻을 짧게.
- 읽기 오류로 보이는 글자(예: メの → 〆の)는 문맥에 맞게 바로잡아.`;

const TR_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          ja: { type: 'string' },
          ko: { type: 'string' },
          desc: { type: 'string' },
          price_yen: { type: ['number', 'null'] },
        },
        required: ['ja', 'ko', 'desc'],
      },
    },
  },
  required: ['summary', 'items'],
};

const parseJson = (v: unknown): Record<string, unknown> | null => {
  if (v && typeof v === 'object') return v as Record<string, unknown>;
  if (typeof v !== 'string') return null;
  const m = /\{[\s\S]*\}/.exec(v);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
};

interface Item {
  ja: string;
  ko: string;
  desc?: string;
  price_yen?: number | null;
}

function normalize(raw: unknown, type: string): { type: string; summary: string; items: Item[] } | null {
  const o = parseJson(raw);
  if (!o) return null;
  const items = Array.isArray(o.items)
    ? (o.items as Record<string, unknown>[])
        .filter((i) => i && typeof i.ko === 'string')
        .map((i) => ({
          ja: String(i.ja ?? ''),
          ko: String(i.ko),
          desc: typeof i.desc === 'string' ? i.desc : undefined,
          price_yen: typeof i.price_yen === 'number' ? i.price_yen : null,
        }))
    : [];
  return { type, summary: typeof o.summary === 'string' ? o.summary : '', items };
}

const toBase64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/** POST /translate (body: image/jpeg) */
export async function translate(req: Request, env: Env, member: string) {
  const type = req.headers.get('Content-Type') ?? '';
  if (!type.startsWith('image/')) throw new HttpError(415, '이미지를 보내 주세요');
  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0) throw new HttpError(400, '이미지가 비었어요');
  if (buf.byteLength > MAX_BYTES) throw new HttpError(413, '이미지가 너무 커요');
  await bumpUsage(env, member, jstDate(), 'translate', DAILY_LIMIT);

  const run = (model: string, input: unknown) =>
    env.AI.run(model as Parameters<Ai['run']>[0], input as never) as Promise<{ response?: unknown }>;

  const ocr = await run(VISION_MODEL, {
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: OCR_PROMPT },
          { type: 'image_url', image_url: { url: `data:${type};base64,${toBase64(buf)}` } },
        ],
      },
    ],
    response_format: { type: 'json_schema', json_schema: OCR_SCHEMA },
    max_tokens: 1500,
    temperature: 0,
  });
  const read = parseJson(ocr.response);
  const lines = Array.isArray(read?.lines) ? (read!.lines as { ja?: unknown; price_yen?: unknown }[]).filter((l) => typeof l.ja === 'string' && l.ja.trim()) : [];
  const kind = typeof read?.type === 'string' ? read.type : 'other';
  if (lines.length === 0) return json({ type: kind, summary: '', items: [] });

  const tr = await run(TEXT_MODEL, {
    messages: [
      { role: 'system', content: TR_PROMPT },
      { role: 'user', content: JSON.stringify({ type: kind, lines }) },
    ],
    response_format: { type: 'json_schema', json_schema: TR_SCHEMA },
    max_tokens: 2048,
    temperature: 0.2,
  });
  const parsed = normalize(tr.response, kind);
  if (!parsed || parsed.items.length === 0) {
    return json({ type: kind, summary: '', items: [], raw: lines.map((l) => `${l.ja}${typeof l.price_yen === 'number' ? `  ¥${l.price_yen}` : ''}`).join('\n') });
  }
  return json(parsed);
}
