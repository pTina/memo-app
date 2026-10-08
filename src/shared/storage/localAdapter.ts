import { createStore, del, entries, set } from 'idb-keyval';
import type { FontFile, Memo, Settings } from '@/shared/types';
import { defaultSettings } from '@/shared/types';
import type { StorageAdapter } from './adapter';
import { FONT_DB_NAME, FONT_STORE_NAME, STORAGE_VERSION, storageKeys } from './keys';

const fontStore = createStore(FONT_DB_NAME, FONT_STORE_NAME);

let queue: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T> | T): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(() => undefined, () => undefined);
  return run;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isMemo(value: unknown): value is Memo {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.plainText === 'string'
    && (value.fontId === null || typeof value.fontId === 'string')
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string'
    && (value.deletedAt === null || typeof value.deletedAt === 'string')
    && isRecord(value.content);
}

function isSettings(value: unknown): value is Settings {
  if (!isRecord(value)) return false;
  return (value.theme === 'system' || value.theme === 'light' || value.theme === 'dark')
    && (value.defaultFontId === null || typeof value.defaultFontId === 'string')
    && typeof value.dateWithTime === 'boolean'
    && (value.sortBy === 'createdAt' || value.sortBy === 'updatedAt')
    && typeof value.secretCheck === 'boolean';
}

function isFontFile(value: unknown): value is FontFile {
  if (!isRecord(value)) return false;
  const format = value.format;
  return typeof value.id === 'string'
    && typeof value.name === 'string'
    && (format === 'ttf' || format === 'otf' || format === 'woff' || format === 'woff2')
    && typeof value.size === 'number'
    && value.blob instanceof Blob
    && typeof value.createdAt === 'string';
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function readMemos(): Memo[] {
  const parsed = readJson(storageKeys.memos);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isMemo);
}

function writeMemos(memos: Memo[]) {
  localStorage.setItem(storageKeys.memos, JSON.stringify(memos));
  localStorage.setItem(storageKeys.version, STORAGE_VERSION);
}

function updateMemosNow(updater: (memos: Memo[]) => Memo[]) {
  writeMemos(updater(readMemos()));
}

export function readSettingsSync(): Settings {
  if (typeof localStorage === 'undefined') return defaultSettings;
  const parsed = readJson(storageKeys.settings);
  if (!isSettings(parsed)) return defaultSettings;
  return parsed;
}

function writeSettings(settings: Settings) {
  localStorage.setItem(storageKeys.settings, JSON.stringify(settings));
  localStorage.setItem(storageKeys.version, STORAGE_VERSION);
}

export const localAdapter: StorageAdapter = {
  listMemos() {
    return enqueue(() => readMemos());
  },

  getMemo(id) {
    return enqueue(() => readMemos().find((memo) => memo.id === id) ?? null);
  },

  saveMemo(memo) {
    return enqueue(() => {
      updateMemosNow((memos) => {
        const index = memos.findIndex((item) => item.id === memo.id);
        if (index === -1) return [...memos, memo];
        const next = memos.slice();
        next[index] = memo;
        return next;
      });
    });
  },

  removeMemos(ids) {
    const idSet = new Set(ids);
    return enqueue(() => {
      updateMemosNow((memos) => memos.filter((memo) => !idSet.has(memo.id)));
    });
  },

  listFonts() {
    return enqueue(async () => {
      const rows = await entries<string, unknown>(fontStore);
      return rows.map(([, value]) => value).filter(isFontFile);
    });
  },

  saveFont(font) {
    if (!(font.blob instanceof Blob)) {
      return Promise.reject(new Error('폰트 파일이 없습니다.'));
    }
    return enqueue(() => set(font.id, font, fontStore));
  },

  deleteFont(id) {
    return enqueue(async () => {
      await del(id, fontStore);
      updateMemosNow((memos) => memos.map((memo) => (
        memo.fontId === id ? { ...memo, fontId: null } : memo
      )));
      const settings = readSettingsSync();
      if (settings.defaultFontId === id) {
        writeSettings({ ...settings, defaultFontId: null });
      }
    });
  },

  getSettings() {
    return enqueue(() => readSettingsSync());
  },

  saveSettings(settings) {
    return enqueue(() => {
      writeSettings(settings);
    });
  },
};
