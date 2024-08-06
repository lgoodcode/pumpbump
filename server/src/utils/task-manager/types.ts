// deno-lint-ignore-file no-explicit-any

import { EventEmitter } from "EventEmitter";
import { HashSet } from "@/utils/hash-set.ts";
import { Queue } from "@/utils/queue.ts";
import {
  IS_PROD,
  TASK_PROCESSING_INTERVAL_DEFAULT,
  TASK_PROCESSING_MAX_ACTIVE_TASKS,
} from "@/constants/index.ts";
import { TaskRunTracker } from "@/utils/task-manager/task-run-tracker.ts";
import { EmptyActionsError } from "@/utils/task-manager/errors.ts";

export type TaskErrorMessage = string;

export enum TaskStatus {
  Pending = "PENDING", // Task is waiting to begin processing
  Processing = "PROCESSING", // Task is currently processing one or more runs
  Completing = "COMPLETING", // Task is waiting for processing runs to complete before marking as completed
  Completed = "COMPLETED", // Task has completed all runs
  Stopping = "STOPPING", // Task is stopping and waiting for processing runs to complete
  Stopped = "STOPPED", // Task has been stopped
  Failing = "FAILING", // Task is failing and waiting for processing runs to complete before marking as failed
  Failed = "FAILED", // Task has failed
}

export type TaskAction = (...args: any[]) => Promise<boolean>;

export type TaskActionMap = Map<string, TaskAction>;

