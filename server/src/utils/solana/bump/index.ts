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
  BUMP_SPLIPPAGE_DEFAULT,
  EVENT_AUTH,
  FEE_RECIPIENT,
  PUMP_TOKEN_DECIMALS,
  SERVICE_FEE_PERCENTAGE,
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
  calculateTokenToSolPrice,
  createExperiment,
  getBlockInfo,
  getBondingCurveData,
  initializeSolana,
} from "@/utils/solana/index.ts";
import {
  calculateTransactionFee,
  confirmTransaction,
  getOptimalTransactionOptionsFee,
  sendAndConfirmRawTransaction,
  sendTransaction,
} from "@/utils/solana/transactions.ts";
import { getBondingCurve, getGlobalState } from "@/utils/solana/pdas.ts";
import { MissingCreateBumpTransactionOptionsError } from "@/utils/solana/errors.ts";

export async function createBumpTransaction(
  connection: Connection,
  feeRecipientPubkey: PublicKey,
  user: Keypair,
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
    user.publicKey,
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
    user.publicKey,
    walletAta,
    user.publicKey,
    mint,
  );

  const transaction = new Transaction();
  const tokenPrice = calculateTokenToSolPrice(
    PUMP_TOKEN_DECIMALS,
    0,
    bondingCurveData,
  );
  const adjustedAmount = options.amount +
    options.amount * (options?.slippage ?? BUMP_SPLIPPAGE_DEFAULT);
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
      user: user.publicKey,
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
      user: user.publicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
      eventAuthority: EVENT_AUTH,
      program: program.programId,
    })
    .instruction();
  // Send fee amount to the fee recipient account
  const feePaymentTransaction = SystemProgram.transfer({
    fromPubkey: user.publicKey,
    toPubkey: feeRecipientPubkey,
    lamports: Math.floor(
      options.amount * LAMPORTS_PER_SOL * SERVICE_FEE_PERCENTAGE,
    ),
  });

  transaction.add(ataCreationIx);
  transaction.add(buyInstruction);
  transaction.add(sellInstruction);
  transaction.add(feePaymentTransaction);

  const blockInfo = await getBlockInfo(connection);
  transaction.recentBlockhash = blockInfo.blockHash;
  transaction.lastValidBlockHeight = blockInfo.blockHeight;
  transaction.minNonceContextSlot = blockInfo.minContextSlot;
  transaction.feePayer = user.publicKey;

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
    payerKey: user.publicKey,
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
  const { connection, keypair, program } = initializeSolana();
  const experiment = await createExperiment(
    runs,
    async () => {
      const { transaction, fee: feeUsed } = await createBumpTransaction(
        connection,
        keypair.publicKey,
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

export async function performBumpTransaction(
  connection: Connection,
  feeRecipientPubkey: PublicKey,
  user: Keypair,
  program: Program<Idl>,
  tokenAddress: string,
  options: CreateTransactionOptions,
) {
  const mint = new PublicKey(tokenAddress);
  const { transaction } = await createBumpTransaction(
    connection,
    feeRecipientPubkey,
    user,
    mint,
    program,
    options,
  );

  transaction.sign([user]);

  // const signature = await sendTransaction(connection, transaction);
  // await confirmTransaction(connection, signature);

  const signature = Math.random().toString(36).substring(7);
  const maxDelay = 5000;
  await new Promise((resolve) => setTimeout(resolve, Math.random() * maxDelay));
  if (Math.random() < 0.2) {
    throw new Error(`Transaction failed: ${signature}`);
  } // 80% success rate
}
