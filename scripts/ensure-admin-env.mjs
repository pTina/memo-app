import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const path = '.env.admin.local';
const required = [
  'VITE_AUTH_BYPASS=true',
  'VITE_USE_EMULATOR=true',
  'VITE_USE_AUTH_EMULATOR=true',
];

if (!existsSync(path)) {
  writeFileSync(path, `${required.join('\n')}\n`);
  process.exit(0);
}

const current = readFileSync(path, 'utf8');
const missing = required.filter((line) => !current.includes(`${line.split('=')[0]}=`));
if (missing.length > 0) {
  const suffix = current.endsWith('\n') ? '' : '\n';
  writeFileSync(path, `${current}${suffix}${missing.join('\n')}\n`);
}