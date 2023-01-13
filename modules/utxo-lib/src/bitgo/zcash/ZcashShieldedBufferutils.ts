/**
 * Zcash shielded transaction (de)serializers
 * References:
 *  - https://github.com/zcash/zcash/blob/v4.5.1/src/primitives/transaction.h#L834
 */
import { BufferReader } from 'bitcoinjs-lib/src/bufferutils';

// https://github.com/zcash/zcash/blob/3f09cfa00a3c90336580a127e0096d99e25a38d6/src/primitives/transaction.h#L124
export interface SpendDescriptionV5 {
  cv: number;
  anchor: number;
  nullifier: number;
  rk: number;
  // https://github.com/zcash/zcash/blob/49ffee3f20b972dc3aa75e422c67523251cf088b/src/zcash/Proof.hpp#L205
  zkproof: Buffer; // 24 bytes
  spendAuthSig: Buffer; // 64 char string
}

// https://github.com/zcash/zcash/blob/3f09cfa00a3c90336580a127e0096d99e25a38d6/src/primitives/transaction.h#L177
export interface OutputDescriptionV5 {
  cv: number;
  cmu: number;
  ephemeralKey: number;
  // Cypher text sizes
  // https://github.com/zcash/zcash/blob/696a49b30dd6c671afec6fd4deae1be70493b7d0/src/zcash/Zcash.h#L28
  encCiphertext: Buffer; // 580 chars
  outCiphertext: Buffer; // 80 chars
}

export /**
 * Read in the spend descriptions
 * If `vinLen` is 0, this means that there are no hidden inputs
 * Reference: https://github.com/zcash/zcash/blob/3f09cfa00a3c90336580a127e0096d99e25a38d6/src/primitives/transaction.h#L124
 * @param bufferReader
 * @returns SpendDescriptionV5[]
 */
function readSpendDescriptionsV5(bufferReader: BufferReader): SpendDescriptionV5[] {
  const spendDescriptions: SpendDescriptionV5[] = [];
  const vinLen = bufferReader.readVarInt();
  for (let i = 0; i < vinLen; i++) {
    spendDescriptions.push({
      cv: bufferReader.readUInt32(),
      anchor: bufferReader.readUInt32(),
      nullifier: bufferReader.readUInt32(),
      rk: bufferReader.readUInt32(),
      zkproof: bufferReader.readSlice(24),
      spendAuthSig: bufferReader.readSlice(64),
    });
  }
  return spendDescriptions;
}

/**
 * Read in the output descriptions
 * If `voutLen` is 0, this means that there are no hidden outputs
 * Reference: https://github.com/zcash/zcash/blob/3f09cfa00a3c90336580a127e0096d99e25a38d6/src/primitives/transaction.h#L177
 * @param bufferReader
 * @returns OutputDescriptionV5[]
 */
export function readOutputDescriptionV5(bufferReader: BufferReader): OutputDescriptionV5[] {
  const outputDescriptions: OutputDescriptionV5[] = [];
  const voutLen = bufferReader.readVarInt();
  for (let i = 0; i < voutLen; i++) {
    outputDescriptions.push({
      cv: bufferReader.readUInt32(),
      cmu: bufferReader.readUInt32(),
      ephemeralKey: bufferReader.readUInt32(),
      encCiphertext: bufferReader.readSlice(580),
      outCiphertext: bufferReader.readSlice(80),
    });
  }
  return outputDescriptions;
}
