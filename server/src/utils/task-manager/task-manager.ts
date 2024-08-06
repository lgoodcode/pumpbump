import { captureException, captureMessage } from "Sentry";

import { logger } from "@/utils/logger.ts";
import {
  AbstractTaskManager,
  type Task,
  type TaskInfo,
  type TaskManagerConfig,
  TaskStatus,
  type TaskSummary,
} from "@/utils/task-manager/types.ts";
import {
  ActionNotFoundError,
  TaskManagerError,
  TaskNotFoundDuringRunError,
  TooManyRunsError,
} from "@/utils/task-manager/errors.ts";
import { Ulid } from "@/utils/ulid.ts";

export class TaskManager extends AbstractTaskManager {
  constructor(config: TaskManagerConfig) {
    super(config);
  }

  async process(): Promise<void> {
    while (this._isProcessing) {
      try {
        await this.processTask();
        await new Promise((resolve) => setTimeout(resolve, this._interval));
      } catch (err: unknown) {
        const error = err as TaskManagerError;
        logger.error(error);
        captureException(error, {
          extra: { taskId: error.taskId },
        });

        if (await this.isEmpty()) {
          this.stopProcessing();
        }
      }
    }
  }

  startProcessing(): void {
    if (!this._isProcessing) {
      this._isProcessing = true;
      this.process();
    }

    this.emit("processingStarted");
  }

  stopProcessing(): void {
    this._isProcessing = false;

    this.emit("processingStopped");
  }

  isProcessing(): boolean {
    return this._isProcessing;
  }

  async getTask(taskId: string): Promise<Task | null> {
    return await this._tasks.get(taskId);
  }

  async hasTask(taskId: string): Promise<boolean> {
    return await this._tasks.has(taskId);
  }

  async isEmpty(): Promise<boolean> {
    return await this._tasks.isEmpty();
  }

  async getTaskKeys(): Promise<string[]> {
    return await this._tasks.keys();
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    const task = await this._tasks.get(taskId);
    return task ? task.status : null;
  }

  async isTaskActive(taskOrTaskId: Task | string): Promise<boolean> {
    const isId = typeof taskOrTaskId === "string";
    const task = isId ? (await this._tasks.get(taskOrTaskId)) : taskOrTaskId;

    if (!task) {
      const error = new Error("Task not found");
      logger.warn(`Task not found: ${taskOrTaskId}`);
      captureException(error, {
        extra: {
          taskId: taskOrTaskId,
        },
      });
      return false;
    }

    return this.isTaskPendingOrProcessing(task);
  }

  async addTask(
    { userId, totalRuns, interval, action, params }: TaskInfo,
  ): Promise<void> {
    const now = Date.now();
    const task: Task = {
      id: Ulid.generate(),
      userId,
      totalRuns,
      status: TaskStatus.Pending,
      interval,
      nextRunTime: now,
      action,
      params,
    };

    await Promise.all([
      this._tasks.set(task.id, task),
      this._taskQueue.enqueue(task.id),
      this._db.createTask(task),
    ]);

    this.emit("taskAdded", task);

    if (!this.isProcessing()) {
      this.startProcessing();
    }
  }

  async completeTask(task: Task, stopped: boolean = false): Promise<void> {
    if (stopped) {
      task.status = TaskStatus.Stopped;
    } else {
      this.finalizeTaskStatus(task);
    }

    await Promise.all([
      this._db.completeTask(task),
      this._tasks.delete(task.id),
      this._taskRuns.delete(task.id),
    ]);

    this.emit("taskCompleted", task);
  }