export type TaskDB<T> = {
  createTask: (item: T) => Promise<void>;
  updateTask: <U extends Record<string, any> = Partial<T>>(
    id: string,
    params: U,
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  saveRun: (
    taskId: string,
    runId: string,
    success: boolean,
  ) => Promise<void>;
  completeTask: (task: Task) => Promise<void>;
};

export type TaskInfo = {
  userId: string;
  totalRuns: number;
  interval: number;
  action: string;
  params: Record<string, any>;
};

export type Task = TaskInfo & {
  id: string;
  status: TaskStatus;
  /** Timestamp for the next scheduled run */
  nextRunTime: number;
};

export type TaskSummary = {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
};

interface TaskManagerEvents {
  processingStarted: () => void;
  processingStopped: () => void;
  taskAdded: (task: Task) => void;
  taskStopping: (task: Task) => void;
  taskStopped: (task: Task) => void;
  taskCompleted: (task: Task) => void;
  taskFailed: (task: Task) => void;
  runStarted: (task: Task, runId: string, run: number) => void;
  runCompleted: (
    task: Task,
    runId: string,
    run: number,
    success: boolean,
  ) => void;
  runFailed: (task: Task, runId: string, run: number, error: Error) => void;
}

export declare interface ITaskManager {
  on<U extends keyof TaskManagerEvents>(
    event: U,
    listener: TaskManagerEvents[U],
  ): this;
  emit<U extends keyof TaskManagerEvents>(
    event: U,
    ...args: Parameters<TaskManagerEvents[U]>
  ): boolean;
}

export type TaskManagerConfig = {
  taskHashSet: HashSet<Task>;
  taskRunTracker: TaskRunTracker;
  taskIdQueue: Queue<string>;
  taskDb: TaskDB<Task>;
  actions: TaskActionMap;
  interval?: number;
};

export abstract class AbstractTaskManager
  extends (EventEmitter as new () => ITaskManager) {
  protected _activeTasks: number = 0;
  protected _maxActiveTasks: number = TASK_PROCESSING_MAX_ACTIVE_TASKS;
  protected _tasks: HashSet<Task>;
  protected _taskRuns: TaskRunTracker;
  protected _taskQueue: Queue<string>;
  protected _db: TaskDB<Task>;
  protected _actions: TaskActionMap;
  protected _isProcessing: boolean = false;
  protected _interval: number;

  constructor(config: TaskManagerConfig) {
    super();

    if (config.actions.size === 0) {
      throw new EmptyActionsError();
    }

    this._tasks = config.taskHashSet;
    this._taskRuns = config.taskRunTracker;
    this._taskQueue = config.taskIdQueue;
    this._db = config.taskDb;
    this._actions = config.actions;
    this._interval = config?.interval || TASK_PROCESSING_INTERVAL_DEFAULT;

    if (!IS_PROD) {
      this._tasks.clear();
      this._taskRuns.clear();
      this._taskQueue.clear();
    }
  }

  get interval(): number {
    return this._interval;
  }

  set interval(interval: number) {
    this._interval = interval;
  }

  /**
   * Process the next task in the queue and handle any errors that occur.
   * If there are no tasks left, stop processing.
   */
  protected abstract process(): Promise<void>;
  protected abstract startProcessing(): void;
  protected abstract stopProcessing(): void;
  protected abstract isProcessing(): boolean;
  protected abstract getTask(taskId: string): Promise<Task | null>;
  protected abstract hasTask(taskId: string): Promise<boolean>;
  protected abstract isEmpty(): Promise<boolean>;
  protected abstract getTaskKeys(): Promise<string[]>;
  protected abstract getTaskStatus(taskId: string): Promise<TaskStatus | null>;
  protected abstract isTaskActive(
    taskOrTaskId: Task | string,
  ): Promise<boolean>;
  protected abstract addTask(taskInfo: TaskInfo): Promise<void>;
  /**
   * Gets the final task status and updates the task in the database and
   * removes it from the task set and runs from the redis cache
   * @param task
   */
  protected abstract completeTask(task: Task): Promise<void>;
  /**
   * When given a task or task ID, will mark the task as `STOPPING` in the redis
   * cache and database. It will wait for any processing runs to complete before
   * it will invoke `completeTask()` with the `stopping` flag set to `true` to know
   * that the task is completing due to being stopped. This will prevent additional
   * runs from ocurring and still allow other tasks to process.
   *
   * @param taskOrTaskId Task or task ID to stop
   * @returns An error message if the task is not found or not running, otherwise, null
   */
  protected abstract stopTask(
    taskOrTaskId: Task | string,
  ): Promise<string | null>;
  /**
   * Stop all tasks that are currently running by retrieving all the task IDs
   * and stopping them one by one. If any of the tasks fail to stop, log the error
   * and capture it with Sentry.
   *
   * If an error occurs while stopping the tasks, stop processing the task queue.
   */
  protected abstract stopAllTasks(): Promise<void>;
  protected abstract isTaskPendingOrProcessing(task: Task): boolean;
  /**
   * Checks that the task is eligible to execute another run:
   *
   * 1. The current status of the task is "pending" or "processing", indicating it isn't
   * stopping, completed, or has failed
   * 2. Adding a new run won't exceed the total number of runs allowed
   */
  protected abstract isTaskEligible(task: Task): Promise<boolean>;
  protected abstract isTaskWithinInterval(task: Task): boolean;
  protected abstract isTaskProcessingRuns(task: Task): Promise<boolean>;
  /**
   * A task is only completable if the status is `COMPLETING`, which is only set in
   * `handleRunResult()` when the current run is the last run for the task.
   *
   * @param task The task to check if it is completable
   * @returns Whether the task is completable
   */
  protected abstract isTaskCompletable(task: Task): Promise<boolean>;
  /**
   * This is invoked within `completeTask()` to set the final status of the task
   *
   * @param task the task to update the status for
   * @returns the updated status of the task
   */
  protected abstract finalizeTaskStatus(task: Task): TaskStatus;
  protected abstract processTask(): Promise<void>;
  protected abstract processRun(task: Task): Promise<void>;
  /**
   * Executed after the run has resolved or failed. This is where the task is updated
   * with the new run count, status, and any other relevant information.
   *
   * @param task the task being processed
   * @param runId the ID of the run that was executed
   * @param success whether the run was successful
   */
  protected abstract handleRunResult(
    task: Task,
    runId: string,
    success: boolean,
  ): Promise<Task>;
}
