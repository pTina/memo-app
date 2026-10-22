import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const patterns = [
  { name: 'Google / Firebase API 키', source: 'AIza[0-9A-Za-z_\\-]{35}' },
  { name: 'GitHub 토큰', source: 'gh[pousr]_[0-9A-Za-z]{36,}' },
  { name: 'OpenAI / Anthropic 키', source: 'sk-(ant-)?[0-9A-Za-z_\\-]{20,}' },
  { name: 'AWS 액세스 키', source: 'AKIA[0-9A-Z]{16}' },
  { name: 'JWT', source: 'eyJ[\\w-]+\\.[\\w-]+\\.[\\w-]+' },
  { name: '개인키 블록', source: '-----BEGIN [A-Z ]*PRIVATE KEY-----' },
  { name: '.env 형식 할당', source: '\\b(?:(?:API|SECRET|TOKEN|PASSWORD|KEY)[A-Z0-9_]*|(?:api|secret|token|password|key)_[a-z0-9_]+)[ \\t]*[=:][ \\t]*\\S{8,}' },
];

const skip = new Set([
  'scripts/check-secrets.mjs',
  '.gitleaks.toml',
  '.env.example',
  '.env.admin',
  'docs/요구사항정의서.md',
  'src/features/security/utils/secretPatterns.ts',
  'package-lock.json',
]);

function stagedFiles() {
  const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
  return output.split('\n').map((line) => line.trim()).filter(Boolean);
}

const textFile = /\.(tsx?|jsx?|mjs|cjs|css|html|json|ya?ml|md|toml|txt)$/;
let failed = false;

for (const file of stagedFiles()) {
  if (skip.has(file) || file.startsWith('node_modules/') || file.startsWith('dist/')) continue;
  if (!textFile.test(file) && !file.includes('.env')) continue;
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const pattern of patterns) {
    const re = new RegExp(pattern.source, pattern.flags);
    if (re.test(text)) {
      console.error(`${file}: ${pattern.name} 패턴이 있습니다. 비밀값은 커밋하지 마세요.`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
