import { load } from "dotenv";
import { Hono } from "hono";

import { logger } from "./utils/logger.ts";
import { supabase } from "./lib/supabase/client.ts";

const env = await load();
const app = new Hono();

app.use(async (ctx, next) => {
  logger.info(`${ctx.req.method} - ${ctx.req.url}`);
  await next();
});

app.get("/", (ctx) => {
  return ctx.text("Hello Hono!");
});

app.get("/test", async (ctx) => {
  const { data, error } = await supabase.from("users").select("*");
  if (error) {
    return ctx.json(error, 500);
  }
  return ctx.json(data);
});

app.get("/error", () => {
  logger.error("test");
  throw new Error("test");
});

app.notFound((ctx) => {
  return ctx.text("Not Found", 404);
});

app.onError((error, ctx) => {
  console.error(error);
  return ctx.text("Internal Server Error", 500);
});

Deno.serve({ port: parseInt(env.PORT) }, app.fetch);
