import { green } from "colors";
import { Hono } from "hono";
import { EventEmitter } from "EventEmitter";

export const Task = new Hono();
const fakeDatabase = new Map<string, Task>();

// The information needed to execute a task
type TaskInfo = {
  taskId: string;
  totalRuns: number;
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
  totalRuns: number;
  currRun: number;
  failedRuns: number;
  completedRuns: number;
  status: TaskStatus;
};

Task.get("/start/:taskId", (ctx) => {
  const taskId = ctx.req.param("taskId");
  const totalRuns = ctx.req.param("totalRuns");
  handleStartRequest(taskId, parseInt(totalRuns ?? "10"));
  return ctx.body(null, 201);
});

Task.get("/stop/:taskId", (ctx) => {
  const taskId = ctx.req.param("taskId");

  if (!taskManager.hasTask(taskId)) {
    return ctx.json({ error: "Task not found" }, 404);
  }

  if (handleStopRequest(taskId)) {
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

// Stub for Solana transaction
async function executeSolanaTransaction(): Promise<boolean> {
  const maxDelay = 5000;
  await new Promise((resolve) => setTimeout(resolve, Math.random() * maxDelay));
  return Math.random() > 0.2; // 80% success rate
}

// Update the database with the result of a task run
async function saveTaskToDatabase(task: Task, action: string): Promise<void> {
  console.log(`[${action}] Saving task to database: ${JSON.stringify(task)}`);
  fakeDatabase.set(task.id, task);
  // Sleep random time to simulate database latency
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000));
}

class TaskManager extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private isProcessing: boolean = false;
  private RUNNING_STATUSES: TaskStatus[] = [
    "pending",
    "processing",
    "stopping",
  ];

  getTask(taskId: string): Task | null {
    return this.tasks.get(taskId) ?? null;
  }

  hasTask(taskId: string): boolean {
    console.log(this.tasks.entries());
    return this.tasks.has(taskId);
  }

  getTaskStatus(taskId: string): TaskStatus | null {
    const task = this.tasks.get(taskId);
    return task ? task.status : null;
  }

  isTaskProcessing(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    return !!task && task.status === "processing";
  }

  getTaskIdList(): string[] {
    return Array.from(this.tasks.keys());
  }

  isTaskRunning(taskId: string): boolean {
    const task = fakeDatabase.get(taskId);
    return !!task && this.RUNNING_STATUSES.includes(task.status);
  }

  isTaskStatusRunning(status: TaskStatus): boolean {
    return this.RUNNING_STATUSES.includes(status);
  }

  // Create the task and add it to the task list
  async addTask({ taskId, totalRuns }: TaskInfo): Promise<void> {
    const task: Task = {
      id: taskId,
      totalRuns,
      currRun: 0,
      failedRuns: 0,
      completedRuns: 0,
      status: "pending",
    };
    this.tasks.set(task.id, task);
    await saveTaskToDatabase(task, "ADD");
    this.emit("taskAdded", task);
    if (!this.isProcessing) {
      this.processTasks();
    }
  }

  private async completeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = task.status === "stopping" ? "stopped" : "completed";
      await saveTaskToDatabase(task, "COMPLETE");
      this.tasks.delete(taskId);
      this.emit("taskCompleted", task);
    }
  }

  async stopTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task && task.status !== "stopped" && task.status !== "completed") {
      task.status = "stopping";
      await saveTaskToDatabase(task, "STOP");
      this.emit("taskStopping", taskId);
    }
  }

  private async processTasks(): Promise<void> {
    this.isProcessing = true;

    while (this.tasks.size > 0) {
      for (const [taskId, task] of this.tasks) {
        if (task.status === "stopping") {
          await this.completeTask(taskId);
          continue;
        }

        if (task.currRun < task.totalRuns) {
          await this.processRun(task);
        }

        if (task.currRun >= task.totalRuns) {
          await this.completeTask(taskId);
        }

        // Check if we should continue processing after each run
        if (!this.isProcessing) break;
      }

      // Small delay to prevent blocking the event loop
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check if we should continue processing after each iteration
      if (!this.isProcessing) break;
    }

    this.isProcessing = false;
  }

  private async processRun(task: Task): Promise<void> {
    const runId = ++task.currRun;
    task.status = "processing";
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
      console.error(
        `Error executing Solana transaction for task ${task.id}, run ${runId}:`,
        error,
      );
      task.failedRuns++;
      task.status = "pending";
      await saveTaskToDatabase(task, "UPDATE ERROR");
      this.emit("runFailed", { task, runId, error });
    }
  }
}

// Usage
const taskManager = new TaskManager();

// Event handlers
taskManager.on("taskAdded", (task: Task) => {
  console.log(`Task added: ${task.id}`);
});

taskManager.on("taskStopping", (taskId: string) => {
  console.log(`Task stopping: ${taskId}`);
});

taskManager.on("taskStopped", (task: Task) => {
  console.log(`Task stopped: ${task.id}`);
});

taskManager.on("taskCompleted", (task: Task) => {
  console.log(`Task completed: ${task.id}`);
});

taskManager.on(
  "runStarted",
  ({ taskId, runId }: { taskId: string; runId: number }) => {
    console.log(`Run started: Task ${taskId}, Run ${runId}`);
  },
);

taskManager.on(
  "runCompleted",
  (
    { task, runId, success }: { task: Task; runId: number; success: boolean },
  ) => {
    console.log(
      `Run completed: Task ${task.id}, Run ${runId}, Success: ${success}`,
    );
  },
);

taskManager.on("taskFailed", (task: Task) => {
  console.log(`Task failed: ${task.id}`);
});

taskManager.on(
  "runFailed",
  ({ task, runId, error }: { task: Task; runId: number; error: any }) => {
    console.log(
      `Run failed: Task ${task.id}, Run ${runId}, Error: ${error.message}`,
    );
  },
);

function handleStartRequest(taskId: string, totalRuns: number): void {
  taskManager.addTask({ taskId, totalRuns });
}

function handleStopRequest(taskId: string): boolean {
  if (taskManager.isTaskRunning(taskId)) {
    taskManager.stopTask(taskId);
    return true;
  }
  return false;
}

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
