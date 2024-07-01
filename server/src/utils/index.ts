import { load } from "dotenv";

import { IS_PROD } from "@/constants/index.ts";

export * from "@/utils/logger.ts";

const dotenv = await load();

export function env(key: string) {
  return IS_PROD ? Deno.env.get(key) : dotenv[key];
}
