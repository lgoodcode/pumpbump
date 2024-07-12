import { z } from "zod";

/**
 * Must be a positive integer between 10 and 10000
 */
const intervalSchema = z.object({
  interval: z.number().positive().int().min(10).max(10000),
});
export type TaskManagerInterval = z.infer<typeof intervalSchema>;

export const taskManagerSchema = {
  interval: intervalSchema,
};
