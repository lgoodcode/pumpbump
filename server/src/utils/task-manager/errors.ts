import { CustomError } from "@/utils/solana/errors.ts";

export abstract class TaskManagerError extends CustomError {
  taskId: string;

  constructor(taskId: string, message?: string) {
    super(message);
    this.taskId = taskId;
  }
}

export class EmptyActionsError extends CustomError {
  name = "EmptyActionsError";
}

export class TaskNotFoundDuringRunError extends TaskManagerError {
  name = "TaskNotFoundDuringRunError";
}

export class ActionNotFoundError extends TaskManagerError {
  name = "ActionNotFoundError";
}

export class TooManyRunsError extends TaskManagerError {
  name = "TooManyRunsError";
}
