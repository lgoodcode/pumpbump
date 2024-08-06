import { z } from "zod";

import {
  BUMP_AMOUNT_MAXIMUM,
  BUMP_AMOUNT_MINIMUM,
  BUMP_FEE_MAXIMUM,
  BUMP_FEE_MINIMUM,
  BUMP_INTERVAL_MAXIMUM,
  BUMP_INTERVAL_MINIMUM,
  BUMP_RUNS_MAXIMUM,
  BUMP_RUNS_MINIMUM,
  BUMP_SPLIPPAGE_DEFAULT,
  BUMP_SPLIPPAGE_MAXIMUM,
  BUMP_SPLIPPAGE_MINIMUM,
} from "@/constants/index.ts";
import { validateSolAddress } from "@/utils/solana/index.ts";

export const bumpSchema = z.object({
  userId: z.string({
    required_error: "User ID is required",
  }).uuid(),
  tokenAddress: z.string({
    required_error: "Token address is required",
  }).refine(validateSolAddress, { message: "Invalid token address" }),
  runs: z.number({
    required_error: "Number of runs is required",
  }).int().min(
    BUMP_RUNS_MINIMUM,
    `Minimum number of runs is ${BUMP_RUNS_MINIMUM}`,
  ).max(BUMP_RUNS_MAXIMUM, `Maximum number of runs is ${BUMP_RUNS_MAXIMUM}`),
  interval: z.number({
    required_error: "Interval is required",
  }).int().min(
    BUMP_INTERVAL_MINIMUM,
    `Minimum interval is ${BUMP_INTERVAL_MINIMUM}`,
  ).max(BUMP_INTERVAL_MAXIMUM, `Maximum interval is ${BUMP_INTERVAL_MAXIMUM}`),
  amount: z.number({
    required_error: "Amount is required",
  }).min(BUMP_AMOUNT_MINIMUM, `Minimum amount is ${BUMP_AMOUNT_MINIMUM}`).max(
    BUMP_AMOUNT_MAXIMUM,
    `Maximum amount is ${BUMP_AMOUNT_MAXIMUM}`,
  ),
  slippage: z.number().min(
    BUMP_SPLIPPAGE_MINIMUM,
    `Minimum slippage is ${BUMP_SPLIPPAGE_MINIMUM}`,
  ).max(BUMP_SPLIPPAGE_MAXIMUM, `Maximum slippage is ${BUMP_SPLIPPAGE_MAXIMUM}`)
    .default(
      BUMP_SPLIPPAGE_DEFAULT,
    ),
  fee: z.union([
    z.literal("optimal"),
    z.number().min(BUMP_FEE_MINIMUM, `Minimum fee is ${BUMP_FEE_MINIMUM}`).max(
      BUMP_FEE_MAXIMUM,
      `Maximum fee is ${BUMP_FEE_MAXIMUM}`,
    ),
  ], {
    required_error:
      `Fee must be 'optimal' or a positive number between ${BUMP_FEE_MINIMUM} and ${BUMP_FEE_MAXIMUM}`,
  }),
});

export type BumpSchema = z.infer<typeof bumpSchema>;
