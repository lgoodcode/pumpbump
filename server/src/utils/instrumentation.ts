import * as Sentry from "Sentry";

import { IS_PROD } from "@/constants/index.ts";
import { env } from "@/utils/env.ts";

// Hack in order to fix `Deno.permissions.querySync` not being defined
// https://github.com/denoland/deploy_feedback/issues/527
if (!Deno.permissions.querySync) {
  (Deno.permissions as unknown as Record<string, unknown>)["querySync"] = (
    _pd: Deno.PermissionDescriptor,
  ): { state: string } => ({ state: "granted" });
}

if (IS_PROD) {
  Sentry.init({ dsn: env("SENTRY_DSN") });
}
