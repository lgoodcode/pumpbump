import { EventEmitter } from "EventEmitter";
import { captureException } from "Sentry";

import { logger } from "@/utils/logger.ts";

const fakeDatabase = new Map<string, Task>();

type TaskInfo = {
  userId: string;
  totalRuns: number;
  interval: number;
};

type TaskStatus =
  | "pending" // Task is waiting to process the next run
  | "processing" // Task is currently processing one or more runs
  | "completing" // Task is waiting for processing runs to complete before marking as completed
  | "completed" // Task has completed all runs
  | "stopping" // Task is stopping and waiting for processing runs to complete
  | "stopped" // Task has been stopped
  | "failing" // Task is failing and waiting for processing runs to complete before marking as failed
  | "failed"; // Task has failed

type Task = {
  id: string;
  userId: string;
  totalRuns: number;
  currRun: number;
  failedRuns: number;
  completedRuns: number;
  status: TaskStatus;
  interval: number;
  /** Timestamp for the next scheduled run */
  nextRunTime: number;
  /**
   * List of the run index to track if there are runs still processing.
   * This is to allow tasks to wait until any processing runs finish before
   * marking it as completed/stopped
   */
  processingRuns: Record<number, boolean>;
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

interface TaskManagerEvents {
  taskAdded: (task: Task) => void;
  taskStopping: (task: Task) => void;
  taskStopped: (task: Task) => void;
  taskCompleted: (task: Task) => void;
  taskFailed: (task: Task) => void;
  runStarted: (task: Task, run: number) => void;
  runCompleted: (task: Task, run: number, success: boolean) => void;
  runFailed: (task: Task, run: number, error: Error) => void;
}

declare interface ITaskManager {
  on<U extends keyof TaskManagerEvents>(
    event: U,
    listener: TaskManagerEvents[U],
  ): this;
  emit<U extends keyof TaskManagerEvents>(
    event: U,
    ...args: Parameters<TaskManagerEvents[U]>
  ): boolean;
}

type TaskManagerOptions = {
  interval?: number;
};

export class TaskManager extends (EventEmitter as new () => ITaskManager) {
  private count = 1;
  private _tasks: Map<string, Task> = new Map();
  private _taskQueue: Queue<string> = new Queue<string>();
  private _isProcessing: boolean = false;
  /** The delay in-between processing the task queue */
  private _interval: number = 10;
  private _processingInterval: number | null = null;

  constructor(options?: TaskManagerOptions) {
    super();
    if (options?.interval) {
      this._interval = options.interval;
    }
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
      () => this.processTask(),
      interval,
    );
  }

  startProcessing(): void {
    if (!this._isProcessing) {
      this._isProcessing = true;
      this._processingInterval = setInterval(
        () => this.processTask(),
        this._interval,
      );
    }
  }

  stopProcessing(): void {
    if (this._processingInterval !== null) {
      clearInterval(this._processingInterval);
      this._processingInterval = null;
    }
    this._isProcessing = false;
  }

  getTask(taskId: string): Task | null {
    return this._tasks.get(taskId) ?? null;
  }

  hasTask(taskId: string): boolean {
    return this._tasks.has(taskId);
  }

  getTaskList(): string[] {
    return Array.from(this._tasks.keys());
  }

  getTaskStatus(taskId: string): TaskStatus | null {
    const task = this._tasks.get(taskId);
    return task ? task.status : null;
  }

  isTaskRunning(taskId: string): boolean {
    const task = this.getTask(taskId);
    return !!task &&
      (task.status === "processing" || task.status === "pending");
  }

  async addTask({ userId, totalRuns, interval }: TaskInfo): Promise<void> {
    const now = Date.now();
    const task: Task = {
      id: String(this.count++),
      userId,
      totalRuns,
      currRun: 0,
      failedRuns: 0,
      completedRuns: 0,
      status: "pending",
      interval,
      nextRunTime: now,
      processingRuns: {},
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };

    this._tasks.set(task.id, task);
    this._taskQueue.enqueue(task.id);

    await saveTaskToDatabase(task, "ADD");

    this.emit("taskAdded", task);

    if (!this.isProcessing()) {
      this.startProcessing();
    }
  }

  async completeTask(task: Task): Promise<void> {
    this.finalizeTaskStatus(task);
    await saveTaskToDatabase(task, "COMPLETE");
    this.emit("taskCompleted", task);
  }

  async stopTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId);
    if (task && task.status !== "stopped" && task.status !== "completed") {
      task.status = "stopping";
      await saveTaskToDatabase(task, "STOP");
      this.emit("taskStopping", task);
    }
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
      captureException(error);
      this.stopProcessing();
    }
  }

  /**
   * Checks that the task is eligible to execute another run:
   *
   * 1. The number of runs don't exceed
   * 2. The current status of the task is "pending" or "processing", indicating it isn't
   * stopping, completed, or has failed
   */
  private isTaskEligible(task: Task): boolean {
    return task.currRun < task.totalRuns &&
      (task.status === "pending" || task.status === "processing");
  }

  private isTaskWithinInterval(task: Task): boolean {
    return task.nextRunTime <= Date.now();
  }

  private isTaskProcessingRuns(task: Task): boolean {
    return Object.keys(task.processingRuns).length > 0;
  }

  /**
   * This is invoked after a transaction is completed or failed, to update the task
   * status to continue processing the next run or mark as completing if all runs are done
   *
   * This is important because the task could be updated outside of the run via
   * stoppage or the rest of the runs have kicked off to mark for completion
   *
   * @param task the task to update the status for
   */
  private updateTaskStatus(task: Task): void {
    if (task.status === "processing") {
      // Check if there are more runs available, otherwise, mark as processing
      if (task.currRun < task.totalRuns) {
        task.status = "pending";
      } else {
        task.status = "completing";
      }
    }
  }

  /**
   * Set the final status for a task given the current status before finalizing it
   *
   * @param task The task to finalize the status for
   */
  private finalizeTaskStatus(task: Task): void {
    switch (task.status) {
      case "stopping":
        task.status = "stopped";
        break;
      case "completing":
        task.status = "completed";
        break;
      default:
        task.status = "failed";
        break;
    }
  }

  // deno-lint-ignore require-await -- we want this to be async even if it doesn't await anything
  private async processTask(): Promise<void> {
    const taskId = this._taskQueue.dequeue();
    if (!taskId) {
      if (this._taskQueue.isEmpty()) {
        logger.info("No tasks to process - stopping");
        this.stopProcessing();
      }
      return;
    }

    const task = this.getTask(taskId);
    if (!task) {
      throw new Error("Somehow got a task that does not exist");
    }

    // Check if the task is eligible and within the interval, then process it
    if (this.isTaskEligible(task) && this.isTaskWithinInterval(task)) {
      this.processRun(task);
      this._taskQueue.enqueue(taskId); // Re-add for next run
    } else if (!this.isTaskProcessingRuns(task)) {
      // If the task is not currently processing runs, complete it
      return this.completeTask(task);
    } else {
      // If the task is not eligible but has processing runs, re-add it to the queue
      this._taskQueue.enqueue(taskId);
    }
  }

  private async processRun(task: Task): Promise<void> {
    if (!this.isTaskEligible(task)) {
      return;
    }

    const run = task.currRun++;
    task.status = "processing";
    task.nextRunTime = Date.now() + task.interval;
    task.processingRuns[run] = true;

    await saveTaskToDatabase(task, "PROCESS");

    this.emit("runStarted", task, run);

    try {
      const success = await executeSolanaTransaction();
      if (success) {
        task.completedRuns++;
      } else {
        task.failedRuns++;
      }

      this.updateTaskStatus(task);

      await saveTaskToDatabase(task, "UPDATE SUCCESS");

      delete task.processingRuns[run];

      this.emit("runCompleted", task, run, success);
    } catch (error) {
      logger.error(
        `Solana transaction failed for task ${task.id}, run ${run}:`,
        error,
      );
      captureException(error);

      task.failedRuns++;

      this.updateTaskStatus(task);

      await saveTaskToDatabase(task, "UPDATE ERROR");

      delete task.processingRuns[run];

      this.emit("runFailed", task, run, error);
    }
  }

  getActiveTasks(userId: string): Promise<Task[]> {
    // In practice, this would be a database query
    return Promise.resolve(
      Array.from(fakeDatabase.values()).filter(
        (task) => task.userId === userId && this.isTaskRunning(task.id),
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
        !this.isTaskRunning(task.id),
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
