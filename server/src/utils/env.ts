import { load } from "dotenv";

import { IS_PROD } from "@/constants/index.ts";

const dotenv = await load();

export function env(key: string): string {
  const getter = IS_PROD ? Deno.env.get : (key: string) => dotenv[key];
  const value = getter(key);

  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}
