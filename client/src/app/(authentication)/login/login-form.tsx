'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AuthHelper } from '../auth-helper';
import { loginFormSchema, type LoginForm } from '@/lib/schemas/user';
import { useLogin } from '@/hooks/auth/use-login';

export function LoginForm() {
  const login = useLogin();
  const [serverError, setServerError] = useState('');
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');

    await login(data).catch((error) => {
      console.error(error);
      setServerError(error.message);
    });
  };

  return (
    <>
      <AuthHelper authType="login" />
      <div className="bg-background flex w-full max-w-sm flex-col items-center gap-6 lg:gap-8 rounded-lg md:border-border px-6 md:w-8/12 md:border md:px-8 md:py-6 lg:w-5/12 lg:px-6 xl:w-4/12 xl:py-8 2xl:w-3/12 md:shadow-lg shadow-indigo-400/20">
        <h4 className="font-heading font-medium text-xl tracking-tight">Sign in to your account</h4>

        {serverError && (
          <Alert variant="destructive">
            <AlertTitle>{serverError}</AlertTitle>
          </Alert>
        )}

        <Form {...form}>
          <form className="grid gap-5 w-full" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" loading={form.formState.isSubmitting}>
              Sign In
            </Button>
          </form>
        </Form>

        <div className="space-y-1 text-center">
          <div className="mx-auto">
            <span>Dont&apos;t have an account?</span>{' '}
            <Link href="/register" className="hover:underline underline-offset-4">
              Sign up
            </Link>
          </div>
          {/* <div className="mx-auto">
            <Link href="/forgot-password" className="hover:underline underline-offset-4">
              Forgot your password?
            </Link>
          </div> */}
        </div>
      </div>
    </>
  );
}
