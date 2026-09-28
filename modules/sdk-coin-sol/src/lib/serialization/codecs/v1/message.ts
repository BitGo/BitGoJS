import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { encodeConfigMaskAndValues, ConfigValue } from './config';
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
