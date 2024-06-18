import { useRouter } from "@/components/ui/progress-bar";
import { createClient } from "@/lib/supabase/client";

export const useLogout = () => {
  const router = useRouter();
  const supabase = createClient();

  return async function logout() {
    await supabase.auth.signOut();
    router.refresh(); // Refresh the page to force the server to serve the page
    router.push("/login");
  };
};
