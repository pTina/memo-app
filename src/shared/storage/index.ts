import { usesCloudStorage } from '../lib/firebase';
import type { StorageAdapter } from './adapter';
import { firebaseAdapter } from './firebaseAdapter';
import { localAdapter } from './localAdapter';

export const storage: StorageAdapter = usesCloudStorage() ? firebaseAdapter : localAdapter;