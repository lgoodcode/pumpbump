import { z } from "zod";

import type { RouteSchema } from "@/constants/types.ts";
import {
  TASK_PROCESSING_INTERVAL_MAXIMUM,
  TASK_PROCESSING_INTERVAL_MINIMUM,
} from "@/constants/index.ts";
import { bumpSchema } from "@/utils/solana/bump/schema.ts";

/**
 * Must be a positive integer between 10 and 10000
 */
const intervalSchema = {
  body: z.object({
    interval: z.number({
      required_error: "Interval is required",
    }).int().min(
      TASK_PROCESSING_INTERVAL_MINIMUM,
      `Minimum interval is ${TASK_PROCESSING_INTERVAL_MINIMUM}`,
    )
      .max(
        TASK_PROCESSING_INTERVAL_MAXIMUM,
        `Maximum interval is ${TASK_PROCESSING_INTERVAL_MAXIMUM}`,
      ),
  }),
} satisfies RouteSchema;

export type TaskManagerInterval = z.infer<typeof intervalSchema.body>;

const createSchema = { body: bumpSchema } satisfies RouteSchema;

export type TaskManagerCreateTask = z.infer<typeof createSchema.body>;

const stopSchema = {
  body: z.object({
    userId: z.string({
      required_error: "User ID is required",
    }).uuid(),
    taskId: z.string({
      required_error: "Task ID is required",
    }).uuid(),
  }),
} satisfies RouteSchema;

export type TaskManagerStopTask = z.infer<typeof stopSchema.body>;

export const taskManagerSchema = {
  interval: intervalSchema,
  create: createSchema,
};
