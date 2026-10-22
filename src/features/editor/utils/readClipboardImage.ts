const MAX_EDGE = 1200;
const MAX_BYTES = 700_000;

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('이미지를 열지 못했습니다.'));
    image.src = src;
  });
}

export function getClipboardImageFile(data: DataTransfer | null) {
  if (!data) return null;
  for (let index = 0; index < data.items.length; index += 1) {
    const item = data.items[index];
    const imageType = item.type.startsWith('image/');
    if (item.kind !== 'file' && !imageType) continue;
    if (!imageType && item.type !== '') continue;
    const file = item.getAsFile();
    if (!file) continue;
    if (file.type.startsWith('image/')) return file;
    return new File([file], file.name || 'screenshot.png', { type: item.type || 'image/png' });
  }
  for (const file of data.files) {
    if (file.type.startsWith('image/')) return file;
  }
  return null;
}

export async function readClipboardImage(data: DataTransfer | null) {
  const fromEvent = getClipboardImageFile(data);
  if (fromEvent) return fromEvent;
  if (!navigator.clipboard?.read) return null;
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const type = item.types.find((name) => name.startsWith('image/'));
      if (!type) continue;
      const blob = await item.getType(type);
      return new File([blob], 'screenshot.png', { type });
    }
  } catch {
    return null;
  }
  return null;
}

export async function fileToEditorImage(file: File) {
  if (file.type && !file.type.startsWith('image/')) return null;
  const original = await readFile(file);
  const image = await loadImage(original);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return original;
  context.drawImage(image, 0, 0, width, height);
  const jpeg = canvas.toDataURL('image/jpeg', 0.82);
  const next = jpeg.length <= MAX_BYTES || jpeg.length < original.length ? jpeg : original;
  return next.length > MAX_BYTES * 2 ? jpeg : next;
}