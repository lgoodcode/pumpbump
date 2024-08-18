import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { AnchorProvider, Idl, Program, Wallet } from "@coral-xyz/anchor";
import bs58 from "bs58";
import { captureException } from "Sentry";

import idl from "@/constants/idl.json" with { type: "json" };
import { PROGRAM_ID } from "@/constants/index.ts";
import {
  BlockInfo,
  BondingCurveData,
  CreateExperimentOptions,
  ExperimentResult,
  RunResult,
} from "@/constants/types.ts";
import { env } from "@/utils/env.ts";
import { logger } from "@/utils/logger.ts";
import {
  BlockInfoFetchError,
  InvalidExperiementIntervalError,
} from "@/utils/solana/errors.ts";

/**
 * The minimum time to wait between experiments (creating transactions). This is because
 * all the parameters are the same so, if we create transactions too quickly, it allows
 * for duplicate transactions to be created, which will definitely fail and waste money.
 */
export const MINUMUM_EXPERIMENT_INTERVAL = 1500;

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function validateSolAddress(address: string) {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBuffer());
    // Ignore the error as we only care if the address is valid
  } catch (_) {
    return false;
  }
}

export function getKeypairFromBs58(bs58String: string): Keypair {
  try {
    const privateKeyObject = bs58.decode(bs58String);
    const privateKey = Uint8Array.from(privateKeyObject);
    return Keypair.fromSecretKey(privateKey);
  } catch (_) {
    const errorString = bs58String.length > 8
      ? bs58String.substring(0, 8) + "..."
      : bs58String;
    throw new Error(`Invalid Keypair: ${errorString}`);
  }
}

export function getSignerKeypair() {
  const privateKeyString = env("SIGNER_PRIVATE_KEY");
  if (!privateKeyString) {
    throw new Error("SIGNER_PRIVATE_KEY is required");
  }

  return getKeypairFromBs58(privateKeyString);
}

export function shortPubKey(pubkey: string | PublicKey | Keypair) {
  if (typeof pubkey === "string") {
    return pubkey.slice(0, 6);
  } else if (pubkey instanceof PublicKey) {
    return pubkey.toBase58().slice(0, 6);
  }
  return pubkey.publicKey.toBase58().slice(0, 6);
}

export function createProgram(connection: Connection, keypair: Keypair) {
  return new Program(
    idl as Idl,
    PROGRAM_ID,
    new AnchorProvider(
      connection,
      new Wallet(keypair),
      AnchorProvider.defaultOptions(),
    ),
  );
}

/**
 * Checks the environment variables and creates the required connection, keypair,
 * and program for the script to run and returns them.
 */
export function initializeSolana() {
  const connection = new Connection(env("RPC_URL"), "confirmed");
  const keypair = getKeypairFromBs58(env("SIGNER_PRIVATE_KEY"));
  const feeRecipientPubkey = new PublicKey(env("FEE_RECIPIENT_PUBKEY"));
  const program = createProgram(connection, keypair);

  return {
    connection,
    keypair,
    feeRecipientPubkey,
    program,
  };
}

/**
 * Give a promise that will return the time it took to run the experiment and
 * the number of successful experiments.
 *
 * @param runs the number of times to run the experiment
 * @param experiment the experiment to run that returns the fee used. This should return the fee, in SOL, used in the transaction
 * @param interval time in milliseconds between each experiment run
 * @returns the results of the experiment
 */
export async function createExperiment(
  runs: number,
  experiment: () => Promise<number>,
  options: CreateExperimentOptions,
): Promise<ExperimentResult> {
  const interval = options?.interval || MINUMUM_EXPERIMENT_INTERVAL;

  if (interval < MINUMUM_EXPERIMENT_INTERVAL) {
    throw new InvalidExperiementIntervalError(interval);
  }

  const results = await Promise.all(
    Array.from({ length: runs }, (_, i) => {
      return new Promise<RunResult | null>((resolve) => {
        setTimeout(async () => {
          try {
            if (options?.logText) {
              logger.info(`${options.logText} ${i + 1}`);
            }

            const start = performance.now();
            const fee = await experiment();

            if (options.logText) {
              logger.info(`${options.logText} ${i + 1} fee: ${fee}`);
            }

            resolve({
              fee,
              time: parseFloat(((performance.now() - start) / 1000).toFixed(2)),
            });
          } catch (error) {
            logger.error(error);
            resolve(null);
          }
        }, i * interval);
      });
    }),
  );

  const values = results
    .filter((result) => result !== null)
    .map((result) => result as RunResult); // Weird TS compile error without this
  const times = values.map((result) => result.time);
  const fees = values.map((result) => result.fee);

  const total_time = times.reduce((acc, curr) => acc + curr, 0);
  const avg_time = total_time / values.length;
  const quickest_time = Math.min(...times);
  const slowest_time = Math.max(...times);

  const total_fee = fees.reduce((acc, curr) => acc + curr, 0);
  const avg_fee = total_fee / values.length;

  return {
    succeeded: values.length,
    success_rate: (values.length / runs) * 100 + "%",
    avg_time: avg_time.toFixed(2) + "s",
    quickest_time: quickest_time.toFixed(2) + "s",
    slowest_time: slowest_time.toFixed(2) + "s",
    total_fee: total_fee.toFixed(6) + " SOL",
    avg_fee: avg_fee.toFixed(6) + " SOL",
  };
}

export const getBondingCurveData = async (
  program: Program<Idl>,
  bondingCurvePda: PublicKey,
): Promise<BondingCurveData> => {
  const data = await program.account.bondingCurve.fetchNullable(
    bondingCurvePda,
  );
  if (!data) {
    throw new Error(
      "Bonding curve data not found - no Pump pool found for for this address",
    );
  }
  return data as unknown as BondingCurveData;
};

/**
 * Calculates the price in SOL for a token based on the bonding curve data
 * and the token decimals and current price.
 *
 * @param tokenDecimals
 * @param currentPrice
 * @param curveInfo
 * @returns
 */
export const calculateTokenToSolPrice = (
  tokenDecimals: number,
  currentPrice: number,
  curveInfo: BondingCurveData,
) => {
  try {
    const virtualTokenReserves = curveInfo.virtualTokenReserves;
    const virtualSolReserves = curveInfo.virtualSolReserves;

    // @ts-ignore -- BN can perform math operations
    const adjustedVirtualTokenReserves = virtualTokenReserves /
      10 ** tokenDecimals;
    // @ts-ignore -- BN can perform math operations
    const adjustedVirtualSolReserves = virtualSolReserves / LAMPORTS_PER_SOL;

    const virtualTokenPrice = adjustedVirtualSolReserves /
      adjustedVirtualTokenReserves;
    return virtualTokenPrice;
  } catch (error: unknown) {
    logger.warn("Failed to calculate price", error);
    captureException(error);
    return currentPrice;
  }
};

export async function getBlockInfo(connection: Connection): Promise<BlockInfo> {
  const maxAttempts = 5;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      const hashAndCtx = await connection.getLatestBlockhashAndContext(
        "finalized",
      );
      return {
        minContextSlot: hashAndCtx.context.slot,
        blockHeight: hashAndCtx.value.lastValidBlockHeight,
        blockHash: hashAndCtx.value.blockhash,
      };
    } catch (error) {
      logger.warn("Failed to fetch block info", error);
    }

    await sleep(1000);
    attempt += 1;
  }

  throw new BlockInfoFetchError();
}
