// deno-lint-ignore-file no-explicit-any

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { z } from "zod";

export type RouteSchema = {
  body?: z.Schema;
  params?: Record<string, z.Schema>;
  query?: Record<string, z.Schema>;
};

export type RouteData = {
  params: Record<string, any>;
  query: Record<string, any>;
  body: Record<string, any>;
};

/// Helius API START ///
export type PriorityLevel = "low" | "medium" | "high" | "veryHigh";
/// Helius API END ///

export interface CreateTransactionOptions {
  /** The transaction amount in SOL */
  amount: number;
  /** The slippage as a whole number */
  slippage?: number;
  /** The priority fee in SOL */
  fee?: "optimal" | number;
}

/// Experiment START ///
export type ExperimentParams = {
  mint: PublicKey;
  runs: number;
  amount: number;
  slippage: number;
  fee: "optimal" | number;
};

export type CreateExperimentOptions = {
  interval?: number;
  logText?: string;
};

export type RunResult = {
  fee: number;
  time: number;
};

export type ExperimentResult = {
  succeeded: number;
  success_rate: string;
  avg_time: string;
  quickest_time: string;
  slowest_time: string;
  total_fee: string;
  avg_fee: string;
};
/// Experiment END ///

export interface BondingCurveData {
  virtualTokenReserves: BN;
  virtualSolReserves: BN;
  realTokenReserves: BN;
  tokenTotalSupply: BN;
  complete: boolean;
}

export interface BlockInfo {
  blockHash: string;
  blockHeight: number;
  minContextSlot: number;
}

// export type instructionType = "buy" | "sell";

// export interface KeyBalances {
//   key: PublicKey;
//   preSolBalance: number;
//   postSolBalance: number;
//   preTokenBalance: number;
//   postTokenBalance: number;
//   tokenDecimals: number;
// }

// export interface CacheEntry {
//   timestamp: number;
//   type: instructionType;
// }

// export interface GeneratedWalletEntry {
//   token: string;
//   address: PublicKey;
//   comment?: string;
// }

// export interface TradeEntry {
//   type: "buy" | "sell" | "create";
//   mint: string;
//   timestamp: number;
//   amount?: number;
// }

// export interface heldCoinEntry {
//   mint: PublicKey;
//   amount: number;
//   metadata?: any;
//   curve: any;
// }

// export interface BuyBotCache {
//   alu: string;
//   mint: string;
//   wallets: Array<string>;
// }

// export interface VolumeBuyIntent {
//   lamports: number;
//   timestamp: number;
// }

// export interface VolumeTask {
//   id: string;
//   privateKey: string;
//   intents: Array<VolumeBuyIntent>;
//   buysMade: number;
//   heldTokens: number;
//   FeesSpent: number;
//   status: "pending" | "processing" | "completed";
// }

// export interface VolumeTransactionNeeds {
//   mainKeypair: string;
//   mint: string;
//   bondingCurve: string;
// }

// export type VolumeWorkerMessage =
//   | { type: "start_task"; task: VolumeTask }
//   | { type: "block_info"; info: BlockInfo }
//   | { type: "curve_info"; info: any }
//   | { type: "status_update"; status: "pending" | "processing" | "completed" }
//   | { type: "fee_update"; feesSpent: number }
//   | { type: "held_tokens_update"; heldTokens: number }
//   | { type: "buys_made_update"; buysMade: number }
//   | { type: "transaction_needs"; needs: VolumeTransactionNeeds }
//   | { type: "text_data"; text: string };

// //errors

// export type BundleErrorCategory =
//   | "Simulation Failure"
//   | "Internal Error"
//   | "State Auction Bid Rejected"
//   | "Dropped Bundle"
//   | "Winning Batch Bid Rejected";

// export interface BundleErrorEntry {
//   timestamp: string;
//   type: BundleErrorCategory;
//   details: string;
//   context: {
//     bundleId: string;
//   };
// }
