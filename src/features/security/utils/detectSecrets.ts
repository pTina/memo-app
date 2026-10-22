import { secretRegexes } from './secretPatterns';

export type SecretHit = {
  field: 'title' | 'plainText';
  name: string;
};

export function detectSecrets(title: string, plainText: string): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const { name, regex } of secretRegexes()) {
    if (new RegExp(regex.source).test(title)) hits.push({ field: 'title', name });
    if (new RegExp(regex.source).test(plainText)) hits.push({ field: 'plainText', name });
  }
  return hits;
}