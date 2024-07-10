import { Idl, Program } from "@coral-xyz/anchor";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { ExperimentParams } from "@/constants/types.ts";
import {
  createExperiment,
  getBlockInfo,
  initializeScript,
} from "@/utils/solana/index.ts";
import { getGlobalState } from "@/utils/solana/pdas.ts";
import {
  calculateTransactionFee,
  getOptimalTransactionOptionsFee,
  sendAndConfirmRawTransaction,
} from "@/utils/solana/transactions.ts";

async function createWalletConnectTransaciton(
  connection: Connection,
  master: Keypair,
  user: PublicKey,
  program: Program<Idl>,
) {
  const transaction = new Transaction();
  const instruction = await program.methods
    .initialize()
    .accounts({
      global: getGlobalState(program.programId),
      user: user,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  transaction.add(instruction);

  const blockInfo = await getBlockInfo(connection);
  transaction.recentBlockhash = blockInfo.blockHash;
  transaction.lastValidBlockHeight = blockInfo.blockHeight;
  transaction.minNonceContextSlot = blockInfo.minContextSlot;
  transaction.feePayer = master.publicKey;

  const [microLamports, units] = await getOptimalTransactionOptionsFee(
    connection,
    transaction,
    "optimal",
  );

  transaction.instructions.unshift(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
    ComputeBudgetProgram.setComputeUnitLimit({ units }),
  );

  const messageV0 = new TransactionMessage({
    payerKey: master.publicKey,
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

export async function connectWallet() {
  const { connection, keypair, program } = initializeScript();
  const { transaction, fee: feeUsed } = await createWalletConnectTransaciton(
    connection,
    keypair,
    new PublicKey("DBLFFHQfaWrr8RNQWd683k67nkSJ9tVkqK6228nRWeog"),
    program,
  );
  transaction.sign([keypair]);

  const signature = await sendAndConfirmRawTransaction(connection, transaction);
  console.log(`Transaction confirmed: ${signature}`);
  return feeUsed;
}
