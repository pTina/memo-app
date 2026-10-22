import { deleteDoc, doc, getDoc, getDocs, collection, setDoc, updateDoc } from 'firebase/firestore';
import { gateSecrets } from '@/features/security/utils/secretGate';
import type { Memo, Settings } from '@/shared/types';
import { defaultSettings } from '@/shared/types';
import { getFirebaseAuth, getFirebaseDb } from '../lib/firebase';
import type { StorageAdapter } from './adapter';
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

function isMemo(value: unknown): value is Memo {
  if (!value || typeof value !== 'object') return false;
  const row = value as Memo;
  return typeof row.id === 'string'
    && typeof row.title === 'string'
    && typeof row.plainText === 'string'
    && (row.fontId === null || typeof row.fontId === 'string')
    && typeof row.createdAt === 'string'
    && typeof row.updatedAt === 'string'
    && (row.deletedAt === null || typeof row.deletedAt === 'string')
    && !!row.content && typeof row.content === 'object';
}

async function readSettings(userId: string): Promise<Settings> {
  const snap = await getDoc(doc(getFirebaseDb(), 'users', userId, 'settings', 'default'));
  const data = snap.data();
  return isSettings(data) ? data : defaultSettings;
}

export const firebaseAdapter: StorageAdapter = {
  async listMemos() {
    const snap = await withTimeout(getDocs(collection(getFirebaseDb(), 'users', uid(), 'memos')));
    return snap.docs.map((row) => row.data()).filter(isMemo);
  },

  async getMemo(id) {
    try {
      const snap = await withTimeout(getDoc(doc(getFirebaseDb(), 'users', uid(), 'memos', id)));
      const data = snap.data();
      return isMemo(data) ? data : null;
    } catch {
      return null;
    }
  },

  saveMemo(memo) {
    return enqueue(async () => {
      const userId = uid();
      const snap = await getDoc(doc(getFirebaseDb(), 'users', userId, 'memos', memo.id));
      const existing = snap.data();
      const unchanged = isMemo(existing) && existing.title === memo.title && existing.plainText === memo.plainText;
      const settings = await readSettings(userId);
      const next = unchanged ? memo : await gateSecrets(memo, settings.secretCheck);
      await setDoc(doc(getFirebaseDb(), 'users', userId, 'memos', next.id), next);
    });
  },

  removeMemos(ids) {
    return enqueue(async () => {
      const userId = uid();
      await Promise.all(ids.map((id) => deleteDoc(doc(getFirebaseDb(), 'users', userId, 'memos', id))));
    });
  },

  listFonts() {
    return localAdapter.listFonts();
  },

  saveFont(font) {
    return localAdapter.saveFont(font);
  },

  deleteFont(id) {
    return enqueue(async () => {
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