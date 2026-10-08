export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2';

export type FontFile = {
  id: string;
  name: string;
  format: FontFormat;
  size: number;
  blob: Blob;
  createdAt: string;
};
