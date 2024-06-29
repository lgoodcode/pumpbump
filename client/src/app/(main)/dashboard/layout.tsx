import { redirect } from 'next/navigation';
import Link from 'next/link';

import { createServer } from '@/lib/supabase/server';
import { JotaiProvider } from '@/components/jotai-provider';
import { UserProvider } from '@/components/user-provider';
import { QueryProvider } from '@/components/query-provider';
import { UserNav } from '@/components/user-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <JotaiProvider>
      <QueryProvider>
        <UserProvider user={user}>
          <main>
            <header className="SiteHeader sticky top-0 w-full z-50 backdrop-blur-md bg-background/50">
              <div className="border-b border-dark-800/50 px-4 lg:px-8">
                <div className="flex w-full items-center h-14 justify-between">
                  <div>
                    <Link href="/" className="text-2xl block">
                      PumpBump
                    </Link>
                  </div>
                  <div>
                    <UserNav />
                  </div>
                </div>
              </div>
            </header>
            <div className="container mx-auto mt-24">{children}</div>
          </main>
        </UserProvider>
      </QueryProvider>
    </JotaiProvider>
  );
}
