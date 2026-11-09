import { deleteDoc, deleteField, doc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore';
import { gateSecrets } from '@/features/security/utils/secretGate';
import type { JSONContent } from '@tiptap/core';
import type { FontFile, MemoSummary, Settings } from '@/shared/types';
import { defaultSettings, toMemoSummary } from '@/shared/types';
import { getFirebaseAuth, getFirebaseDb } from '../lib/firebase';
import type { StorageAdapter } from './adapter';
import { deleteFontRemote, downloadFontBlob, uploadFontBlob, usesFontWorker } from './fontWorker';
import { deleteFontBlob, localAdapter } from './localAdapter';

let queue: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T> | T): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(() => undefined, () => undefined);
  return run;
}

function withTimeout<T>(task: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('요청 시간이 초과되었습니다.')), ms);
    task.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function uid() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  return user.uid;
}

function isSettings(value: unknown): value is Settings {
  if (!value || typeof value !== 'object') return false;
  const row = value as Settings;
  return (row.theme === 'system' || row.theme === 'light' || row.theme === 'dark')
    && (row.defaultFontId === null || typeof row.defaultFontId === 'string')
    && typeof row.dateWithTime === 'boolean'
    && (row.sortBy === 'createdAt' || row.sortBy === 'updatedAt')
    && typeof row.secretCheck === 'boolean';
}

function isFontMeta(value: unknown): value is Omit<FontFile, 'blob'> {
  if (!value || typeof value !== 'object') return false;
  const row = value as FontFile;
  const format = row.format;
  return typeof row.id === 'string'
    && typeof row.name === 'string'
    && (format === 'ttf' || format === 'otf' || format === 'woff' || format === 'woff2')
    && typeof row.size === 'number'
    && typeof row.createdAt === 'string';
}

function fontMeta(font: FontFile) {
  return {
    id: font.id,
    name: font.name,
    format: font.format,
    size: font.size,
    createdAt: font.createdAt,
  };
}

function isMemoSummary(value: unknown): value is MemoSummary {
  if (!value || typeof value !== 'object') return false;
  const row = value as MemoSummary;
  return typeof row.id === 'string'
    && typeof row.title === 'string'
    && typeof row.plainText === 'string'
    && (row.fontId === null || typeof row.fontId === 'string')
    && typeof row.createdAt === 'string'
    && typeof row.updatedAt === 'string'
    && (row.deletedAt === null || typeof row.deletedAt === 'string');
}

function emptyDoc(): JSONContent {
  return { type: 'doc', content: [] };
}

function memoRef(userId: string, id: string) {
  return doc(getFirebaseDb(), 'users', userId, 'memos', id);
}

function bodyRef(userId: string, id: string) {
  return doc(getFirebaseDb(), 'users', userId, 'memos', id, 'body', 'current');
}

async function readSettings(userId: string): Promise<Settings> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', userId, 'settings', 'default'));
  const data = snap.data();
  return isSettings(data) ? data : defaultSettings;
}

