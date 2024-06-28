import Link from 'next/link';

interface AuthenticationLayoutProps {
  children: React.ReactNode;
}

export default async function AuthenticationLayout({ children }: AuthenticationLayoutProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-transparent space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-top-7 zoom-in-95 duration-700">
      <Link href="/" className="hover:underline underline-offset-4">
        PumpBump
      </Link>

      {children}
    </div>
  );
}
