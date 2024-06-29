import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
export type instructionType = "buy" | "sell";

export interface KeyBalances {
  key: PublicKey;
  preSolBalance: number;
  postSolBalance: number;
  preTokenBalance: number;
  postTokenBalance: number;
  tokenDecimals: number;
}

export interface CacheEntry {
  timestamp: number;
  type: instructionType;
}

export interface GeneratedWalletEntry {
  token: string;
  address: PublicKey;
  comment?: string;
}

export type CreateTransactionOptionsFee = {
  optimal?: boolean;
  amount?: number;
};

export interface CreateTransactionOptions {
  /** The transaction amount in SOL */
  amount: number;
  /** The slippage as a whole number */
  slippage?: number;
  /** The priority fee in SOL */
  fee?: CreateTransactionOptionsFee;
}

export interface TradeEntry {
  type: "buy" | "sell" | "create";
  mint: string;
  timestamp: number;
  amount?: number;
}

export interface BlockInfo {
  blockHash: string;
  blockHeight: number;
  minContextSlot: number;
}

export interface BondingCurveData {
  virtualTokenReserves: BN;
  virtualSolReserves: BN;
  realTokenReserves: BN;
  tokenTotalSupply: BN;
  complete: boolean;
}

export interface heldCoinEntry {
  mint: PublicKey;
  amount: number;
  metadata?: any;
  curve: any;
}

export interface BuyBotCache {
  alu: string;
  mint: string;
  wallets: Array<string>;
}

export interface VolumeBuyIntent {
  lamports: number;
  timestamp: number;
}

export interface VolumeTask {
  id: string;
  privateKey: string;
  intents: Array<VolumeBuyIntent>;
  buysMade: number;
  heldTokens: number;
  FeesSpent: number;
  status: "pending" | "processing" | "completed";
}

export interface VolumeTransactionNeeds {
  mainKeypair: string;
  mint: string;
  bondingCurve: string;
}

export type VolumeWorkerMessage =
  | { type: "start_task"; task: VolumeTask }
  | { type: "block_info"; info: BlockInfo }
  | { type: "curve_info"; info: any }
  | { type: "status_update"; status: "pending" | "processing" | "completed" }
  | { type: "fee_update"; feesSpent: number }
  | { type: "held_tokens_update"; heldTokens: number }
  | { type: "buys_made_update"; buysMade: number }
  | { type: "transaction_needs"; needs: VolumeTransactionNeeds }
  | { type: "text_data"; text: string };

//errors

export type BundleErrorCategory =
  | "Simulation Failure"
  | "Internal Error"
  | "State Auction Bid Rejected"
  | "Dropped Bundle"
  | "Winning Batch Bid Rejected";

export interface BundleErrorEntry {
  timestamp: string;
  type: BundleErrorCategory;
  details: string;
  context: {
    bundleId: string;
  };
}
