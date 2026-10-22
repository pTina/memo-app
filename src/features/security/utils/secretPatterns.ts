export const secretPatterns = [
  { name: 'Google / Firebase API 키', source: 'AIza[0-9A-Za-z_\\-]{35}' },
  { name: 'GitHub 토큰', source: 'gh[pousr]_[0-9A-Za-z]{36,}' },
  { name: 'OpenAI / Anthropic 키', source: 'sk-(ant-)?[0-9A-Za-z_\\-]{20,}' },
  { name: 'AWS 액세스 키', source: 'AKIA[0-9A-Z]{16}' },
  { name: 'JWT', source: 'eyJ[\\w-]+\\.[\\w-]+\\.[\\w-]+' },
  { name: '개인키 블록', source: '-----BEGIN [A-Z ]*PRIVATE KEY-----' },
  { name: '.env 형식 할당', source: '\\b(?:(?:API|SECRET|TOKEN|PASSWORD|KEY)[A-Z0-9_]*|(?:api|secret|token|password|key)_[a-z0-9_]+)[ \\t]*[=:][ \\t]*\\S{8,}' },
];

export function secretRegexes() {
  return secretPatterns.map((pattern) => ({
    name: pattern.name,
    regex: new RegExp(pattern.source, pattern.name.includes('.env') ? 'g' : 'g'),
  }));
}