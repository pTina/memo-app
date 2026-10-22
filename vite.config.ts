import { copyFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://*.gstatic.com https://*.googleapis.com https://*.firebaseapp.com",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com https://www.gstatic.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://*.gstatic.com https://*.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.cloudfunctions.net https://*.firebaseapp.com https://accounts.google.com https://apis.google.com",
  "frame-src https://accounts.google.com https://*.firebaseapp.com https://apis.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com https://*.firebaseapp.com",
  "frame-ancestors 'none'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'production-csp',
    apply: 'build',
    transformIndexHtml(html) {
      const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`;
      return html.replace('<head>', `<head>\n    ${meta}`);
    },
  };
}

function githubPagesSpa(): Plugin {
  return {
    name: 'github-pages-spa',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist');
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
      writeFileSync(resolve(outDir, '.nojekyll'), '');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (mode === 'production' && env.VITE_AUTH_BYPASS === 'true') {
    throw new Error('production 빌드에는 VITE_AUTH_BYPASS를 설정할 수 없습니다.');
  }
  if (mode === 'production' && env.VITE_USE_EMULATOR === 'true') {
    throw new Error('production 빌드에는 VITE_USE_EMULATOR를 설정할 수 없습니다.');
  }
  if (mode === 'production' && env.VITE_USE_AUTH_EMULATOR === 'true') {
    throw new Error('production 빌드에는 VITE_USE_AUTH_EMULATOR를 설정할 수 없습니다.');
  }

  const coop = { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' };

  return {
    base: mode === 'production' ? '/memo-app/' : '/',
    plugins: [react(), tailwindcss(), svgr(), cspPlugin(), githubPagesSpa()],
    server: { headers: coop },
    preview: { headers: coop },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      sourcemap: false,
    },
  };
});
