import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.cloudfunctions.net https://*.firebaseapp.com https://accounts.google.com",
  "frame-src https://accounts.google.com https://*.firebaseapp.com",
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
    plugins: [react(), tailwindcss(), svgr(), cspPlugin()],
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
