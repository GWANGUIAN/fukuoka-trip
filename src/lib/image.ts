/** 긴 변을 maxSide로 줄여 Blob으로 (EXIF 회전은 createImageBitmap이 반영) */
export async function resizeImage(file: Blob, maxSide: number, type: 'image/webp' | 'image/jpeg', quality: number) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  let blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, quality));
  // 사파리 일부 버전은 webp 인코딩을 못 해 png로 돌려준다 → jpeg로 재시도
  if (!blob || (type === 'image/webp' && blob.type !== 'image/webp')) {
    blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
  }
  if (!blob) throw new Error('이미지 변환에 실패했어요');
  return { blob, w, h };
}

/** JPEG EXIF DateTimeOriginal → 'YYYY-MM-DDTHH:mm:ss' (없으면 null) */
export async function exifTakenAt(file: Blob): Promise<string | null> {
  try {
    const buf = new DataView(await file.slice(0, 128 * 1024).arrayBuffer());
    if (buf.getUint16(0) !== 0xffd8) return null;
    let off = 2;
    while (off + 4 < buf.byteLength) {
      const marker = buf.getUint16(off);
      const len = buf.getUint16(off + 2);
      if (marker === 0xffe1 && buf.getUint32(off + 4) === 0x45786966) return readTiff(buf, off + 10);
      off += 2 + len;
    }
  } catch {
    /* 형식이 다르면 무시 */
  }
  return null;
}

function readTiff(v: DataView, start: number): string | null {
  const le = v.getUint16(start) === 0x4949;
  const u16 = (o: number) => v.getUint16(start + o, le);
  const u32 = (o: number) => v.getUint32(start + o, le);
  const findTag = (ifd: number, tag: number): number | null => {
    const n = u16(ifd);
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12;
      if (u16(e) === tag) return e;
    }
    return null;
  };
  const exifPtr = findTag(u32(4), 0x8769);
  if (exifPtr === null) return null;
  const dt = findTag(u32(exifPtr + 8), 0x9003);
  if (dt === null) return null;
  const at = u32(dt + 8);
  let s = '';
  for (let i = 0; i < 19; i++) s += String.fromCharCode(v.getUint8(start + at + i));
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null;
}

/** File.lastModified → 로컬 'YYYY-MM-DDTHH:mm:ss' */
export function localIso(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
