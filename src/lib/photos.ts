import { useEffect, useSyncExternalStore } from 'react';
import { trip } from '../data/trip';
import { API_URL, apiFetch, getAuth } from './api';
import { timeToMinutes } from './date';
import { exifTakenAt, localIso, resizeImage } from './image';

export interface Photo {
  id: string;
  member: string;
  day: number | null;
  itemId: string | null;
  placeId: string | null;
  takenAt: string | null;
  caption: string | null;
  w: number | null;
  h: number | null;
  origName: string | null;
  origSize: number | null;
  createdAt: string;
  thumbUrl: string;
  origUrl: string | null;
}

export interface UploadJob {
  key: string;
  name: string;
  status: 'wait' | 'up' | 'done' | 'fail';
  error?: string;
  file: File;
  ctx: UploadContext;
}

/** 업로드 위치(일정 카드에서 올리면 그 일정으로 고정) */
export interface UploadContext {
  day?: number | null;
  itemId?: string | null;
  placeId?: string | null;
}

// ───── 간단한 전역 스토어 (앨범·일정·지도가 같은 목록을 공유) ─────
let photos: Photo[] | null = null;
let jobs: UploadJob[] = [];
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export async function refreshPhotos() {
  if (!API_URL || !getAuth()) return;
  loading ??= apiFetch<{ photos: Photo[] }>('/photos')
    .then((d) => {
      photos = d.photos;
      emit();
    })
    .catch(() => {})
    .finally(() => {
      loading = null;
    });
  return loading;
}

export function usePhotos(): Photo[] | null {
  const list = useSyncExternalStore(subscribe, () => photos);
  useEffect(() => {
    if (photos === null) refreshPhotos();
  }, []);
  return list;
}

export function useUploadJobs(): UploadJob[] {
  return useSyncExternalStore(subscribe, () => jobs);
}

/** 촬영 시각으로 여행 일자·일정 항목을 추정 */
function matchSchedule(takenAt: string | null): UploadContext {
  if (!takenAt) return {};
  const [date, time] = takenAt.split('T');
  const day = trip.days.find((d) => d.date === date);
  if (!day) return {};
  const mins = timeToMinutes(time.slice(0, 5));
  let item = undefined as (typeof day.items)[number] | undefined;
  for (const it of day.items) {
    const t = timeToMinutes(it.time);
    if (t !== null && mins !== null && t <= mins) item = it;
  }
  return { day: day.day, itemId: item?.id ?? null, placeId: item?.places[0] ?? null };
}

async function uploadOne(job: UploadJob) {
  const file = job.file;
  const takenAt = (await exifTakenAt(file)) ?? localIso(file.lastModified || Date.now());
  const auto = matchSchedule(takenAt);
  const ctx = { ...auto, ...Object.fromEntries(Object.entries(job.ctx).filter(([, v]) => v !== undefined)) };
  const { blob, w, h } = await resizeImage(file, 1600, 'image/webp', 0.82);
  const form = new FormData();
  form.append('thumb', blob, 'thumb.webp');
  form.append('orig', file, file.name || 'photo.jpg');
  form.append('meta', JSON.stringify({ ...ctx, takenAt, w, h }));
  const p = await apiFetch<Photo>('/photos', { method: 'POST', body: form });
  photos = [...(photos ?? []), p];
}

const setJob = (key: string, patch: Partial<UploadJob>) => {
  jobs = jobs.map((j) => (j.key === key ? { ...j, ...patch } : j));
  emit();
};

let running = 0;
const CONCURRENCY = 2;

function pump() {
  while (running < CONCURRENCY) {
    const next = jobs.find((j) => j.status === 'wait');
    if (!next) break;
    running++;
    setJob(next.key, { status: 'up' });
    uploadOne(next)
      .then(() => setJob(next.key, { status: 'done' }))
      .catch((e) => setJob(next.key, { status: 'fail', error: (e as Error).message }))
      .finally(() => {
        running--;
        pump();
        // 모두 끝나면 완료된 항목 정리
        if (running === 0 && !jobs.some((j) => j.status === 'wait')) {
          jobs = jobs.filter((j) => j.status === 'fail');
          emit();
        }
      });
  }
}

export function uploadPhotos(files: FileList | File[], ctx: UploadContext = {}) {
  const added = [...files]
    .filter((f) => f.type.startsWith('image/'))
    .map((file) => ({ key: crypto.randomUUID(), name: file.name, status: 'wait' as const, file, ctx }));
  jobs = [...jobs, ...added];
  emit();
  pump();
}

export function retryFailed() {
  jobs = jobs.map((j) => (j.status === 'fail' ? { ...j, status: 'wait', error: undefined } : j));
  emit();
  pump();
}

export function dismissFailed() {
  jobs = jobs.filter((j) => j.status !== 'fail');
  emit();
}

export async function deletePhoto(id: string) {
  await apiFetch(`/photos/${id}`, { method: 'DELETE' });
  photos = (photos ?? []).filter((p) => p.id !== id);
  emit();
}

export const downloadUrl = (p: Photo) => (p.origUrl ? `${p.origUrl}&dl=1` : p.thumbUrl);
