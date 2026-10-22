import { getFirebaseAuth, usesCloudStorage } from '../lib/firebase';
import type { FontFormat } from '../types';

function envText(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, '') ?? '';
}

export function fontWorkerUrl() {
  return envText(import.meta.env.VITE_FONT_WORKER_URL).replace(/\/$/, '');
}

function isLocalHost() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export function usesFontWorker() {
  return usesCloudStorage() && Boolean(fontWorkerUrl()) && !isLocalHost();
}

async function authHeader() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function uploadFontBlob(id: string, blob: Blob, format: FontFormat) {
  const res = await fetch(`${fontWorkerUrl()}/fonts/${id}`, {
    method: 'PUT',
    headers: {
      ...await authHeader(),
      'Content-Type': blob.type || 'application/octet-stream',
      'X-Font-Format': format,
    },
    body: blob,
  });
  if (res.status !== 204) throw new Error('폰트를 클라우드에 올리지 못했습니다. 워커 코드가 배포됐는지 확인하세요.');
}

export async function downloadFontBlob(id: string): Promise<Blob> {
  const res = await fetch(`${fontWorkerUrl()}/fonts/${id}`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error('폰트를 불러오지 못했습니다.');
  return res.blob();
}

export async function deleteFontRemote(id: string) {
  const res = await fetch(`${fontWorkerUrl()}/fonts/${id}`, {
    method: 'DELETE',
    headers: await authHeader(),
  });
  if (!res.ok && res.status !== 404) throw new Error('클라우드 폰트를 삭제하지 못했습니다.');
}
