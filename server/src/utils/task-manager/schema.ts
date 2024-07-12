import { z } from "zod";

import { RouteSchema } from "@/constants/types.ts";

// 10 is the minimum to prevent event loop blocking
const TASK_PROCESSING_INTERVAL_MINIMUM = 10;
const TASK_PROCESSING_INTERVAL_MAXIMUM = 10000;

// 300 is the minimum to prevent duplicate transactions in Solana
const TASK_INTERVAL_MINIMUM = 1000;
const TASK_INTERVAL_MAXIMUM = 10000;

/**
 * Must be a positive integer between 10 and 10000
 */
const intervalSchema = {
  body: z.object({
    interval: z.number({
      required_error: "Interval is required",
    }).positive().int().min(TASK_PROCESSING_INTERVAL_MINIMUM)
      .max(TASK_PROCESSING_INTERVAL_MAXIMUM),
  }),
} satisfies RouteSchema;

export type TaskManagerInterval = z.infer<typeof intervalSchema.body>;

const startSchema = {
  body: z.object({
    userId: z.string({
      required_error: "User ID is required",
    }).uuid(),
    runs: z.number({
      required_error: "Number of runs is required",
    }).int().positive().min(1),
    interval: z.number({
      required_error: "Interval is required",
    }).int().positive().min(TASK_INTERVAL_MINIMUM).max(TASK_INTERVAL_MAXIMUM),
  }),
} satisfies RouteSchema;

export type TaskManagerStart = z.infer<typeof startSchema.body>;

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

export type TaskManagerStop = z.infer<typeof stopSchema.body>;

export const taskManagerSchema = {
  interval: intervalSchema,
  start: startSchema,
};
