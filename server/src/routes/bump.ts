import { Hono } from "hono";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { captureException } from "Sentry";

import { RouteData, RouteSchema } from "@/constants/types.ts";
import { validate } from "@/lib/middleware.ts";
import { validateSolAddress } from "@/utils/solana/index.ts";
import { bumpExperiment } from "@/utils/solana/bump/index.ts";
import { BASE_SPLIPPAGE } from "@/constants/index.ts";

export const Bump = new Hono<{ Variables: { data: RouteData } }>();

const bumpSchema = {
  params: {
    tokenAddress: z.string({
      required_error: "Token address is required",
    }).refine(validateSolAddress, { message: "Invalid token address" }),
  },
  body: z.object({
    runs: z.number({ required_error: "Number of runs is required" }).int()
      .positive().min(1),
    amount: z.number({
      required_error: "Amount is required",
    }).positive().min(0.0025),
    fee: z.union([
      z.literal("optimal"),
      z.number().positive().min(0.0001),
    ], {
      required_error: "Fee must be 'optimal' or a positive number",
    }),
    slippage: z.number().positive().min(0.01).default(BASE_SPLIPPAGE),
  }),
} satisfies RouteSchema;

type BumpData = z.infer<typeof bumpSchema.body>;

Bump.post("/:tokenAddress", validate(bumpSchema), async (ctx) => {
  const token = ctx.req.param("tokenAddress");
  const mint = new PublicKey(token);
  const data = ctx.get("data").body as BumpData;

  try {
    const results = await bumpExperiment({ mint, ...data });
    return ctx.json(results);
  } catch (error) {
    console.error(error);
    captureException(error);
    return ctx.json({ error: "An unexpected error occurred" }, 500);
  }
});
