'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { LogOut, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/hooks/auth/use-logout';
import { useAsyncUserAtom } from '@/lib/atoms/user';

const UserNavSuspense = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Skeleton className="rounded-full w-11 h-10 border-border" />
      </DropdownMenuTrigger>
    </DropdownMenu>
  );
};

const UserNavContent = () => {
  const user = useAtomValue(useAsyncUserAtom);
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-full px-2.5 border-border">
          <User />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col py-2">
            <p className="text-[1.125rem] font-medium leading-none truncate">
              {user.user_metadata.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <User className="mr-2 h-5 w-5" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-5 w-5" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function UserNav() {
  return (
    <Suspense fallback={<UserNavSuspense />}>
      <UserNavContent />
    </Suspense>
  );
}
