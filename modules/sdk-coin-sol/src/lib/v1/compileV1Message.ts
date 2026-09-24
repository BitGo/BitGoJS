import { BuildTransactionError, SolV1TransactionConfig } from '@bitgo/sdk-core';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  AccountRole,
  address,
  appendTransactionMessageInstructions,
  compileTransactionMessage,
  createTransactionMessage,
  getCompiledTransactionMessageEncoder,
  pipe,
  setTransactionMessageConfig,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Blockhash,
  type V1TransactionConfig,
} from '@solana/kit';

const COMPUTE_BUDGET_PROGRAM_ID = 'ComputeBudget111111111111111111111111111111';
const SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR = 2;
const SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR = 3;
const MICRO_LAMPORTS_PER_LAMPORT = 1_000_000;

function toKitInstruction(instruction: TransactionInstruction) {
  return {
    programAddress: address(instruction.programId.toBase58()),
    accounts: instruction.keys.map((k) => ({
      address: address(k.pubkey.toBase58()),
      role: k.isSigner
        ? k.isWritable
          ? AccountRole.WRITABLE_SIGNER
          : AccountRole.READONLY_SIGNER
        : k.isWritable
        ? AccountRole.WRITABLE
        : AccountRole.READONLY,
    })),
    data: instruction.data,
  };
}

function readU32LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24);
}

function readU64LE(data: Uint8Array, offset: number): number {
  let value = 0;
  for (let i = 0; i < 8; i++) {
    value += Number(data[offset + i]) * Math.pow(2, 8 * i);
  }
  return value;
}

function stripComputeBudgetInstructions(
  instructions: TransactionInstruction[],
  transactionConfig: SolV1TransactionConfig
): { instructions: TransactionInstruction[]; config: SolV1TransactionConfig } {
  const filtered: TransactionInstruction[] = [];
  const config: SolV1TransactionConfig = { ...transactionConfig };

  for (const instruction of instructions) {
    const isComputeBudget = instruction.programId.toBase58() === COMPUTE_BUDGET_PROGRAM_ID;
    const discriminator = instruction.data?.[0];

    if (isComputeBudget && discriminator === SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR) {
      if (config.computeUnitLimit === null) {
        config.computeUnitLimit = readU32LE(instruction.data, 1);
      }
      continue;
    }

    if (isComputeBudget && discriminator === SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR) {
      if (config.priorityFee === null && config.computeUnitLimit !== null) {
        const microLamports = readU64LE(instruction.data, 1);
        config.priorityFee = Math.ceil((microLamports * config.computeUnitLimit) / MICRO_LAMPORTS_PER_LAMPORT);
      }
      continue;
    }

    filtered.push(instruction);
  }

  return { instructions: filtered, config };
}

function toKitV1Config(config: SolV1TransactionConfig): V1TransactionConfig {
  const kitConfig: V1TransactionConfig = {};
  if (config.computeUnitLimit !== null) {
    kitConfig.computeUnitLimit = config.computeUnitLimit;
  }
  if (config.heapSize !== null) {
    kitConfig.heapSize = config.heapSize;
  }
  if (config.loadedAccountsDataSizeLimit !== null) {
    kitConfig.loadedAccountsDataSizeLimit = config.loadedAccountsDataSizeLimit;
  }
  if (config.priorityFee !== null) {
    kitConfig.priorityFeeLamports = BigInt(config.priorityFee);
  }
  return kitConfig;
}

export function compileV1Message(args: {
  instructions: TransactionInstruction[];
  feePayer: PublicKey;
  recentBlockhash: string;
  transactionConfig: SolV1TransactionConfig;
}): Uint8Array {
  const { instructions, feePayer, recentBlockhash, transactionConfig } = args;

  if (!instructions || instructions.length === 0) {
    throw new BuildTransactionError('At least one instruction is required to compile a v1 transaction');
  }
  if (!transactionConfig) {
    throw new BuildTransactionError('transactionConfig is required to compile a v1 transaction');
  }

  const { instructions: filteredInstructions, config } = stripComputeBudgetInstructions(
    instructions,
    transactionConfig
  );
  const kitInstructions = filteredInstructions.map(toKitInstruction);

  const message = pipe(
    createTransactionMessage({ version: 1 }),
    (m) => setTransactionMessageFeePayer(address(feePayer.toBase58()), m),
    // lastValidBlockHeight is metadata only: kit does not serialize it into the v1 wire bytes,
    // and submission is handled by the caller directly, so a non-zero placeholder is not needed.
    (m) =>
      setTransactionMessageLifetimeUsingBlockhash(
        { blockhash: recentBlockhash as Blockhash, lastValidBlockHeight: 0n },
        m
      ),
    (m) => appendTransactionMessageInstructions(kitInstructions, m),
    (m) => setTransactionMessageConfig(toKitV1Config(config), m)
  );

  let compiled;
  try {
    compiled = compileTransactionMessage(message);
  } catch (e) {
    throw new BuildTransactionError(
      `Failed to compile v1 transaction message: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  return new Uint8Array(getCompiledTransactionMessageEncoder().encode(compiled));
}
