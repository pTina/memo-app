import type { StorageAdapter } from './adapter';
import { localAdapter } from './localAdapter';

// 2단계에서는 이 할당만 Firebase 어댑터로 교체한다.
export const storage: StorageAdapter = localAdapter;
