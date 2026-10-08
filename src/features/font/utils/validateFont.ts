import type { FontFile, FontFormat } from '@/shared/types';

export const FONT_MAX_FILE_BYTES = 20 * 1024 * 1024;
export const FONT_MAX_TOTAL_BYTES = 100 * 1024 * 1024;
export const FONT_MAX_COUNT = 20;

const WOFF2_HINT = 'woff2로 변환하면 용량을 줄일 수 있습니다.';

const signatures: Record<FontFormat, number[][]> = {
  ttf: [[0x00, 0x01, 0x00, 0x00], [0x74, 0x72, 0x75, 0x65]],
  otf: [[0x4f, 0x54, 0x54, 0x4f], [0x00, 0x01, 0x00, 0x00]],
  woff: [[0x77, 0x4f, 0x46, 0x46]],
  woff2: [[0x77, 0x4f, 0x46, 0x32]],
};

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function formatFromName(name: string): FontFormat | null {
  const match = name.toLowerCase().match(/\.(ttf|otf|woff2|woff)$/);
  return match ? (match[1] as FontFormat) : null;
}

function matches(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export async function detectFontFormat(file: File, expected: FontFormat): Promise<FontFormat | null> {
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (signatures[expected].some((signature) => matches(bytes, signature))) return expected;
  return null;
}

export async function validateFontFile(file: File, existing: FontFile[]): Promise<{ format: FontFormat } | { error: string }> {
  const format = formatFromName(file.name);
  if (!format) {
    return { error: 'ttf, otf, woff, woff2 파일만 올릴 수 있습니다.' };
  }
  if (file.size > FONT_MAX_FILE_BYTES) {
    return { error: `파일당 용량은 20MB를 넘을 수 없습니다. ${WOFF2_HINT}` };
  }
  if (existing.length >= FONT_MAX_COUNT) {
    return { error: '폰트는 최대 20개까지 저장할 수 있습니다.' };
  }
  const used = existing.reduce((sum, font) => sum + font.size, 0);
  if (used + file.size > FONT_MAX_TOTAL_BYTES) {
    return { error: `폰트 전체 용량은 100MB를 넘을 수 없습니다. ${WOFF2_HINT}` };
  }
  const detected = await detectFontFormat(file, format);
  if (!detected) {
    return { error: '파일 형식이 확장자와 맞지 않습니다.' };
  }
  return { format: detected };
}

export function displayNameFromFile(file: File) {
  return file.name.replace(/\.(ttf|otf|woff2|woff)$/i, '').trim() || '이름 없는 서체';
}