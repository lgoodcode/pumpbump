import { createClient } from "supabase";

import { env } from "@/utils/index.ts";
import { Database } from "@/lib/supabase/database.ts";
import { MissingEnvVarError } from "@/utils/solana/errors.ts";

const SUPABASE_URL = env("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL) {
  throw new MissingEnvVarError("SUPABASE_URL");
} else if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new MissingEnvVarError("SUPABASE_SERVICE_ROLE_KEY");
}

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
