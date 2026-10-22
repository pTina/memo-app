import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

if (!existsSync('.env.admin.local')) {
  writeFileSync('.env.admin.local', 'VITE_AUTH_BYPASS=true\nVITE_USE_EMULATOR=true\nVITE_USE_AUTH_EMULATOR=true\n');
} else {
  await import('./ensure-admin-env.mjs');
}

const emulators = spawn('npx', ['firebase', 'emulators:start', '--only', 'auth,firestore', '--project', 'demo-memo-app'], {
  stdio: 'inherit',
  shell: false,
});

async function waitForAuth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      await fetch('http://127.0.0.1:9099');
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

const vite = await waitForAuth().then(() => spawn('npx', ['vite', '--mode', 'admin'], {
  stdio: 'inherit',
  shell: false,
}));

function stop() {
  vite.kill('SIGTERM');
  emulators.kill('SIGTERM');
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

vite.on('exit', (code) => {
  emulators.kill('SIGTERM');
  process.exit(code ?? 0);
});
