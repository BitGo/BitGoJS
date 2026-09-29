import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';
import { BuildTransactionError } from '@bitgo/sdk-core';
import {
  encodeConfigMaskAndValues,
  ConfigValue,
  PRIORITY_FEE_BITS,
  COMPUTE_UNIT_LIMIT_BIT,
  LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT,
  HEAP_SIZE_BIT,
} from './config';
import { encodeInstructions, CompiledInstruction } from './instruction';

/**
 * v1 (SIMD-0296/0385) transaction message wire encoder.
 *
 * Layout: [version: 0x81][header: 3 x u8][configMask: u32 LE][blockhash: 32]
 *   [numInstructions: u8][numStaticAccounts: u8]
 *   [staticAccounts: 32 x n][configValues: per mask]
 *   [instructionHeaders: 4 x n][instructionPayloads: per instruction]
 */

function pushU8(buf: number[], v: number) {
  buf.push(v & 0xff);
}
function pushU32LE(buf: number[], v: number) {
  buf.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
}
function pushU64LE(buf: number[], v: bigint) {
  for (let i = 0; i < 8; i++) {
    buf.push(Number((v >> BigInt(8 * i)) & 0xffn));
  }
}

export type V1MessageHeader = {
  numSignerAccounts: number;
  numReadonlySignerAccounts: number;
  numReadonlyNonSignerAccounts: number;
};

export function encodeV1Message(args: {
  header: V1MessageHeader;
  configMask: number;
  configValues: ConfigValue[];
  blockhash: string;
  staticAccounts: string[];
  compiledInstructions: CompiledInstruction[];
}): Uint8Array {
  const { header, configMask, configValues, blockhash, staticAccounts, compiledInstructions } = args;

  let blockhashBytes: Uint8Array;
  try {
    blockhashBytes = bs58.decode(blockhash);
  } catch {
    throw new BuildTransactionError('Invalid recent blockhash');
  }
  if (blockhashBytes.length !== 32) {
    throw new BuildTransactionError('Invalid recent blockhash');
  }

  const buf: number[] = [];
  pushU8(buf, 0x81); // version
  pushU8(buf, header.numSignerAccounts);
  pushU8(buf, header.numReadonlySignerAccounts);
  pushU8(buf, header.numReadonlyNonSignerAccounts);
  pushU32LE(buf, configMask);
  for (const b of blockhashBytes) pushU8(buf, b);
  pushU8(buf, compiledInstructions.length);
  pushU8(buf, staticAccounts.length);
  for (const account of staticAccounts) {
    for (const b of new PublicKey(account).toBytes()) pushU8(buf, b);
  }
  for (const value of configValues) {
    if (value.kind === 'u64') pushU64LE(buf, value.value as bigint);
    else pushU32LE(buf, value.value as number);
  }
  encodeInstructions(buf, compiledInstructions);
  return new Uint8Array(buf);
}

export { encodeConfigMaskAndValues };

const V1_VERSION_PREFIX = 0x81;
const KNOWN_CONFIG_MASK =
  PRIORITY_FEE_BITS | COMPUTE_UNIT_LIMIT_BIT | LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT | HEAP_SIZE_BIT;
const MAX_ACCOUNTS = 64;
const MAX_INSTRUCTIONS = 64;
const MAX_ACCOUNTS_PER_INSTRUCTION = 255;
const STATIC_ACCOUNT_BYTES = 32;

export type V1DecodedMessage = {
  header: V1MessageHeader;
  configMask: number;
  configValues: ConfigValue[];
  blockhash: string;
  staticAccounts: string[];
  compiledInstructions: CompiledInstruction[];
  byteLength: number;
};

function readU8(b: Uint8Array, o: number): number {
  return b[o];
}
function readU16LE(b: Uint8Array, o: number): number {
  return b[o] | (b[o + 1] << 8);
}
function readU32LE(b: Uint8Array, o: number): number {
  return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
}
function readU64LE(b: Uint8Array, o: number): bigint {
  let v = 0n;
  for (let i = 0; i < 8; i++) {
    v |= BigInt(b[o + i]) << BigInt(8 * i);
  }
  return v;
}

function ensureAvailable(b: Uint8Array, off: number, size: number): void {
  if (off + size > b.length) {
    throw new BuildTransactionError('Invalid v1 message: truncated');
  }
}

