import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { finishGoogleRedirect, loginErrorMessage } from '../utils/googleLogin';
import { getFirebaseAuth, usesCloudStorage } from '@/shared/lib/firebase';

function readUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, (user) => {
      stop();
      resolve(user);
    });
  });
}

export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: readUser,
    enabled: usesCloudStorage(),
    staleTime: Infinity,
  });
}

export function useAuthListener() {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(!usesCloudStorage());

  useEffect(() => {
    if (!usesCloudStorage()) {
      setReady(true);
      return undefined;
    }
    let cancelled = false;
    const auth = getFirebaseAuth();
    const stop = onAuthStateChanged(auth, (user) => {
      queryClient.setQueryData(['auth'], user);
    });
    void finishGoogleRedirect()
      .then((result) => {
        if (cancelled) return;
        if (result?.user) queryClient.setQueryData(['auth'], result.user);
      })
      .catch((error) => {
        if (!cancelled) queryClient.setQueryData(['authError'], loginErrorMessage(error));
      })
      .finally(() => {
        if (cancelled) return;
        queryClient.setQueryData(['auth'], auth.currentUser);
        setReady(true);
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, [queryClient]);

  return ready;
}