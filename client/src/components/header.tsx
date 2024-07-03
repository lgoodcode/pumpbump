'use client';

import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 border-b border-accent backdrop-blur-md bg-background md:border-none md:bg-transparent">
      <div className="px-2 py-4 md:px-8">
        <nav className="mx-auto flex flex-row items-center justify-between">
          <Link href="/" className="animate-in fade-in duration-1000">
            <Image
              src="/assets/img/pumpbump_logo.png"
              alt="pumpbump logo"
              width={192}
              height={42}
              priority
            />
          </Link>
          <div className="flex gap-4 animate-in fade-in duration-1000">
            <Button variant="ghost">
              <Link href="/login">Login</Link>
            </Button>
            <Button>
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
