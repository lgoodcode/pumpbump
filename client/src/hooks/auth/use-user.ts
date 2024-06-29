import { createClient } from "@/lib/supabase/client";

export const useGetUser = () => {
  const supabase = createClient();
  let user: User | null = null;

  return async function getUser() {
    if (!user) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
    return user;
  };
};