  async stopTask(
    taskOrTaskId: Task | string,
    batchStop: boolean = false,
  ): Promise<"Task not found" | "Task is not running" | null> {
    const isId = typeof taskOrTaskId === "string";
    const task = isId ? (await this.getTask(taskOrTaskId)) : taskOrTaskId;

    if (!task) {
      return "Task not found";
    } else if ((await this.isTaskActive(task)) === false) {
      return "Task is not running";
    } else {
      await Promise.allSettled([
        batchStop
          ? this._taskRuns.markTaskAsStopping(task.id)
          : Promise.resolve(),
        this._tasks.update(task.id, {
          ...task,
          status: TaskStatus.Stopping,
        }),
        this._db.updateTask(task.id, { status: TaskStatus.Stopping }),
      ]);

      // Wait for other runs to finish before stopping the task
      while (await this._taskRuns.hasProcessingRuns(task.id)) {
        await new Promise((resolve) => setTimeout(resolve, this._interval));
      }
      // Don't need to await this since it's handled in the processTaskAsync method
      this.completeTask(task, true);

      this.emit("taskStopping", task);

      return null;
    }
  }

  async stopAllTasks(): Promise<void> {
    try {
      const taskIds = await this._tasks.keys();
      await this._taskRuns.markTasksAsStopping(taskIds);
      const stopPromises = taskIds.map((task) => this.stopTask(task, true));
      const results = await Promise.allSettled(stopPromises);
      const failedStops = results.reduce((acc, result) => {
        if (result.status === "rejected") {
          logger.error(result.reason);
          captureException(result.reason);
          return acc + 1;
        }
        return acc;
      }, 0);

      if (failedStops > 0) {
        logger.warn(`Failed to stop ${failedStops} tasks`);
      }
    } catch (error) {
      logger.error(error);
      captureException(error);
      this.stopProcessing();
    }
  }

  isTaskPendingOrProcessing(task: Task): boolean {
    return task.status === TaskStatus.Pending ||
      task.status === TaskStatus.Processing;
  }

  async isTaskEligible(task: Task): Promise<boolean> {
    return this.isTaskPendingOrProcessing(task) &&
      (await this._taskRuns.getTotalRunCount(task.id)) < task.totalRuns;
  }

  isTaskWithinInterval(task: Task): boolean {
    return task.nextRunTime <= Date.now();
  }

  async isTaskProcessingRuns(task: Task): Promise<boolean> {
    return await this._taskRuns.hasProcessingRuns(task.id);
  }

  async isTaskCompletable(task: Task): Promise<boolean> {
    return task.status === TaskStatus.Completing &&
      !(await this.isTaskProcessingRuns(task));
  }

  finalizeTaskStatus(task: Task): TaskStatus {
    switch (task.status) {
      case TaskStatus.Stopping:
        task.status = TaskStatus.Stopped;
        break;
      case TaskStatus.Completing:
        task.status = TaskStatus.Completed;
        break;
      default:
        task.status = TaskStatus.Failed;
        break;
    }
    return task.status;
  }

  async processTask(): Promise<void> {
    while (this._activeTasks < this._maxActiveTasks) {
      const taskId = await this._taskQueue.dequeue();
      if (!taskId) {
        if (await this._tasks.isEmpty()) {
          logger.info("No tasks to process - stopping");
          this.stopProcessing();
        }
        break;
      }

      if (await this._taskRuns.isTaskStopping(taskId)) {
        return;
      }

      this._activeTasks++;
      this.processTaskAsync(taskId).finally(() => {
        this._activeTasks--;
      });
    }
  }

  async processTaskAsync(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      logger.warn(`Task not found: ${taskId}`);
      captureMessage("Task not found", {
        level: "warning",
        extra: { taskId },
      });
      // Task was removed from the queue but not the task list
      await this._tasks.delete(taskId);
      return;
    }

