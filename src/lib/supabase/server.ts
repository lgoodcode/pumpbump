import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { captureException } from "@sentry/nextjs";
import { Database } from "./database";

export const createServer = () => {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error(error);
            captureException(error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            console.error(error);
            captureException(error);
          }
        },
      },
    },
  );
};
