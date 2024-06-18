'use client';

import { useEffect } from 'react';
import { useHydrateAtoms } from 'jotai/utils';

import { useRouter } from '@/components/ui/progress-bar';
import { useClearUserAtom, userAtom } from '@/lib/atoms/user';
import { setSentryUser } from '@/lib/sentry/utils';

interface UserProviderProps {
  user?: User;
  children: React.ReactNode;
}

// This component is used to sync initialize the user atom to be used throughout the app
// as well as set the Sentry user context. We need to hydrate the user from the server
// to prevent hydration mismatch errors. Then perform a fetch to get the user and set it
export function UserProvider({ user, children }: UserProviderProps) {
  const router = useRouter();
  const clearUserAtom = useClearUserAtom();
  useHydrateAtoms([[userAtom, user ?? null]]);

  if (!user) {
    router.push('/login');
  }

  useEffect(() => {
    return () => {
      clearUserAtom();
      setSentryUser(null);
    };
  }, []);

  return <>{children}</>;
}
