'use client';

import { Fragment } from 'react';
import { Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogin } from '@/hooks/auth/use-login';
import { useRegister } from '@/hooks/auth/use-register';

interface AuthHelperProps {
  authType: 'login' | 'register';
}

type TestUser = {
  username: string;
  email?: string;
  password: string;
};

const TEST_USERS: TestUser[] = [
  {
    username: 'cryptobumper42',
    email: 'cryptobumper42@mail.com',
    password: 'Password123$',
  },
  {
    username: 'testuser',
    password: 'Password123$',
  },
];

const TestUsers = ({ authType }: AuthHelperProps) => {
  const login = useLogin();
  const register = useRegister();

  const handleClick = (user: TestUser) => {
    if (authType === 'login') {
      login({ username: user.username, password: user.password });
    } else {
      register({
        username: user.username,
        email: user.email,
        password: user.password,
        confirm_password: user.password,
      });
    }
  };

  return (
    <>
      {TEST_USERS.map((user, i) => (
        <Fragment key={user.username}>
          <DropdownMenuItem onClick={() => handleClick(user)}>
            <div className="flex flex-col space-y-1">
              <p className="font-medium leading-none">{user.username}</p>
              {authType === 'register' && (
                <p className="text-sm truncate text-muted-foreground">{user.email}</p>
              )}
            </div>
          </DropdownMenuItem>
          {i !== TEST_USERS.length - 1 && <DropdownMenuSeparator />}
        </Fragment>
      ))}
    </>
  );
};

export function AuthHelper({ authType }: AuthHelperProps) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed scroll-[unset] bottom-4 right-4 z-50 flex items-center justify-center rounded-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-14 h-14 rounded-full">
            <span className="sr-only">Auth helper</span>
            <div className="block p-1">
              <Users />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 max-h-[600px] overflow-y-auto" align="end">
          <TestUsers authType={authType} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
