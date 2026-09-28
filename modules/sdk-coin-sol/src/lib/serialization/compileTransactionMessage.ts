import { BuildTransactionError } from '@bitgo/sdk-core';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { encodeV1Message, V1MessageHeader } from './codecs/v1/message';
import { encodeConfigMaskAndValues } from './codecs/v1/config';
import { CompiledInstruction } from './codecs/v1/instruction';

/** Supported Solana transaction versions. Only 1 (SIMD-0296/0385) is implemented. */
export type TransactionVersion = 0 | 1;

/**
 * Configuration for a v1 transaction, mirroring the shared sdk-core type.
 * All values are optional (null = unset); priorityFee is total lamports.
 */
export interface TransactionConfig {
  computeUnitLimit: number | null;
  heapSize: number | null;
  loadedAccountsDataSizeLimit: number | null;
  priorityFee: number | null; // lamports (total)
}

// AccountRole bit values (mirror @solana/instructions).
const READONLY = 0;
const WRITABLE = 1;
const READONLY_SIGNER = 2;
const WRITABLE_SIGNER = 3;

const COMPUTE_BUDGET_PROGRAM_ID = 'ComputeBudget111111111111111111111111111111';
const SET_COMPUTE_UNIT_LIMIT_DISCRIMINATOR = 2;
const SET_COMPUTE_UNIT_PRICE_DISCRIMINATOR = 3;
const MICRO_LAMPORTS_PER_LAMPORT = 1_000_000;

const MAX_ACCOUNTS = 64;
const MAX_SIGNERS = 12;
const MAX_INSTRUCTIONS = 64;
const MAX_ACCOUNTS_PER_INSTRUCTION = 255;

const isSigner = (role: number): boolean => (role & READONLY_SIGNER) !== 0;
const isWritable = (role: number): boolean => (role & WRITABLE) !== 0;

// Address ordering comparator matches @solana/addresses getAddressComparator.
const addressComparator = new Intl.Collator('en', {
  caseFirst: 'lower',
  ignorePunctuation: false,
  localeMatcher: 'best fit',
  numeric: false,
  sensitivity: 'variant',
  usage: 'sort',
}).compare;

type AccountMeta = { address: string; role: number };

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

/**
 * Strip ComputeBudget instructions (SetComputeUnitLimit / SetComputeUnitPrice)
 * and fold their values into the transaction config when still unset.
 */
