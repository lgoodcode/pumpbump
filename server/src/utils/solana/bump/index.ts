import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { Idl, Program } from "@coral-xyz/anchor";
import { BN } from "BN";

import {
  BASE_COMPUTE_UNITS,
  BASE_PRIORITY_FEE_MICRO_LAMPORTS,
  BASE_SPLIPPAGE,
  EVENT_AUTH,
  FEE_RECIPIENT,
  PUMP_TOKEN_DECIMALS,
} from "@/constants/index.ts";
import {
  CreateTransactionOptions,
  ExperimentParams,
} from "@/constants/types.ts";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@/utils/solana/spl-token.ts";
import {
  createExperiment,
  getBlockInfo,
  getBondingCurveData,
  getPrice,
  initializeScript,
} from "@/utils/solana/index.ts";
import {
  calculateTransactionFee,
  getOptimalTransactionOptionsFee,
  sendAndConfirmRawTransaction,
} from "@/utils/solana/transactions.ts";
import { getBondingCurve, getGlobalState } from "@/utils/solana/pdas.ts";
import { MissingCreateBumpTransactionOptionsError } from "@/utils/solana/errors.ts";

export async function createBumpTransaction(
  connection: Connection,
  keypair: Keypair,
  mint: PublicKey,
  program: Program<Idl>,
  options: CreateTransactionOptions,
) {
  if (!options) {
    throw new MissingCreateBumpTransactionOptionsError();
  }

  // Get the Associated Token Account for the user. If the account does not exist,
  // it will be created using the idempotent instruction, so even if it exists,
  // the instruction will not fail.
  const walletAta = getAssociatedTokenAddressSync(
    mint,
    keypair.publicKey,
    false,
  );

  const bondingCurvePda = getBondingCurve(mint, program.programId);
  const bondingCurveData = await getBondingCurveData(program, bondingCurvePda);

  if (!bondingCurveData) {
    throw new Error(
      `Bonding curve data not found - no Pump pool found for this address: ${mint.toBase58()}`,
    );
  }

  const bondingCurveAta = getAssociatedTokenAddressSync(
    mint,
    bondingCurvePda,
    true,
  );

  // Create Associated Token Account, if not already exists
  // This is an idempotent instruction, so it will not fail if the account already exists
  // and is necessary to ensure the user has an ATA to interact with the program while
  // keeping the transaction atomic and not requiring a round trip to the network.
  const ataCreationIx = createAssociatedTokenAccountIdempotentInstruction(
    keypair.publicKey,
    walletAta,
    keypair.publicKey,
    mint,
  );

  const transaction = new Transaction();
  const tokenPrice = getPrice(PUMP_TOKEN_DECIMALS, 0, bondingCurveData);
  const adjustedAmount = options.amount +
    options.amount * (options?.slippage ?? BASE_SPLIPPAGE);
  const finalAmount = options.amount / tokenPrice;

  // The methods are defined in the IDL file. We specify the arguments required by the
  // method and call it to generate the instructions for the transaction.
  const buyInstruction = await program.methods
    .buy(
      new BN(Math.floor(finalAmount * 10 ** PUMP_TOKEN_DECIMALS)), // amount
      new BN(adjustedAmount * LAMPORTS_PER_SOL), // maxSolCost
    )
    .accounts({
      global: getGlobalState(program.programId),
      feeRecipient: FEE_RECIPIENT,
      mint,
      bondingCurve: bondingCurvePda,
      associatedBondingCurve: bondingCurveAta,
      associatedUser: walletAta,
      user: keypair.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
      eventAuthority: EVENT_AUTH,
      program: program.programId,
    })
    .instruction();

  const sellInstruction = await program.methods
    .sell(
      new BN(Math.floor(finalAmount * 10 ** PUMP_TOKEN_DECIMALS)), // amount
      new BN(0), // minSolCost
    )
    .accounts({
      global: getGlobalState(program.programId),
      feeRecipient: FEE_RECIPIENT,
      mint,
      bondingCurve: bondingCurvePda,
      associatedBondingCurve: bondingCurveAta,
      associatedUser: walletAta,
      user: keypair.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
      eventAuthority: EVENT_AUTH,
      program: program.programId,
    })
    .instruction();

  transaction.add(ataCreationIx);
  transaction.add(buyInstruction);
  transaction.add(sellInstruction);

  const blockInfo = await getBlockInfo(connection);
  transaction.recentBlockhash = blockInfo.blockHash;
  transaction.lastValidBlockHeight = blockInfo.blockHeight;
  transaction.minNonceContextSlot = blockInfo.minContextSlot;
  transaction.feePayer = keypair.publicKey;

  // The network fee
  let microLamports = BASE_PRIORITY_FEE_MICRO_LAMPORTS;
  let units = BASE_COMPUTE_UNITS;

  if (options?.fee) {
    [microLamports, units] = await getOptimalTransactionOptionsFee(
      connection,
      transaction,
      options?.fee,
    );
  }

  transaction.instructions.unshift(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
    ComputeBudgetProgram.setComputeUnitLimit({ units }),
  );

  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    instructions: transaction.instructions,
    recentBlockhash: blockInfo.blockHash,
  }).compileToV0Message();
  const versionedTransaction = new VersionedTransaction(messageV0);
  const fee = calculateTransactionFee(microLamports, units); // The network fee in SOL

  return {
    transaction: versionedTransaction,
    fee,
  };
}

export async function bumpExperiment(
  { mint, runs, amount, slippage, fee }: ExperimentParams,
) {
  const { connection, keypair, program } = initializeScript();
  const experiment = await createExperiment(
    runs,
    async () => {
      const { transaction, fee: feeUsed } = await createBumpTransaction(
        connection,
        keypair,
        new PublicKey(mint),
        program,
        {
          amount,
          slippage,
          fee,
        },
      );
      transaction.sign([keypair]);

      await sendAndConfirmRawTransaction(connection, transaction);

      return feeUsed;
    },
    {
      logText: "Bump",
    },
  );

  return experiment;
}
