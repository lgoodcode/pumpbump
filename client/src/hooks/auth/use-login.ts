"use client";

import { useSearchParams } from "next/navigation";

import { useRouter } from "@/components/ui/progress-bar";
import { createClient } from "@/lib/supabase/client";
import { formatPath } from "@/lib/utils";
import { type LoginForm } from "@/lib/schemas/user";

export const useLogin = () => {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const query = new URLSearchParams(searchParams.toString());
  const redirectTo = searchParams.get("redirect_to");

  query.delete("redirect_to");

  const redirectUrl = redirectTo
    ? `${formatPath(redirectTo)}${query.toString()}`
    : "/dashboard";

  return async (formData: LoginForm) => {
    // If the error is from Supabase, display the error message, otherwise, display
    // a generic error message
    let supabaseError = false;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.username + "@fakemail.com",
        password: formData.password,
      });

      if (error) {
        supabaseError = true;
        throw error;
      }

      router.push(redirectUrl);
    } catch (error: any) {
      if (!supabaseError) {
        console.error(error);
        throw new Error("An unexpected error occurred");
      }
      throw error;
    }
  };
};
