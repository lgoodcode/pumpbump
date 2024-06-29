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
import { useRegister } from '@/hooks/auth/use-register';
import { registerUserFormSchema, type RegisterUserForm } from '@/lib/schemas/user';

export function RegisterForm() {
  const register = useRegister();
  const [serverError, setServerError] = useState('');
  const form = useForm<RegisterUserForm>({
    resolver: zodResolver(registerUserFormSchema),
  });

  const onSubmit = async (data: RegisterUserForm) => {
    setServerError('');

    await register(data).catch((error) => {
      console.error(error);
      setServerError(error.message);
    });
  };

  return (
    <>
      <AuthHelper authType="register" />
      <div className="bg-background flex w-full max-w-sm flex-col items-center gap-6 lg:gap-8 rounded-lg md:border-border px-6 md:w-8/12 md:border md:px-8 md:py-6 lg:w-5/12 lg:px-6 xl:w-4/12 xl:py-8 2xl:w-3/12 md:shadow-lg shadow-indigo-400/20">
        <h4 className="font-heading font-medium text-xl tracking-tight">Create an account</h4>

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
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
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
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" loading={form.formState.isSubmitting}>
              Register
            </Button>
          </form>
        </Form>

        <div className="text-center mx-auto">
          <span>Already have an account?</span>{' '}
          <Link href="/login" className="hover:underline underline-offset-4">
            Login
          </Link>
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-bold">Note:</span>{' '}
          <span>
            Email is optional but, is required to be able recover your account. Use at your
            discretion.
          </span>
        </div>
      </div>
    </>
  );
}
