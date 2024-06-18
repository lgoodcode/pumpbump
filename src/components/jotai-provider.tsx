'use client';

import { PropsWithChildren } from 'react';
import { Provider } from 'jotai';

/**
 * The provider is used to clear all atoms by remounting when the user logs out.
 */
export function JotaiProvider({ children }: PropsWithChildren) {
  return <Provider>{children}</Provider>;
}