    // Only process a task if it's not stopping, eligible, and within the interval
    if (
      !(await this._taskRuns.isTaskStopping(task.id)) &&
      (await this.isTaskEligible(task)) &&
      this.isTaskWithinInterval(task)
    ) {
      await Promise.all([
        this.processRun(task),
        this._taskQueue.enqueue(taskId),
      ]);
    } else if (await this.isTaskCompletable(task)) {
      await this.completeTask(task);
      // If the task is not eligible and not completable, re-add it to the queue
    } else {
      await this._taskQueue.enqueue(taskId);
    }
  }

  async processRun(task: Task): Promise<void> {
    if (!(await this.isTaskEligible(task))) {
      return;
    }

    const runId = Ulid.generate();
    const runCount = await this._taskRuns.getTotalRunCount(task.id);

    // If it's the first run, update the status to processing
    if (task.status === TaskStatus.Pending) {
      task.status = TaskStatus.Processing;
      this._db.updateTask(task.id, { status: TaskStatus.Processing });
    } else {
      if (runCount > task.totalRuns) {
        const error = new TooManyRunsError(task.id);
        logger.warn("Task run exceeds total runs", runCount, task.totalRuns);
        captureException(error, {
          extra: {
            taskId: task.id,
            runId,
            runCount,
            totalRuns: task.totalRuns,
          },
        });
        return;
      }
    }

    // Update the task in the redis cache and maybe the database before running the action
    await Promise.all([
      this._taskRuns.add(task.id, runId, runCount),
      this._tasks.update(task.id, task),
    ]);

    this.emit("runStarted", task, runId, runCount);

    try {
      const action = this._actions.get(task.action);
      if (!action) {
        throw new ActionNotFoundError(
          task.id,
          `Action not found: ${task.action}`,
        );
      }

      const success = await action(task.params);
      task = await this.handleRunResult(task, runId, success);

      this.emit("runCompleted", task, runId, runCount, success);
      // Error handling for the action should be done within the action itself
      // and return false if it fails. This will handle unexpected errors
    } catch (error) {
      captureException(error, {
        extra: {
          taskId: task.id,
          userId: task.userId,
          runId,
          runCount,
        },
      });

      try {
        task = await this.handleRunResult(task, runId, false);
        this.emit("runFailed", task, runId, runCount, error);
      } catch (error) {
        logger.error(error);
        captureException(error, {
          extra: {
            taskId: task.id,
            userId: task.userId,
            runId,
            runCount,
          },
        });
      }
    }
  }

  async handleRunResult(
    task: Task,
    runId: string,
    success: boolean,
  ): Promise<Task> {
    // Fetch the most up-to-date task from the redis store, in case it was updated
    // outside of the run
    const [updatedTask, newRunCount] = await Promise.all([
      this.getTask(task.id),
      this._taskRuns.getTotalRunCount(task.id),
    ]);
    if (!updatedTask) {
      throw new TaskNotFoundDuringRunError(task.id);
    }

    task = updatedTask;
    // If the task status hasn't changed from processing (e.g. stopping, completing)
    // and the run count is at or exceeds the total runs, mark as completing
    if (
      task.status === TaskStatus.Processing && newRunCount >= task.totalRuns
    ) {
      task.status = TaskStatus.Completing;
    }

    await Promise.all([
      this._taskRuns.removeRun(task.id, runId),
      this._tasks.update(task.id, task),
      this._db.saveRun(task.id, runId, success),
    ]);

    return task;
  }

  // getActiveTasks(userId: string): Promise<Task[]> {
  //   // In practice, this would be a database query
  //   return Promise.resolve(
  //     Array.from(memoryStore.values()).filter(
  //       (task) => task.userId === userId && this.isTaskRunning(task),
  //     ),
  //   );
  // }

  // getTaskHistory(
  //   userId: string,
  //   page: number = 1,
  //   pageSize: number = 20,
  // ): Promise<{ tasks: Task[]; totalCount: number }> {
  //   const offset = (page - 1) * pageSize;
  //   const filteredTasks = Array.from(memoryStore.values()).filter(
  //     (task) =>
  //       task.userId === userId &&
  //       !this.isTaskRunning(task),
  //   );
  //   return Promise.resolve({
  //     tasks: filteredTasks.slice(offset, offset + pageSize),
  //     totalCount: filteredTasks.length,
  //   });
  // }

  // getUserTaskSummary(userId: string): Promise<TaskSummary> {
  //   return Promise.resolve(
  //     Array.from(memoryStore.values()).reduce(
  //       (summary, task) => {
  //         if (task.userId === userId) {
  //           summary.totalTasks += 1;
  //           if (task.status === "completed") summary.completedTasks += 1;
  //           else if (task.status === "failed") summary.failedTasks += 1;
  //         }
  //         return summary;
  //       },
  //       { totalTasks: 0, completedTasks: 0, failedTasks: 0 },
  //     ),
  //   );
  // }
}
