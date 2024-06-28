import { useRouter } from "@/components/ui/progress-bar";
import { createClient } from "@/lib/supabase/client";
import { type RegisterUserForm } from "@/lib/schemas/user";

export const useRegister = () => {
  const router = useRouter();
  const supabase = createClient();

  /**
   * The email is just the username appended with a fake email domain. This is
   * because Supabase requires email but, we are making it optional for the user
   */
  return async (data: RegisterUserForm) => {
    const { error } = await supabase.auth.signUp({
      email: data.username + "@fakemail.com",
      password: data.password,
      options: {
        data: {
          username: data.username,
          email: data.email,
        },
      },
    });

    if (error) {
      throw error;
    }

    router.push("/dashboard");
  };
};
