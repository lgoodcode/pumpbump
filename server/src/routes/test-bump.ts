import { PublicKey } from "@solana/web3.js";
import { captureException } from "Sentry";

import { Hono } from "@/utils/hono.ts";
import { validate } from "@/lib/middleware.ts";
import { bumpExperiment } from "@/utils/solana/bump/index.ts";
import { BumpSchema, bumpSchema } from "@/utils/solana/bump/schema.ts";

export const TestBump = new Hono();

TestBump.post("/:tokenAddress", validate({ body: bumpSchema }), async (ctx) => {
  const token = ctx.req.param("tokenAddress");
  const mint = new PublicKey(token);
  const data = ctx.get("data").body as BumpSchema;

  try {
    const results = await bumpExperiment({ mint, ...data });
    return ctx.json(results);
  } catch (error) {
    console.error(error);
    captureException(error);
    return ctx.json({ error: "An unexpected error occurred" }, 500);
  }
});
