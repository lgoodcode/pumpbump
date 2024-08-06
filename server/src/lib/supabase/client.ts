import { createClient } from "supabase";

import { env } from "@/utils/env.ts";
import { Database } from "@/lib/supabase/database.ts";

const SUPABASE_URL = env("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    // Store the session in memory
    auth: {
      persistSession: false,
    },
  },
);
