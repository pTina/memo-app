import type { Memo } from '@/shared/types';
import { detectSecrets, type SecretHit } from './detectSecrets';
import { maskMemoFields } from './maskSecrets';

export class SecretCancelledError extends Error {
  constructor() {
    super('SECRET_CANCELLED');
    this.name = 'SecretCancelledError';
  }
}

export type SecretDecision = 'mask' | 'plain' | 'cancel';

export type SecretPending = {
  memo: Memo;
  hits: SecretHit[];
};

type Pending = SecretPending & {
  resolve: (memo: Memo) => void;
  reject: (error: Error) => void;
};

let pending: Pending | null = null;
const skipCheck = new Set<string>();
const listeners = new Set<(current: SecretPending | null) => void>();

function notify() {
  const view = pending ? { memo: pending.memo, hits: pending.hits } : null;
  for (const listener of listeners) listener(view);
}

export function subscribeSecretGate(listener: (current: SecretPending | null) => void) {
  listeners.add(listener);
  notify();
  return () => {
    listeners.delete(listener);
  };
}

export function resolveSecretGate(decision: SecretDecision) {
  if (!pending) return;
  const current = pending;
  pending = null;
  notify();
  if (decision === 'cancel') {
    current.reject(new SecretCancelledError());
    return;
  }
  if (decision === 'mask') {
    current.resolve(maskMemoFields(current.memo));
    return;
  }
  skipCheck.add(current.memo.id);
  current.resolve(current.memo);
}

export function gateSecrets(memo: Memo, enabled: boolean): Promise<Memo> {
  if (!enabled || skipCheck.has(memo.id)) return Promise.resolve(memo);
  const hits = detectSecrets(memo.title, memo.plainText);
  if (hits.length === 0) return Promise.resolve(memo);
  return new Promise((resolve, reject) => {
    pending = { memo, hits, resolve, reject };
    notify();
  });
}