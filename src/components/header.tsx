'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="SiteHeader sticky top-0 mb-4 w-full z-50 backdrop-blur-md bg-background/50">
      <div className="border-b border-dark-800/50 py-1.5">
        <div className="container mx-auto h-14 flex flex-row items-center justify-between">
          <div className="Logo lg:w-3/12"></div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