export const firebaseAdapter: StorageAdapter = {
  listMemos() {
    return enqueue(async () => {
      const snap = await withTimeout(getDocs(collection(getFirebaseDb(), 'users', uid(), 'memos')));
      return snap.docs.map((row) => ({ id: row.id, ...row.data() })).filter(isMemoSummary).map(toMemoSummary);
    });
  },

  getMemo(id) {
    return enqueue(async () => {
      try {
        const userId = uid();
        const snap = await withTimeout(getDoc(memoRef(userId, id)));
        if (!snap.exists()) return null;
        const data = { id: snap.id, ...snap.data() };
        if (!isMemoSummary(data)) return null;
        const legacy = data as MemoSummary & { content?: unknown };
        let content = legacy.content && typeof legacy.content === 'object'
          ? legacy.content as JSONContent
          : emptyDoc();
        try {
          const bodySnap = await withTimeout(getDoc(bodyRef(userId, id)));
          const body = bodySnap.data();
          if (body && typeof body.content === 'object' && body.content) {
            content = body.content as JSONContent;
          }
        } catch {
          // 본문 하위 문서가 없거나 규칙이 아직 없으면 목록 문서의 기존 content를 사용합니다.
        }
        return { ...toMemoSummary(data), content };
      } catch {
        return null;
      }
    });
  },

  saveMemo(memo) {
    return enqueue(async () => {
      const userId = uid();
      const snap = await getDoc(memoRef(userId, memo.id));
      const existing = snap.data();
      const unchanged = isMemoSummary(existing) && existing.title === memo.title && existing.plainText === memo.plainText;
      const settings = await readSettings(userId);
      const next = unchanged ? memo : await gateSecrets(memo, settings.secretCheck);
      const summary = toMemoSummary(next);
      try {
        await setDoc(memoRef(userId, next.id), { ...summary, content: deleteField() });
        await setDoc(bodyRef(userId, next.id), { content: next.content });
      } catch {
        await setDoc(memoRef(userId, next.id), { ...summary, content: next.content });
      }
    });
  },

  patchMemo(id, patch) {
    return enqueue(() => updateDoc(memoRef(uid(), id), patch));
  },

  removeMemos(ids) {
    return enqueue(async () => {
      const userId = uid();
      await Promise.all(ids.flatMap((id) => [
        deleteDoc(bodyRef(userId, id)),
        deleteDoc(memoRef(userId, id)),
      ]));
    });
  },

  async listFonts() {
    const local = await localAdapter.listFonts();
    if (!usesFontWorker()) return local;
    const snap = await withTimeout(getDocs(collection(getFirebaseDb(), 'users', uid(), 'fonts')));
    const metas = snap.docs.map((row) => row.data()).filter(isFontMeta);
    const cached = new Map(local.map((font) => [font.id, font]));
    const listed: FontFile[] = [];
    for (const meta of metas) {
      const hit = cached.get(meta.id);
      if (hit && hit.size === meta.size) {
        listed.push({ ...hit, name: meta.name, format: meta.format });
        continue;
      }
      const blob = await downloadFontBlob(meta.id);
      const font: FontFile = { ...meta, blob };
      await localAdapter.saveFont(font);
      listed.push(font);
    }
    for (const font of local) {
      if (!metas.some((meta) => meta.id === font.id)) listed.push(font);
    }
    return listed;
  },

  saveFont(font) {
    return enqueue(async () => {
      if (usesFontWorker()) {
        const userId = uid();
        const snap = await getDoc(doc(getFirebaseDb(), 'users', userId, 'fonts', font.id));
        const existing = snap.data();
        const sameFile = isFontMeta(existing) && existing.size === font.size;
        if (!sameFile) await uploadFontBlob(font.id, font.blob, font.format);
        await setDoc(doc(getFirebaseDb(), 'users', userId, 'fonts', font.id), fontMeta(font));
      }
      await localAdapter.saveFont(font);
    });
  },

  deleteFont(id) {
    return enqueue(async () => {
      if (usesFontWorker()) {
        await deleteFontRemote(id);
        await deleteDoc(doc(getFirebaseDb(), 'users', uid(), 'fonts', id));
      }
      await deleteFontBlob(id);
      const userId = uid();
      const memos = await getDocs(collection(getFirebaseDb(), 'users', userId, 'memos'));
      await Promise.all(memos.docs.map(async (row) => {
        if (row.data().fontId === id) await updateDoc(row.ref, { fontId: null });
      }));
      const settings = await readSettings(userId);
      if (settings.defaultFontId === id) {
        await setDoc(doc(getFirebaseDb(), 'users', userId, 'settings', 'default'), { ...settings, defaultFontId: null });
      }
    });
  },

  async getSettings() {
    try {
      return await withTimeout(readSettings(uid()));
    } catch {
      return defaultSettings;
    }
  },

  saveSettings(settings) {
    return enqueue(() => setDoc(doc(getFirebaseDb(), 'users', uid(), 'settings', 'default'), settings));
  },
};