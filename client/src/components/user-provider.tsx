'use client';

import { useEffect, useCallback } from 'react';
import { useHydrateAtoms } from 'jotai/utils';

import { useRouter } from '@/components/ui/progress-bar';
import { useClearUserAtom, userAtom, useSetUserAtom } from '@/lib/atoms/user';
import { useGetUser } from '@/hooks/auth/use-user';
import { setSentryUser } from '@/lib/sentry/utils';

interface UserProviderProps {
  user: User;
  children: React.ReactNode;
}

// This component is used to sync initialize the user atom to be used throughout the app
// as well as set the Sentry user context. We need to hydrate the user from the server
// to prevent hydration mismatch errors. Then perform a fetch to get the user and set it
export function UserProvider({ user, children }: UserProviderProps) {
  const router = useRouter();
  const clearUserAtom = useClearUserAtom();
  const getUser = useGetUser();
  const setUserAtom = useSetUserAtom();
  useHydrateAtoms([[userAtom, user]]);

  if (!user) {
    router.push('/login');
  }

  const rehydrateUser = useCallback(async () => {
    const fetchedUser = await getUser();
    if (!fetchedUser) {
      router.push('/login');
    }

    setUserAtom(fetchedUser);
    setSentryUser(fetchedUser);
  }, []);

  useEffect(() => {
    rehydrateUser();

    return () => {
      clearUserAtom();
      setSentryUser(null);
    };
  }, []);

  return <>{children}</>;
}
