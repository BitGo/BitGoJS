/**
 * @prettier
 */
import { AccountMeta, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
const BigNumber = require('bignumber.js');

/*
  IMPORTANT:

  Since token transfer encoding and decoding is in alpha (v 0.2.0-alpha.2), a version that is currently not functional due to typing bugs,
  this file is the cherry-picked methods that are required to complete the token transfer feature. When the Solana foundation releases a stable
  version, this file should be deleted and the spl-token methods should be used.
 */

export enum TokenInstruction {
  InitializeMint = 0,
  InitializeAccount = 1,
  InitializeMultisig = 2,
  Transfer = 3,
  Approve = 4,
  Revoke = 5,
  SetAuthority = 6,
  MintTo = 7,
  Burn = 8,
  CloseAccount = 9,
  FreezeAccount = 10,
  ThawAccount = 11,
  TransferChecked = 12,
  ApproveChecked = 13,
  MintToChecked = 14,
  BurnChecked = 15,
  InitializeAccount2 = 16,
  SyncNative = 17,
  InitializeAccount3 = 18,
  InitializeMultisig2 = 19,
  InitializeMint2 = 20,
}

export abstract class TokenError extends Error {
  name: string;
  constructor(message?: string) {
    super(message);
  }
}

/** Thrown if an instruction's program is invalid */
export class TokenInvalidInstructionProgramError extends TokenError {
  name = 'TokenInvalidInstructionProgramError';
}

/** Thrown if an instruction's keys are invalid */
export class TokenInvalidInstructionKeysError extends TokenError {
  name = 'TokenInvalidInstructionKeysError';
}

/** Thrown if an instruction's type is invalid */
export class TokenInvalidInstructionTypeError extends TokenError {
  name = 'TokenInvalidInstructionTypeError';
}

/** A decoded, valid TransferChecked instruction */
export interface DecodedTransferCheckedInstruction {
  programId: PublicKey;
  keys: {
    source: AccountMeta;
    mint: AccountMeta;
    destination: AccountMeta;
    owner: AccountMeta;
    multiSigners: AccountMeta[];
  };
  data: {
    instruction: TokenInstruction.TransferChecked;
    amount: number;
    decimals: number;
  };
}

/**
 * Decode a TransferChecked instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeTransferCheckedInstruction(
  instruction: TransactionInstruction,
  programId = TOKEN_PROGRAM_ID,
): DecodedTransferCheckedInstruction {
  if (!instruction.programId.equals(programId)) throw new TokenInvalidInstructionProgramError();

  const {
    keys: { source, mint, destination, owner, multiSigners },
    data,
  } = decodeTransferCheckedInstructionUnchecked(instruction);
  if (data.instruction !== TokenInstruction.TransferChecked) throw new TokenInvalidInstructionTypeError();
  if (!source || !mint || !destination || !owner) throw new TokenInvalidInstructionKeysError();

  return {
    programId,
    keys: {
      source,
      mint,
      destination,
      owner,
      multiSigners,
    },
    data,
  };
}

/** A decoded, non-validated TransferChecked instruction */
export interface DecodedTransferCheckedInstructionUnchecked {
  programId: PublicKey;
  keys: {
    source: AccountMeta | undefined;
    mint: AccountMeta | undefined;
    destination: AccountMeta | undefined;
    owner: AccountMeta | undefined;
    multiSigners: AccountMeta[];
  };
  data: {
    instruction: number;
    amount: number;
    decimals: number;
  };
}

function readBigUInt64LE(buffer, offset = 0) {
  const first = buffer[offset];
  const last = buffer[offset + 7];
  if (first === undefined || last === undefined) {
    throw new Error('Out of bounds');
  }

  const lo = first + buffer[++offset] * 2 ** 8 + buffer[++offset] * 2 ** 16 + buffer[++offset] * 2 ** 24;
  const hi = buffer[++offset] + buffer[++offset] * 2 ** 8 + buffer[++offset] * 2 ** 16 + last * 2 ** 24;

  return (BigNumber(lo) + (BigNumber(hi) << BigNumber(32))) / 10;
}

/**
 * Decode a TransferChecked instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
function decodeTransferCheckedInstructionUnchecked({
  programId,
  keys: [source, mint, destination, owner, ...multiSigners],
  data,
}: TransactionInstruction): DecodedTransferCheckedInstructionUnchecked {
  const type = data.slice(0, 1).readUInt8(0);
  const amount = readBigUInt64LE(data.slice(1, 9), 0);
  const decimals = data.slice(9).readUInt8(0);
  return {
    programId,
    keys: {
      source,
      mint,
      destination,
      owner,
      multiSigners,
    },
    data: {
      instruction: type,
      amount: amount,
      decimals: decimals,
    },
  };
}
