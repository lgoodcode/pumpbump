import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AppProgressBar as ProgressBar } from '@/components/ui/progress-bar';
import { cn } from '@/lib/utils';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body className={cn('font-sans', 'antialiased', inter.variable)}>
        <div className="gradient-bg-image" />
        <ProgressBar
          height="4px"
          color="#6d28d9e6"
          options={{ showSpinner: false }}
          shallowRouting
        />
        {children}
      </body>
    </html>
  );
}
