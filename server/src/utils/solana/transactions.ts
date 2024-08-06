import {
  ComputeBudgetProgram,
  Connection,
  LAMPORTS_PER_SOL,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

import {
  BASE_COMPUTE_UNITS,
  BASE_PRIORITY_FEE_LAMPORTS,
  BASE_PRIORITY_FEE_MICRO_LAMPORTS,
  MAX_PRIORITY_FEE_MICRO_LAMPORTS,
  MICRO_LAMPORT_PER_LAMPORT,
} from "@/constants/index.ts";
import { PriorityLevel } from "@/constants/types.ts";
import { TransactionExpiredError } from "@/utils/solana/errors.ts";
import { env } from "@/utils/env.ts";
import { logger } from "@/utils/logger.ts";

const HELIUS_API_URL = env("HELIUS_API_URL")!;
if (!HELIUS_API_URL) {
  throw new Error("HELIUS_API_URL not set");
}

/**
 * Calculate the transaction fee in SOL from microLamports and Compute Units (CU)
 *
 * @param microLamports The priority fee in microLamports
 * @param units The Compute Units (CU) consumed by the transaction
 * @returns the fee in SOL
 */
export function calculateTransactionFee(microLamports: number, units: number) {
  return (
    ((microLamports * units) / MICRO_LAMPORT_PER_LAMPORT +
      BASE_PRIORITY_FEE_LAMPORTS) /
    LAMPORTS_PER_SOL
  );
}

//
// Transaction fee calculations:
//
// Calculate the fee in SOL:
//  (microLamports * ComputeUnits / MICRO_LAMPORT_PER_LAMPORT + BASE_PRIORITY_FEE_LAMPORTS) / LAMPORTS_PER_SOL
//
// Calculate the fee in microLamports (excluding the base priority fee):
//  ((feeInSOL * LAMPORTS_PER_SOL) - 5000) * MICRO_LAMPORT_PER_LAMPORT - BASE_PRIORITY_FEE_LAMPORTS
//
// Calculate the fee in microLamports per Compute Unit (CU):
//  microLamports - BASE_PRIORITY_FEE_LAMPORTS / CU

/**
 * Get the priority fee unit price to set the fee as close to the desired fee as possible
 *
 * @param fee The desired fee in SOL
 * @param units The estimated Compute Units (CU) that will be consumed by the transaction
 * @returns the unit price in microLamports for the priority fee
 */
export function calcPriorityFeeUnitPrice(fee: number, units: number) {
  const feeInMicroLamports = (fee * LAMPORTS_PER_SOL - 5000) *
    MICRO_LAMPORT_PER_LAMPORT;
  return Math.round((feeInMicroLamports - BASE_PRIORITY_FEE_LAMPORTS) / units);
}

/**
 * Given a transaction and a fees options object, check the values and determine
 * either the estimated optimal fee or the specified fee amount.
 *
 * @param connection
 * @param transaction
 * @param fee
 * @returns tuple of the microLamports and Compute Units (CU) to set for the priority fee
 */
export async function getOptimalTransactionOptionsFee(
  connection: Connection,
  transaction: Transaction,
  fee: "optimal" | number,
) {
  let microLamports = BASE_PRIORITY_FEE_MICRO_LAMPORTS;
  let units = BASE_COMPUTE_UNITS;

  if (fee === "optimal") {
    const [priorityFee, ComputeUnits] = await getOptimalPriceAndBudget(
      transaction,
      connection,
    );
    microLamports = priorityFee;
    units = ComputeUnits;
  } else {
    units = (await getComputeUnitsForTransaction(transaction, connection)) ||
      BASE_COMPUTE_UNITS;
    microLamports = calcPriorityFeeUnitPrice(fee, units);
  }

  return [microLamports, units];
}

/**
 * @param connection connection
 * @param transaction signed transaction
 * @param options
 * @returns
 */
export async function sendTransaction(
  connection: Connection,
  transaction: VersionedTransaction,
  options: {
    skipPreflight?: boolean;
    maxRetries?: number;
  } = {
    skipPreflight: true,
    maxRetries: 3,
  },
) {
  const signature = await connection.sendRawTransaction(
    transaction.serialize(),
    options,
  );
  return signature;
}

export async function confirmTransaction(
  connection: Connection,
  signature: string,
) {
  const latestBlock = await connection.getLatestBlockhash("finalized");
  const status = await connection.confirmTransaction({
    signature,
    blockhash: latestBlock.blockhash,
    lastValidBlockHeight: latestBlock.lastValidBlockHeight,
  });

  if (status.value?.err) {
    throw new TransactionExpiredError(signature);
  }
  return signature;
}

/**
 * @param connection
 * @param transaction
 * @returns the signature of the confirmed transaction
 * @throws if the transaction wasn't sent or confirmed
 */
export async function sendAndConfirmRawTransaction(
  connection: Connection,
  transaction: VersionedTransaction,
  log = false,
) {
  const signature = await sendTransaction(connection, transaction);
  if (log) {
    logger.info(`Confirming... https://explorer.solana.com/tx/${signature}`);
  }
  return await confirmTransaction(connection, signature);
}

/**
 * https://docs.helius.dev/solana-rpc-nodes/sending-transactions-on-solana#optimize-the-transactions-compute-unit-cu-usage
 *
 * @param tx
 * @param connection
 * @returns
 */
export async function getComputeUnitsForTransaction(
  tx: Transaction,
  connection: Connection,
) {
  try {
    const newTx = new Transaction();
    newTx.add(
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 }),
    );
    newTx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }));
    newTx.add(...tx.instructions);
    newTx.recentBlockhash = tx.recentBlockhash;
    newTx.lastValidBlockHeight = tx.lastValidBlockHeight;
    newTx.feePayer = tx.feePayer;
    const simulation = await connection.simulateTransaction(
      new VersionedTransaction(newTx.compileMessage()),
      { sigVerify: false },
    );

    // If the simulation failed, then the required lamports and CU is
    // greater than what is provided
    if (simulation.value.err) {
      return BASE_COMPUTE_UNITS;
    }
    return simulation.value.unitsConsumed ?? BASE_COMPUTE_UNITS;
  } catch (error) {
    logger.error("Error getting compute units for transaction", error);
    return BASE_COMPUTE_UNITS;
  }
}

export async function getPriorityFeeEstimateForTransaction(
  tx: Transaction,
  priorityLevel: PriorityLevel = "veryHigh",
) {
  try {
    const jsonPayload = {
      jsonrpc: "2.0",
      id: "1",
      method: "getPriorityFeeEstimate",
      params: [
        {
          transaction: bs58.encode(
            tx.serialize({
              verifySignatures: false,
              requireAllSignatures: false,
            }),
          ),
          options: { includeAllPriorityFeeLevels: true },
        },
      ],
    };
    const res = await fetch(HELIUS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonPayload),
    }).then((res) => res.json());

    const fee = res.result.priorityFeeLevels[priorityLevel] as number;
    // Cap the priority fee price to prevent overpaying too much
    return Math.min(Math.floor(fee * 2), MAX_PRIORITY_FEE_MICRO_LAMPORTS);
  } catch (error) {
    logger.error("Error getting priority fee estimate for transaction", error);
    return BASE_PRIORITY_FEE_MICRO_LAMPORTS;
  }
}

export async function getOptimalPriceAndBudget(
  transaction: Transaction,
  connection: Connection,
) {
  const [priorityFee, ComputeUnits] = await Promise.all([
    getPriorityFeeEstimateForTransaction(transaction),
    getComputeUnitsForTransaction(transaction, connection),
  ]);
  return [priorityFee, ComputeUnits];
}
