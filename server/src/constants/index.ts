export const IS_PROD = Deno.env.get("PROD") === "true";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
// import { resolve } from "node:path";

// Pumpfun program constants
export const PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
export const FEE_RECIPIENT = "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM";
export const EVENT_AUTH = "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1";

/** The percentage of the amount of transactions we charge */
export const SERVICE_FEE_PERCENTAGE = 0.05;

// Transaction constants
export const SystemAccountRent = 0.00089088 * LAMPORTS_PER_SOL;
export const PUMP_TOKEN_DECIMALS = 6;
export const TX_MAX_SIZE = 1232;
/** Per Solana Cookbook docs:  A microLamport is 0.000001 Lamports */
export const MICRO_LAMPORT_PER_LAMPORT = 1_000_000;
/** The base amount of lamports applied to any transaction for the priority fee */
export const BASE_PRIORITY_FEE_LAMPORTS = 5000;
/** The base microLamports to set for priority fee if estimate retrieval failed */
export const BASE_PRIORITY_FEE_MICRO_LAMPORTS = 1_000_000;
/** The maximum price we'll set for a priority fee */
export const MAX_PRIORITY_FEE_MICRO_LAMPORTS = 20_000_000;
/** The base Compute Units (CU) to use if the estimate retrieval failed */
export const BASE_COMPUTE_UNITS = 200_000;
/**
 * TaskManager constants
 */
export const TASK_PROCESSING_MAX_ACTIVE_TASKS = 10;
// 10ms is the minimum to prevent event loop blocking, however, our RPC provider
// has a rate limit of 50 requests per second and each transaction can take at
// least 5 requests, so we need to set the minimum interval to 200ms
export const TASK_PROCESSING_INTERVAL_MINIMUM = 200;
export const TASK_PROCESSING_INTERVAL_MAXIMUM = 10000;
// Using 300ms to be safe to prevent any rate limiting issues
export const TASK_PROCESSING_INTERVAL_DEFAULT = 300;
/**
 * Bump transaction constants
 */
export const BUMP_RUNS_MINIMUM = 1;
export const BUMP_RUNS_MAXIMUM = 1_000_000;
// 1000ms is the minimum to prevent duplicate transactions in Solana
export const BUMP_INTERVAL_MINIMUM = 1000;
export const BUMP_INTERVAL_MAXIMUM = 10000;
export const BUMP_AMOUNT_MINIMUM = 0.000001;
export const BUMP_AMOUNT_MAXIMUM = 1000;
export const BUMP_SPLIPPAGE_MINIMUM = 0.01;
export const BUMP_SPLIPPAGE_DEFAULT = 0.05;
export const BUMP_SPLIPPAGE_MAXIMUM = 1;
export const BUMP_FEE_MINIMUM = 0.0001;
export const BUMP_FEE_MAXIMUM = 1000;

/**
 * The minimum time to wait between experiments (creating transactions). This is because
 * all the parameters are the same so, if we create transactions too quickly, it allows
 * for duplicate transactions to be created, which will definitely fail and waste money.
 */
export const MINUMUM_EXPERIMENT_INTERVAL = 1500;

// // Jito constants
// export const TIP_ACCOUNTS = [
//   "96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5",
//   "HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe",
//   "Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY",
//   "ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49",
//   "DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh",
//   "ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt",
//   "DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL",
//   "3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT",
// ];

// // Pumpfun endpoints
// export const registerEndpoint =
//   "https://frontend-api.pump.fun/users/register";
// export const loginEndpoint =
//   "https://frontend-api.pump.fun/auth/login";
// export const repliesEndpoint =
//   "https://frontend-api.pump.fun/replies";

// //constant file paths
// export const buyBotWalletsPath = resolve(
//   Deno.cwd(),
//   "buy-bot-wallets-temp.json",
// );
// export const tradeHistoryPath = resolve(Deno.cwd(), "trades.json");
// export const BundleErrorsPath = resolve(Deno.cwd(), "bundle-errors.json");
// export const BuyBotJsWorkerPath = resolve(
//   Deno.cwd(),
//   "src",
//   "scripts",
//   "volume-bots",
//   "buy-fuck-bot",
//   "worker.js",
// );
// export const VolsellPath = resolve(
//   Deno.cwd(),
//   "src",
//   "scripts",
//   "volume-bots",
//   "buy-fuck-bot",
//   "sell.ts",
// );
