"use client";

import { useSearchParams } from "next/navigation";

import { useRouter } from "@/components/ui/progress-bar";
import { createClient } from "@/lib/supabase/client";
import { formatPath } from "@/lib/utils";
import { type LoginForm } from "@/lib/schemas/user";
import { useSetUserAtom } from "@/lib/atoms/user";

export const useLogin = () => {
  const router = useRouter();
  const supabase = createClient();
  const setUserAtom = useSetUserAtom();
  const searchParams = useSearchParams();
  const query = new URLSearchParams(searchParams.toString());
  const redirectTo = searchParams.get("redirect_to");

  query.delete("redirect_to");

  const redirectUrl = redirectTo
    ? `${formatPath(redirectTo)}${query.toString()}`
    : "/dashboard";

  return async (formData: LoginForm) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email: formData.username + "@fakemail.com",
      password: formData.password,
    });

    if (error) {
      throw error;
    }

    router.push(redirectUrl);
  };
};
