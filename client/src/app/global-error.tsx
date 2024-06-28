'use client';

import { captureException } from '@sentry/nextjs';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function GlobalErrorPage({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    captureException(error);
    console.error(error);
  }, []);

  return (
    <div className="container font-sans mt-32 grid grid-cols-2 gap-8 lg:gap-0">
      <div className="container col-span-2 lg:col-span-1 my-auto space-y-6">
        <div>
          <h1 className="text-4xl font-semibold leading-snug">Something went wrong</h1>
          <p className="text-lg md:pr-12 text-muted-foreground">
            Try reloading the content or navigate to a different page or refresh the page.
          </p>
        </div>
        <div className="flex gap-4">
          {!!reset && <Button onClick={reset}>Reload</Button>}
          <Button>
            <Link href="/dashboard/home">Go Home</Link>
          </Button>
        </div>
      </div>

      <div className="col-span-2 lg:col-span-1 relative">
        <Image
          src="/assets/img/500-dog.png"
          alt="500 error dog with computer - Image by storyset on Freepik"
          width={668}
          height={668}
          priority
        />
      </div>
    </div>
  );
}
