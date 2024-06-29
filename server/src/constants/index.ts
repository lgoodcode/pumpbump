export const IS_PROD = Deno.env.get("PROD") === "true";

// import { LAMPORTS_PER_SOL } from "@solana/web3.js";
// import { resolve } from "path";

// export const APP_NAME = "JiggerPump";

// // Pumpfun program constants
// export const PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
// export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
// export const FEE_RECIPIENT = "CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM";
// export const EVENT_AUTH = "Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1";

// // Transaction constants
// export const SystemAccountRent = 0.00089088 * LAMPORTS_PER_SOL;
// export const PUMP_TOKEN_DECIMALS = 6;
// export const TX_MAX_SIZE = 1232;
// /** The base amount of lamports applied to any transaction for the priority fee */
// export const BASE_PRIORITY_FEE_LAMPORTS = 5000;
// export const MICRO_LAMPORT_PER_LAMPORT = 1_000_000;
// /** The base microLamports to set for priority fee if estimate retrieval failed */
// export const BASE_MICRO_LAMPORTS = 500000;
// /** The base Compute Units (CU) to use if the estimate retrieval failed */
// export const BASE_COMPUTE_UNITS = 130000;
// export const BASE_SPLIPPAGE = 0.05;
// /**
//  * The minimum time to wait between experiments (creating transactions). This is because
//  * all the parameters are the same so, if we create transactions too quickly, it allows
//  * for duplicate transactions to be created, which will definitely fail and waste money.
//  */
// export const MINUMUM_EXPERIMENT_INTERVAL = 1500;

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
//   "https://client-api-2-74b1891ee9f9.herokuapp.com/users/register";
// export const loginEndpoint =
//   "https://client-api-2-74b1891ee9f9.herokuapp.com/auth/login";
// export const repliesEndpoint =
//   "https://client-api-2-74b1891ee9f9.herokuapp.com/replies";

// //constant file paths
// export const buyBotWalletsPath = resolve(
//   process.cwd(),
//   "buy-bot-wallets-temp.json"
// );
// export const tradeHistoryPath = resolve(process.cwd(), "trades.json");
// export const BundleErrorsPath = resolve(process.cwd(), "bundle-errors.json");
// export const BuyBotJsWorkerPath = resolve(
//   process.cwd(),
//   "src",
//   "scripts",
//   "volume-bots",
//   "buy-fuck-bot",
//   "worker.js"
// );
// export const VolsellPath = resolve(
//   process.cwd(),
//   "src",
//   "scripts",
//   "volume-bots",
//   "buy-fuck-bot",
//   "sell.ts"
// );
