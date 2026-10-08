import { useEffect, useState } from 'react';
import type { FontFile } from '@/shared/types';

const faces = new Map<string, FontFace>();
const blobUrls = new Map<string, string>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function cssFormat(format: FontFile['format']) {
  if (format === 'ttf') return 'truetype';
  if (format === 'otf') return 'opentype';
  return format;
}

export function fontFamilyName(id: string) {
  return `memo-font-${id}`;
}

export function isFontReady(id: string) {
  return faces.has(id);
}

export function subscribeFontReady(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function syncFontFaces(fonts: FontFile[]) {
  const keep = new Set(fonts.map((font) => font.id));
  for (const [id, face] of faces) {
    if (keep.has(id)) continue;
    document.fonts.delete(face);
    faces.delete(id);
    const url = blobUrls.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      blobUrls.delete(id);
    }
  }

  await Promise.all(fonts.map(async (font) => {
    if (faces.has(font.id)) return;
    const url = URL.createObjectURL(font.blob);
    blobUrls.set(font.id, url);
    const face = new FontFace(
      fontFamilyName(font.id),
      `url(${url}) format('${cssFormat(font.format)}')`,
      { display: 'block' },
    );
    try {
      const loaded = await face.load();
      document.fonts.add(loaded);
      faces.set(font.id, loaded);
      notify();
    } catch {
      URL.revokeObjectURL(url);
      blobUrls.delete(font.id);
    }
  }));
}

export function useFontFace(fonts: FontFile[] | undefined) {
  useEffect(() => {
    void syncFontFaces(fonts ?? []);
  }, [fonts]);
}

export function useReadyFontFamily(fontId: string | null) {
  const [displayedId, setDisplayedId] = useState<string | null>(() => (
    fontId && isFontReady(fontId) ? fontId : null
  ));

  useEffect(() => {
    if (!fontId) {
      setDisplayedId(null);
      return undefined;
    }
    function applyIfReady() {
      if (fontId && isFontReady(fontId)) setDisplayedId(fontId);
    }
    applyIfReady();
    return subscribeFontReady(applyIfReady);
  }, [fontId]);

  return displayedId ? `"${fontFamilyName(displayedId)}", var(--font-sans)` : undefined;
}

export function useFontReadyTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeFontReady(() => setTick((value) => value + 1)), []);
  return tick;
}