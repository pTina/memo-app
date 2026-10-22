/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_AUTH_BYPASS?: string;
  readonly VITE_USE_EMULATOR?: string;
  readonly VITE_USE_AUTH_EMULATOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg?react' {
  import type { FunctionComponent, SVGProps } from 'react';
  const Content: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default Content;
}
