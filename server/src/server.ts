import { Hono } from "hono";
import { captureException } from "Sentry";

import "@/utils/instrumentation.ts";
import { IS_PROD } from "@/constants/index.ts";
import { logger } from "@/utils/logger.ts";
import { authentication, logging, swagger } from "@/lib/middleware.ts";
import { Wallet } from "@/routes/wallet.ts";
import { TestBump } from "@/routes/test-bump.ts";
import { BumpTask } from "@/routes/bump-task.ts";

try {
  const app = new Hono();

  app.use(logging);
  app.use(authentication);

  // SwaggerUI API documentation - only available in development via authMiddleware
  app.get("/docs", swagger);

  app.route("/wallet", Wallet);
  app.route("/bump", BumpTask);

  if (!IS_PROD) {
    // Bump endpoint only available in development to test Solana transactions
    app.route("/test-bump", TestBump);
  }

  app.notFound((ctx) => {
    const msg = `Route ${ctx.req.path} not found`;
    logger.warn(msg, ctx.error);
    return ctx.json({ error: msg }, 404);
  });

  app.onError((error, ctx) => {
    logger.error(error);
    captureException(error);
    return ctx.json({ error: "An unexpected error occurred" }, 500);
  });

  // Hard coded port since it'll be HTTPS only in production
  Deno.serve({ port: IS_PROD ? 443 : 4000 }, app.fetch);
} catch (error) {
  logger.error(error);
  captureException(error);
}
