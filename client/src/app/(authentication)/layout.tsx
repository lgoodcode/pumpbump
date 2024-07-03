import Link from 'next/link';
import Image from 'next/image';

interface AuthenticationLayoutProps {
  children: React.ReactNode;
}

export default async function AuthenticationLayout({ children }: AuthenticationLayoutProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-transparent space-y-8 lg:space-y-10 animate-in fade-in slide-in-from-top-7 zoom-in-95 duration-700">
      <Link href="/">
        <Image
          src="/assets/img/pumpbump_logo.png"
          alt="pumpbump logo"
          width={224}
          height={48}
          priority
        />
      </Link>

      {children}
    </div>
  );
}
