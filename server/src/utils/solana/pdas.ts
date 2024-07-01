import { PublicKey } from "@solana/web3.js";
import { utils } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@/utils/solana/spl-token.ts";

// Metadata pda
export function getMetadataPda(mint: PublicKey) {
  const [metadataPda, _] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      mint.toBuffer(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
  );
  return metadataPda;
}

// Master edition pda
export function getMasterEditionPda(mint: PublicKey) {
  const [masterEditionPda, _] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
  );
  return masterEditionPda;
}

// Token record pda
export function getTokenRecord(mint: PublicKey, ata: PublicKey) {
  const [TokenRecord, _] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      mint.toBuffer(),
      Buffer.from("token_record"),
      ata.toBuffer(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
  );
  return TokenRecord;
}

// Metadata delegate pda
export function getMetadataDelegateRecord(
  mint: PublicKey,
  delegate: PublicKey,
  updateAuthority: PublicKey,
) {
  const [pda, _] = PublicKey.findProgramAddressSync(
    [
      utils.bytes.utf8.encode("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      mint.toBuffer(),
      utils.bytes.utf8.encode("update"),
      updateAuthority.toBuffer(),
      delegate.toBuffer(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
  );
  return pda;
}

// Global state pda
export function getGlobalState(programId: PublicKey) {
  const [pda, _] = PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("global")],
    programId,
  );
  return pda;
}

// Mint authority pda
export function getMintAuthority(programId: PublicKey) {
  const [pda, _] = PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("mint-authority")],
    programId,
  );
  return pda;
}

// Bonding curve pda
export function getBondingCurve(mint: PublicKey, programId: PublicKey) {
  const [pda, _] = PublicKey.findProgramAddressSync(
    [utils.bytes.utf8.encode("bonding-curve"), mint.toBuffer()],
    programId,
  );
  return pda;
}

// Associated token address (ATA)
export const getAssociatedTokenAddress = (
  owner: PublicKey,
  mint: PublicKey,
) => {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
};
