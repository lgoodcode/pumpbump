import { Hono } from "@/utils/hono.ts";
import { logger } from "@/utils/logger.ts";
import { validate } from "@/lib/middleware.ts";
import { TaskManager } from "@/utils/task-manager/task-manager.ts";
import {
  type TaskManagerInterval,
  taskManagerSchema,
  type TaskManagerStart,
} from "@/utils/task-manager/schema.ts";

export const Task = new Hono();
const taskManager = new TaskManager();

Task.post(
  "/manage/interval",
  validate(taskManagerSchema.interval),
  (ctx) => {
    const { interval } = ctx.get("data").body as TaskManagerInterval;
    taskManager.processingInterval = interval;
    return ctx.body(null, 201);
  },
);

Task.post("/create", validate(taskManagerSchema.start), (ctx) => {
  const { userId, runs, interval } = ctx.get("data").body as TaskManagerStart;

  taskManager.addTask({
    userId,
    totalRuns: runs,
    interval,
  });

  return ctx.body(null, 201);
});

Task.get("/stop/:taskId", (ctx) => {
  const taskId = ctx.req.param("taskId");

  if (!taskManager.hasTask(taskId)) {
    return ctx.json({ error: "Task not found" }, 404);
  }

  if (taskManager.isTaskRunning(taskId)) {
    taskManager.stopTask(taskId);
    return ctx.body(null, 201);
  }
  return ctx.json({ error: "Task not running" }, 400);
});

Task.get("/status/:taskId", (ctx) => {
  const taskId = ctx.req.param("taskId");
  const status = taskManager.getTaskStatus(taskId);

  if (status) {
    return ctx.json({ status });
  }
  return ctx.json({ error: "Task not found" }, 404);
});

Task.get("/list", (ctx) => {
  const tasks = taskManager.getTaskList();
  return ctx.json(tasks);
});

// Event handlers
taskManager.on("taskAdded", (task) => {
  logger.info(`Task added: ${task.id}`);
});

taskManager.on("taskStopping", (task) => {
  logger.info(`Task stopping: ${task.id}`);
});

taskManager.on("taskStopped", (task) => {
  logger.info(`Task stopped: ${task.id}`);
});

taskManager.on("taskCompleted", (task) => {
  logger.info(`Task completed: ${JSON.stringify(task)}`);
});

taskManager.on("taskFailed", (task) => {
  logger.info(`Task failed: ${task.id}`);
});

taskManager.on(
  "runStarted",
  (task, run) => {
    logger.info(`Run started: Task ${task.id}, Run ${run}`);
  },
);

taskManager.on(
  "runCompleted",
  (
    task,
    run,
    success,
  ) => {
    logger.info(
      `Run completed: Task ${task.id}, Run ${run}, status: ${task.status} Success: ${success}`,
    );
  },
);

taskManager.on(
  "runFailed",
  (task, run, error) => {
    logger.error(
      `Run failed: Task ${task.id}, Run ${run}, Error: ${error.message}`,
    );
  },
);
