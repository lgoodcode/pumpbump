import { load } from "dotenv";
import { createClient } from "supabase";
import { Database } from "./database.ts";

const env = await load();
const IS_PROD = Deno.env.get("PROD") === "true";

const SUPABASE_URL = IS_PROD ? Deno.env.get("SUPABASE_URL") : env["SUPABASE_URL"];
const SUPABASE_SERVICE_ROLE_KEY = IS_PROD
  ? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  : env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is missing");
} else if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  // Store the session in memory
  auth: {
    persistSession: false,
  },
});
