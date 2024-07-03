import { Hono } from "hono";
import { captureException } from "Sentry";

import "@/utils/instrumentation.ts";
import { IS_PROD } from "@/constants/index.ts";
import { logger } from "@/utils/index.ts";
import { authentication, logging, swagger } from "@/lib/middleware.ts";
import { Wallet } from "@/routes/wallet.ts";
import { Bump } from "@/routes/bump.ts";

const app = new Hono();

app.use(logging);
app.use(authentication);

// SwaggerUI API documentation - only available in development via authMiddleware
app.get("/docs", swagger);

app.route("/wallet", Wallet);
app.route("/bump", Bump);

app.notFound((ctx) => {
  logger.error(ctx.error);
  return ctx.text("Not Found", 404);
});

app.onError((error, ctx) => {
  logger.error(error);
  captureException(error);
  return ctx.text("An unexpected error occurred", 500);
});

// Hard coded port since it'll be HTTPS only in production
Deno.serve({ port: IS_PROD ? 443 : 4000 }, app.fetch);
