import { Hono } from "hono";
import { EventEmitter } from "EventEmitter";

import { logger } from "@/utils/logger.ts";
import { connectWallet } from "@/utils/solana/connect-wallet.ts";

export const Task = new Hono();
const fakeDatabase = new Map<string, Task>();

// The information needed to execute a task
type TaskInfo = {
  userId: string;
  totalRuns: number;
  interval: number;
};

type TaskStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "stopping"
  | "stopped";

type Task = {
  id: string;
  userId: string;
  totalRuns: number;
  currRun: number;
  failedRuns: number;
  completedRuns: number;
  status: TaskStatus;
  interval: number;
  nextRunTime: number; // timestamp for the next scheduled run
  createdAt: Date;
  updatedAt: Date;
};

type TaskSummary = {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
};

class Queue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

Task.get("/connect-wallet", async (ctx) => {
  const wallet = await connectWallet();
  return ctx.json(wallet);
});

Task.get("/start/:userId", (ctx) => {
  const userId = ctx.req.param("userId");
  const totalRuns = ctx.req.query("totalRuns") ?? "10";
  const interval = ctx.req.query("interval") ?? "1000";

  taskManager.addTask({
    userId,
    totalRuns: parseInt(totalRuns),
    interval: parseInt(interval),
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
  const taskIds = taskManager.getTaskIdList();
  return ctx.json(taskIds);
});

Task.get("/data", (ctx) => {
  return ctx.json(JSON.stringify(fakeDatabase));
});

// Stub for Solana transaction
async function executeSolanaTransaction(): Promise<boolean> {
  const maxDelay = 5000;
  await new Promise((resolve) => setTimeout(resolve, Math.random() * maxDelay));
  return Math.random() > 0.2; // 80% success rate
}

// Update the database with the result of a task run
async function saveTaskToDatabase(task: Task, action: string): Promise<void> {
  // logger.log(`[${action}] Saving task to database: ${JSON.stringify(task)}`);
  fakeDatabase.set(task.id, { ...task, updatedAt: new Date() });
  // Sleep random time to simulate database latency
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));
}

class TaskManager extends EventEmitter {
  private count = 1;
  private _tasks: Map<string, Task> = new Map();
  private _taskQueue: Queue<string> = new Queue<string>();
  private _isProcessing: boolean = false;
  private _processingInterval: number | null = null;
  private _runningStatuses: TaskStatus[] = [
    "pending",
    "processing",
    "stopping",
  ];

  getTask(taskId: string): Task | null {
    return this._tasks.get(taskId) ?? null;
  }

  hasTask(taskId: string): boolean {
    return this._tasks.has(taskId);
  }

  isProcessing(): boolean {
    return this._isProcessing;
  }

  get processingInterval(): number | null {
    return this._processingInterval;
  }

  set processingInterval(interval: number) {
    if (this._processingInterval !== null) {
      clearInterval(this._processingInterval);
    }
    this._processingInterval = setInterval(
      () => this.processNextTask(),
      interval,
    );
  }

  getTaskStatus(taskId: string): TaskStatus | null {
    const task = this._tasks.get(taskId);
    return task ? task.status : null;
  }

  isTaskProcessing(taskId: string): boolean {
    const task = this._tasks.get(taskId);
    return !!task && task.status === "processing";
  }

  async stopAllTasks(): Promise<void> {
    try {
      const stopPromises = Array.from(this._tasks.values()).map((task) =>
        this.stopTask(task.id)
      );
      const results = await Promise.allSettled(stopPromises);

      const failedStops = results.filter((r) => r.status === "rejected").length;
      if (failedStops > 0) {
        logger.warn(`Failed to stop ${failedStops} tasks`);
      }

      this.stopProcessing();
    } catch (error) {
      logger.error(error);
      this.stopProcessing();
    }
  }

  getTaskIdList(): string[] {
    return Array.from(this._tasks.keys());
  }

  isTaskRunning(taskId: string): boolean {
    const task = fakeDatabase.get(taskId);
    return !!task && this._runningStatuses.includes(task.status);
  }

  isTaskStatusRunning(status: TaskStatus): boolean {
    return this._runningStatuses.includes(status);
  }

