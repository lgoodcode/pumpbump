import { useRouter } from "@/components/ui/progress-bar";
import { type RegisterUserForm } from "@/lib/schemas/user";

export const useRegister = () => {
  const router = useRouter();

  /**
   * The email is just the username appended with a fake email domain. This is
   * because Supabase requires email but, we are making it optional for the user
   *
   * The registration is done in the backend to generate the wallet for the user
   */
  return async (data: RegisterUserForm) => {
    // If the error is from Supabase, display the error message, otherwise, display
    // a generic error message
    let supabaseError = false;

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.status !== 201) {
        const { error, isSupabaseError } = await response.json();
        supabaseError = isSupabaseError || false;

        throw new Error(error);
      }
      router.push("/dashboard");
    } catch (error: any) {
      if (!supabaseError) {
        console.error(error);
        throw new Error("An unexpected error occurred");
      }
      throw error;
    }
  };
};
