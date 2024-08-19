import { captureException } from "Sentry";

import { Hono } from "@/utils/hono.ts";
import { logger } from "@/utils/logger.ts";
import { validate } from "@/lib/middleware.ts";
import { supabase } from "@/lib/supabase/client.ts";
import { TaskManager } from "@/utils/task-manager/task-manager.ts";
import {
  type TaskManagerCreateTask,
  type TaskManagerInterval,
  taskManagerSchema,
} from "@/utils/task-manager/schema.ts";
import { createClient } from "@/utils/redis.ts";
import { HashSet } from "@/utils/hash-set.ts";
import { Queue } from "@/utils/queue.ts";
import { getKeypairFromBs58, initializeSolana } from "@/utils/solana/index.ts";
import { performBumpTransaction } from "@/utils/solana/bump/index.ts";
import type { CreateTransactionOptions } from "@/constants/types.ts";
import { BUMP_DB } from "@/utils/task-manager/database_actions.ts";
import { TaskRunTracker } from "@/utils/task-manager/task-run-tracker.ts";

export const BumpTask = new Hono();
const redis = await createClient();
const ACTION = "bump";
const taskManager = new TaskManager({
  taskHashSet: new HashSet(redis, "bump-tasks"),
  taskRunTracker: new TaskRunTracker(redis),
  taskIdQueue: new Queue(redis, "bump-tasks-queue"),
  taskDb: BUMP_DB,
  actions: new Map().set(ACTION, executeBumpTransaction),
});

const { connection, feeRecipientPubkey, program } = initializeSolana();

type ExecuteSolanaTransactionParams = CreateTransactionOptions & {
  userSecretKey: string;
  tokenAddress: string;
};

async function executeBumpTransaction(
  { userSecretKey, tokenAddress, amount, fee, slippage }:
    ExecuteSolanaTransactionParams,
): Promise<boolean> {
  try {
    await performBumpTransaction(
      connection,
      feeRecipientPubkey,
      getKeypairFromBs58(userSecretKey),
      program,
      tokenAddress,
      {
        amount,
        slippage,
        fee,
      },
    );
    return true;
  } catch (error) {
    logger.error(error);
    captureException(error, {
      level: "warning",
      extra: {
        tokenAddress,
        options: {
          amount,
          slippage,
          fee,
        },
      },
    });
    return false;
  }
}

BumpTask.get("/processing", (ctx) => {
  return ctx.json({ processing: taskManager.isProcessing() });
});

BumpTask.get("/interval", (ctx) => {
  return ctx.json({ interval: taskManager.interval });
});

BumpTask.post(
  "/interval",
  validate(taskManagerSchema.interval),
  (ctx) => {
    const { interval } = ctx.get("data").body as TaskManagerInterval;
    taskManager.interval = interval;
    return ctx.body(null, 201);
  },
);

BumpTask.get("/list", async (ctx) => {
  return ctx.json(await taskManager.getTaskKeys());
});

BumpTask.post("/create", validate(taskManagerSchema.create), async (ctx) => {
  const { userId, tokenAddress, runs, interval, amount, slippage, fee } = ctx
    .get("data")
    .body as TaskManagerCreateTask;

  // Retrieve the user's keypair to sign and pay for transactions
  const { error, data: secretKey } = await supabase.rpc(
    "get_wallet_secret_key",
    { user_id: userId },
  );

  if (error) {
    logger.error(error);
    captureException(error, { extra: { userId } });
    return ctx.json({ error: "Failed to retrieve user wallet" }, 500);
  } else if (secretKey === "User not found") {
    return ctx.json({ error: "User not found" }, 404);
  }

  try {
    taskManager.addTask({
      userId,
      totalRuns: runs,
      interval,
      action: ACTION,
      params: {
        userSecretKey: secretKey,
        tokenAddress,
        amount,
        slippage,
        fee,
      },
    });

    return ctx.body(null, 201);
  } catch (error) {
    logger.error(error);
    captureException(error);
    return ctx.json({ error: "Failed to create task" }, 500);
  }
});

BumpTask.get("/status/:taskId", async (ctx) => {
  const taskId = ctx.req.param("taskId");
  const status = await taskManager.getTaskStatus(taskId);

  if (status) {
    return ctx.json({ status });
  }
  return ctx.json({ error: "Task not found" }, 404);
});

BumpTask.post("/stop/:taskId", async (ctx) => {
  const taskId = ctx.req.param("taskId");
  const error = await taskManager.stopTask(taskId);
  if (error) {
    logger.error(error);
    return ctx.json({ error }, 400);
  }
  return ctx.body(null);
});

BumpTask.post("/stop-all", async (ctx) => {
  await taskManager.stopAllTasks();
  return ctx.body(null);
});

// Event handlers
taskManager.on("processingStarted", () => {
  logger.info(JSON.stringify(
    {
      event: "Task processing started",
    },
    null,
    2,
  ));
});

taskManager.on("processingStopped", () => {
  logger.info(JSON.stringify(
    {
      event: "Task processing stopped",
    },
    null,
    2,
  ));
});

taskManager.on("taskAdded", (task) => {
  logger.info(JSON.stringify(
    {
      event: "Task ADDED",
      taskId: task.id,
    },
    null,
    2,
  ));
});

taskManager.on("taskStopping", (task) => {
  logger.info(JSON.stringify(
    {
      event: "Task STOPPING",
      taskId: task.id,
    },
    null,
    2,
  ));
});

taskManager.on("taskStopped", (task) => {
  logger.info(JSON.stringify(
    {
      event: "Task STOPPED",
      taskId: task.id,
    },
    null,
    2,
  ));
});

taskManager.on("taskCompleted", (task) => {
  logger.info(JSON.stringify(
    {
      event: "Task COMPLETED",
      taskId: task.id,
    },
    null,
    2,
  ));
});

taskManager.on("taskFailed", (task) => {
  logger.info(JSON.stringify(
    {
      event: "Task FAILED",
      taskId: task.id,
    },
    null,
    2,
  ));
});

taskManager.on("runStarted", (task, runId, run) => {
  logger.info(JSON.stringify(
    {
      event: "Run STARTED",
      taskId: task.id,
      runId: runId,
      run: run,
    },
    null,
    2,
  ));
});

taskManager.on("runCompleted", (task, runId, run, success) => {
  logger.info(JSON.stringify(
    {
      event: "Run COMPLETED",
      taskId: task.id,
      runId: runId,
      run: run,
      status: task.status,
      success: success,
    },
    null,
    2,
  ));
});

taskManager.on("runFailed", (task, runId, run, error) => {
  logger.error(JSON.stringify(
    {
      event: "Run FAILED",
      taskId: task.id,
      runId: runId,
      run: run,
      error: error.message,
    },
    null,
    2,
  ));
});
