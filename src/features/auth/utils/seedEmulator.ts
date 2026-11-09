import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import type { Memo } from '@/shared/types';
import { toMemoSummary } from '@/shared/types';
import { getFirebaseDb } from '@/shared/lib/firebase';
import seed from '../../../../firebase/emulator-seed/memos.json';

export async function seedEmulatorIfEmpty(uid: string) {
  const db = getFirebaseDb();
  const memos = collection(db, 'users', uid, 'memos');
  const existing = await getDocs(memos);
  if (!existing.empty) return;
  await Promise.all((seed as Memo[]).map(async (memo) => {
    await setDoc(doc(memos, memo.id), toMemoSummary(memo));
    await setDoc(doc(db, 'users', uid, 'memos', memo.id, 'body', 'current'), { content: memo.content });
  }));
}