function stripComputeBudgetInstructions(
  instructions: TransactionInstruction[],
  transactionConfig: TransactionConfig
): { instructions: TransactionInstruction[]; config: TransactionConfig } {
  const filtered: TransactionInstruction[] = [];
  const config: TransactionConfig = { ...transactionConfig };

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

/**
 * Collect + order accounts exactly as @solana/transaction-messages does:
 * fee payer first (WRITABLE_SIGNER), then static accounts sorted by
 * (isSigner, isWritable, base58 collator). Duplicate addresses merge roles.
 * Enforces the kit's invoked-program rules.
 */
function collectOrderedAccounts(feePayer: PublicKey, instructions: TransactionInstruction[]): AccountMeta[] {
  const feePayerAddress = feePayer.toBase58();
  const map = new Map<string, number>();
  const metaByAddress = new Map<string, AccountMeta>();
  const invokedPrograms = new Set<string>();

  map.set(feePayerAddress, WRITABLE_SIGNER);
  metaByAddress.set(feePayerAddress, { address: feePayerAddress, role: WRITABLE_SIGNER });

  const upsert = (address: string, role: number, isInvokedProgram: boolean) => {
    if (address === feePayerAddress) {
      if (isInvokedProgram) {
        throw new BuildTransactionError(`Invoked program ${address} cannot pay fees`);
      }
    }
    if (isInvokedProgram && isWritable(role)) {
      throw new BuildTransactionError(`Invoked program ${address} must not be writable`);
    }
    const current = map.get(address);
    if (current !== undefined) {
      const merged = (current | role) as number;
      if (isInvokedProgram && isWritable(merged)) {
        throw new BuildTransactionError(`Invoked program ${address} must not be writable`);
      }
      map.set(address, merged);
      metaByAddress.set(address, { address, role: merged });
    } else {
      map.set(address, role);
      metaByAddress.set(address, { address, role });
    }
  };

  for (const instruction of instructions) {
    const programAddress = instruction.programId.toBase58();
    invokedPrograms.add(programAddress);
    upsert(programAddress, READONLY, true);
    for (const key of instruction.keys) {
      upsert(
        key.pubkey.toBase58(),
        key.isSigner ? (key.isWritable ? WRITABLE_SIGNER : READONLY_SIGNER) : key.isWritable ? WRITABLE : READONLY,
        invokedPrograms.has(key.pubkey.toBase58())
      );
    }
  }

  const ordered = [...metaByAddress.values()];
  ordered.sort((a, b) => {
    const aFee = a.address === feePayerAddress ? -1 : 0;
    const bFee = b.address === feePayerAddress ? -1 : 0;
    if (aFee !== bFee) return aFee - bFee;
    const aSigner = isSigner(a.role) ? -1 : 0;
    const bSigner = isSigner(b.role) ? -1 : 0;
    if (aSigner !== bSigner) return aSigner - bSigner;
    const aWritable = isWritable(a.role) ? -1 : 0;
    const bWritable = isWritable(b.role) ? -1 : 0;
    if (aWritable !== bWritable) return aWritable - bWritable;
    return addressComparator(a.address, b.address);
  });

  return ordered;
}

function computeHeader(orderedAccounts: AccountMeta[]): V1MessageHeader {
  let numSignerAccounts = 0;
  let numReadonlySignerAccounts = 0;
  let numReadonlyNonSignerAccounts = 0;
  for (const account of orderedAccounts) {
    if (isSigner(account.role)) {
      numSignerAccounts++;
      if (!isWritable(account.role)) {
        numReadonlySignerAccounts++;
      }
    } else if (!isWritable(account.role)) {
      numReadonlyNonSignerAccounts++;
    }
  }
  return { numSignerAccounts, numReadonlySignerAccounts, numReadonlyNonSignerAccounts };
}

function compileInstructions(
  instructions: TransactionInstruction[],
  orderedAccounts: AccountMeta[]
): CompiledInstruction[] {
  const accountIndex = new Map<string, number>();
  orderedAccounts.forEach((account, index) => accountIndex.set(account.address, index));

  return instructions.map((instruction) => ({
    programAddressIndex: accountIndex.get(instruction.programId.toBase58())!,
    accountIndices: instruction.keys.map((k) => accountIndex.get(k.pubkey.toBase58())!),
    data: instruction.data ?? new Uint8Array(),
  }));
}

/**
 * Compile a Solana transaction message and return its wire bytes.
 *
 * Version-aware: only `version: 1` (SIMD-0296/0385) is implemented; other
 * versions throw a clear unsupported-version error until they are added.
 *
 * @param args - version, instructions, fee payer, recent blockhash, and config
 * @returns the serialized message bytes (v1 starts with the 0x81 version prefix)
 */
export function compileTransactionMessage(args: {
  version: TransactionVersion;
  instructions: TransactionInstruction[];
  feePayer: PublicKey;
  recentBlockhash: string;
  transactionConfig: TransactionConfig;
}): Uint8Array {
  const { version, instructions, feePayer, recentBlockhash, transactionConfig } = args;

  if (version !== 1) {
    throw new BuildTransactionError(`Unsupported transaction version: ${version}. Only version 1 is implemented.`);
  }
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

  const orderedAccounts = collectOrderedAccounts(feePayer, filteredInstructions);
  if (orderedAccounts.length > MAX_ACCOUNTS) {
    throw new BuildTransactionError(
      `Too many accounts in v1 transaction: ${orderedAccounts.length} (max ${MAX_ACCOUNTS})`
    );
  }
  const numSigners = orderedAccounts.filter((a) => isSigner(a.role)).length;
  if (numSigners > MAX_SIGNERS) {
    throw new BuildTransactionError(`Too many signers in v1 transaction: ${numSigners} (max ${MAX_SIGNERS})`);
  }
  if (filteredInstructions.length > MAX_INSTRUCTIONS) {
    throw new BuildTransactionError(
      `Too many instructions in v1 transaction: ${filteredInstructions.length} (max ${MAX_INSTRUCTIONS})`
    );
  }
  for (let i = 0; i < filteredInstructions.length; i++) {
    if (filteredInstructions[i].keys.length > MAX_ACCOUNTS_PER_INSTRUCTION) {
      throw new BuildTransactionError(
        `Too many accounts in instruction ${i}: ${filteredInstructions[i].keys.length} (max ${MAX_ACCOUNTS_PER_INSTRUCTION})`
      );
    }
  }

  const header = computeHeader(orderedAccounts);
  const { mask, values } = encodeConfigMaskAndValues(config);
  const compiledInstructions = compileInstructions(filteredInstructions, orderedAccounts);

  return encodeV1Message({
    header,
    configMask: mask,
    configValues: values,
    blockhash: recentBlockhash,
    staticAccounts: orderedAccounts.map((account) => account.address),
    compiledInstructions,
  });
}