  // Create the task and add it to the task list
  async addTask({ userId, totalRuns, interval }: TaskInfo): Promise<void> {
    const now = Date.now();
    const task: Task = {
      // id: Math.random().toString(36).slice(2),
      id: String(this.count++),
      userId,
      totalRuns,
      currRun: 0,
      failedRuns: 0,
      completedRuns: 0,
      status: "pending",
      interval,
      nextRunTime: now,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
    this._tasks.set(task.id, task);
    this._taskQueue.enqueue(task.id);
    await saveTaskToDatabase(task, "ADD");
    this.emit("taskAdded", task);
    if (!this._isProcessing) {
      this.startProcessing();
    }
  }

  private startProcessing(): void {
    if (!this._isProcessing) {
      this._isProcessing = true;
      this._processingInterval = setInterval(() => this.processNextTask(), 10);
    }
  }

  private stopProcessing(): void {
    if (this._processingInterval !== null) {
      clearInterval(this._processingInterval);
      this._processingInterval = null;
    }
    this._isProcessing = false;
  }

  private async processNextTask(): Promise<void> {
    const taskId = this._taskQueue.dequeue();
    if (!taskId) {
      if (this._tasks.size === 0) {
        this.stopProcessing();
      }
      return;
    }

    const task = this._tasks.get(taskId);
    if (!task) return;

    if (task.status === "stopping") {
      await this.completeTask(taskId);
      return;
    }

    if (this.isTaskEligible(task)) {
      if (this.isTaskWithinInterval(task)) {
        this.processRun(task);
      }

      if (task.currRun + 1 < task.totalRuns) {
        this._taskQueue.enqueue(taskId);
      }
    } else {
      await this.completeTask(taskId);
    }
  }

  /**
   * Checks that the task is eligible to execute another run:
   *
   * 1. The number of runs don't exceed
   */
  private isTaskEligible(task: Task): boolean {
    return task.currRun < task.totalRuns;
  }

  private isTaskWithinInterval(task: Task): boolean {
    return task.nextRunTime <= Date.now();
  }

  private async completeTask(taskId: string): Promise<void> {
    const task = this._tasks.get(taskId);
    if (task) {
      task.status = task.status === "stopping" ? "stopped" : "completed";
      await saveTaskToDatabase(task, "COMPLETE");
      this._tasks.delete(taskId);
      this.emit("taskCompleted", task);
    }
  }

  async stopTask(taskId: string): Promise<void> {
    const task = this._tasks.get(taskId);
    if (task && task.status !== "stopped" && task.status !== "completed") {
      task.status = "stopping";
      await saveTaskToDatabase(task, "STOP");
      this.emit("taskStopping", taskId);
    }
  }

  private async processRun(task: Task): Promise<void> {
    const runId = ++task.currRun;
    task.status = "processing";
    task.nextRunTime = Date.now() + task.interval;

    await saveTaskToDatabase(task, "PROCESS");

    this.emit("runStarted", { taskId: task.id, runId });

    try {
      const success = await executeSolanaTransaction();
      if (success) {
        task.completedRuns++;
      } else {
        task.failedRuns++;
      }

      // If the task status hasn't changed, update it to pending because,
      // processRun will handle the task based on status
      if (this.isTaskProcessing(task.id)) {
        task.status = "pending";
        await saveTaskToDatabase(task, "UPDATE SUCCESS");
      }

      this.emit("runCompleted", { task, runId, success });
    } catch (error) {
      logger.error(
        `Error executing Solana transaction for task ${task.id}, run ${runId}:`,
        error,
      );
      task.failedRuns++;
      task.status = "pending";
      await saveTaskToDatabase(task, "UPDATE ERROR");
      // sleep 1 second
      this.emit("runFailed", { task, runId, error });
    }
  }

  getActiveTasks(userId: string): Promise<Task[]> {
    // In practice, this would be a database query
    return Promise.resolve(
      Array.from(fakeDatabase.values()).filter(
        (task) =>
          task.userId === userId && this.isTaskStatusRunning(task.status),
      ),
    );
  }

  getTaskHistory(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ tasks: Task[]; totalCount: number }> {
    const offset = (page - 1) * pageSize;
    const filteredTasks = Array.from(fakeDatabase.values()).filter(
      (task) =>
        task.userId === userId &&
        !this.isTaskStatusRunning(task.status),
    );
    return Promise.resolve({
      tasks: filteredTasks.slice(offset, offset + pageSize),
      totalCount: filteredTasks.length,
    });
  }

  getUserTaskSummary(userId: string): Promise<TaskSummary> {
    return Promise.resolve(
      Array.from(fakeDatabase.values()).reduce(
        (summary, task) => {
          if (task.userId === userId) {
            summary.totalTasks += 1;
            if (task.status === "completed") summary.completedTasks += 1;
            else if (task.status === "failed") summary.failedTasks += 1;
          }
          return summary;
        },
        { totalTasks: 0, completedTasks: 0, failedTasks: 0 },
      ),
    );
  }
}

// Usage
const taskManager = new TaskManager();

// Event handlers
taskManager.on("taskAdded", (task: Task) => {
  logger.info(`Task added: ${task.id}`);
});

taskManager.on("taskStopping", (taskId: string) => {
  logger.info(`Task stopping: ${taskId}`);
});

taskManager.on("taskStopped", (task: Task) => {
  logger.info(`Task stopped: ${task.id}`);
});

taskManager.on("taskCompleted", (task: Task) => {
  logger.info(`Task completed: ${task.id}`);
});

taskManager.on(
  "runStarted",
  ({ taskId, runId }: { taskId: string; runId: number }) => {
    logger.info(`Run started: Task ${taskId}, Run ${runId}`);
  },
);

taskManager.on(
  "runCompleted",
  (
    { task, runId, success }: { task: Task; runId: number; success: boolean },
  ) => {
    logger.info(
      `Run completed: Task ${task.id}, Run ${runId}, Success: ${success}`,
    );
  },
);

taskManager.on("taskFailed", (task: Task) => {
  logger.info(`Task failed: ${task.id}`);
});

taskManager.on(
  "runFailed",
  ({ task, runId, error }: { task: Task; runId: number; error: any }) => {
    logger.error(
      `Run failed: Task ${task.id}, Run ${runId}, Error: ${error.message}`,
    );
  },
);
