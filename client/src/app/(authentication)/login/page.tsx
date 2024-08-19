import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
