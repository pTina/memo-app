/// <reference types="vite/client" />

declare module '*.svg?react' {
  import type { FunctionComponent, SVGProps } from 'react';
  const Content: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default Content;
}
