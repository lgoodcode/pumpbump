import { MINUMUM_EXPERIMENT_INTERVAL } from "@/constants/index.ts";

abstract class CustomError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

export class MissingEnvVarError extends CustomError {
  constructor(envVar: string) {
    super(`Missing environment variable: ${envVar}`);
  }
}

export class TransactionExpiredError extends CustomError {
  name = "TransactionExpiredError";
}

export class InvalidExperiementIntervalError extends CustomError {
  name = "InvalidExperiementIntervalError";
  constructor(interval: number) {
    super(
      `The experiment interval must be no less than ${MINUMUM_EXPERIMENT_INTERVAL} milliseconds. Given interval: ${interval} milliseconds.`,
    );
  }
}

export class BlockInfoFetchError extends CustomError {
  name = "BlockInfoFetchError";
}

export class MissingCreateBumpTransactionOptionsError extends CustomError {
  name = "MissingCreateBumpTransactionOptionsError";
}