export function decodeV1Message(bytes: Uint8Array): V1DecodedMessage {
  if (!bytes || bytes.length < 42) {
    throw new BuildTransactionError('Invalid v1 message: too short');
  }
  let off = 0;
  if (bytes[off++] !== V1_VERSION_PREFIX) {
    throw new BuildTransactionError(`Invalid v1 version prefix: 0x${bytes[0].toString(16)}`);
  }
  const numSignerAccounts = readU8(bytes, off++);
  const numReadonlySignerAccounts = readU8(bytes, off++);
  const numReadonlyNonSignerAccounts = readU8(bytes, off++);
  const configMask = readU32LE(bytes, off);
  off += 4;
  if ((configMask & ~KNOWN_CONFIG_MASK) !== 0) {
    throw new BuildTransactionError(`Unknown config mask bits: ${(configMask & ~KNOWN_CONFIG_MASK).toString(2)}`);
  }
  const blockhash = bs58.encode(bytes.slice(off, off + STATIC_ACCOUNT_BYTES));
  off += STATIC_ACCOUNT_BYTES;
  const numInstructions = readU8(bytes, off++);
  const numStaticAccounts = readU8(bytes, off++);
  if (numStaticAccounts > MAX_ACCOUNTS) {
    throw new BuildTransactionError('Invalid v1 message: too many static accounts');
  }
  if (numInstructions > MAX_INSTRUCTIONS) {
    throw new BuildTransactionError('Invalid v1 message: too many instructions');
  }
  if (numReadonlySignerAccounts > numSignerAccounts) {
    throw new BuildTransactionError('Invalid v1 header: readonly signers exceed signers');
  }
  if (numSignerAccounts + numReadonlyNonSignerAccounts > numStaticAccounts) {
    throw new BuildTransactionError('Invalid v1 header: signers + readonly non-signers exceed static accounts');
  }

  const staticAccounts: string[] = [];
  for (let i = 0; i < numStaticAccounts; i++) {
    ensureAvailable(bytes, off, STATIC_ACCOUNT_BYTES);
    staticAccounts.push(bs58.encode(bytes.slice(off, off + STATIC_ACCOUNT_BYTES)));
    off += STATIC_ACCOUNT_BYTES;
  }

  const configValues: ConfigValue[] = [];
  if (configMask & PRIORITY_FEE_BITS) {
    ensureAvailable(bytes, off, 8);
    configValues.push({ kind: 'u64', value: readU64LE(bytes, off) });
    off += 8;
  }
  if (configMask & COMPUTE_UNIT_LIMIT_BIT) {
    ensureAvailable(bytes, off, 4);
    configValues.push({ kind: 'u32', value: readU32LE(bytes, off) });
    off += 4;
  }
  if (configMask & LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT) {
    ensureAvailable(bytes, off, 4);
    configValues.push({ kind: 'u32', value: readU32LE(bytes, off) });
    off += 4;
  }
  if (configMask & HEAP_SIZE_BIT) {
    ensureAvailable(bytes, off, 4);
    configValues.push({ kind: 'u32', value: readU32LE(bytes, off) });
    off += 4;
  }

  const headers: Array<{ programAddressIndex: number; accountCount: number; dataLength: number }> = [];
  for (let i = 0; i < numInstructions; i++) {
    ensureAvailable(bytes, off, 4);
    const programAddressIndex = readU8(bytes, off++);
    const accountCount = readU8(bytes, off++);
    const dataLength = readU16LE(bytes, off);
    off += 2;
    if (programAddressIndex >= numStaticAccounts) {
      throw new BuildTransactionError('Invalid v1 instruction: program index out of range');
    }
    if (accountCount > MAX_ACCOUNTS_PER_INSTRUCTION) {
      throw new BuildTransactionError('Invalid v1 instruction: too many accounts');
    }
    headers.push({ programAddressIndex, accountCount, dataLength });
  }

  const compiledInstructions: CompiledInstruction[] = [];
  for (const h of headers) {
    ensureAvailable(bytes, off, h.accountCount);
    const accountIndices: number[] = [];
    for (let i = 0; i < h.accountCount; i++) {
      const idx = readU8(bytes, off++);
      if (idx >= numStaticAccounts) {
        throw new BuildTransactionError('Invalid v1 instruction: account index out of range');
      }
      accountIndices.push(idx);
    }
    ensureAvailable(bytes, off, h.dataLength);
    const data = bytes.slice(off, off + h.dataLength);
    off += h.dataLength;
    compiledInstructions.push({ programAddressIndex: h.programAddressIndex, accountIndices, data });
  }

  return {
    header: { numSignerAccounts, numReadonlySignerAccounts, numReadonlyNonSignerAccounts },
    configMask,
    configValues,
    blockhash,
    staticAccounts,
    compiledInstructions,
    byteLength: off,
  };
}
