import { createHash } from 'crypto';

import { Psbt, type Descriptor, type PsbtInputKeyValue } from '@bitgo/wasm-utxo';

import { Pox5DescriptorInfo, parsePox5LockupDescriptor } from './parseDescriptor';

const SHA256_INPUT_KEY = 'PSBT_IN_SHA256';

type Sha256InputKeyValue = Extract<PsbtInputKeyValue, { type: 'known' }>;

function isSha256InputKeyValue(keyValue: PsbtInputKeyValue): keyValue is Sha256InputKeyValue {
  return keyValue.type === 'known' && keyValue.key === SHA256_INPUT_KEY;
}

/**
 * Read and validate the unique PoX-5 principal preimage from a native PSBT input.
 * The PSBT_IN_SHA256 key data is the digest and its value is the preimage.
 */
export function getPox5PrincipalPreimage(psbt: Psbt, inputIndex: number): Buffer {
  const records = psbt.getInputKeyValues(inputIndex).filter(isSha256InputKeyValue);
  if (records.length !== 1) {
    throw new Error(`expected exactly one ${SHA256_INPUT_KEY} record, found ${records.length}`);
  }

  const [record] = records;
  if (record.keyData.length !== 32) {
    throw new Error(`${SHA256_INPUT_KEY} digest must be 32 bytes`);
  }
  if (record.value.length !== 32) {
    throw new Error(`${SHA256_INPUT_KEY} preimage must be 32 bytes`);
  }

  const preimage = Buffer.from(record.value);
  const digest = createHash('sha256').update(preimage).digest();
  if (!digest.equals(Buffer.from(record.keyData))) {
    throw new Error(`${SHA256_INPUT_KEY} digest does not match its preimage`);
  }
  return preimage;
}

function isPox5DescriptorInfo(value: unknown): value is Pox5DescriptorInfo {
  return (
    value !== null &&
    typeof value === 'object' &&
    'stakerCommitment' in value &&
    Buffer.isBuffer(value.stakerCommitment)
  );
}

function getPox5DescriptorInfo(
  descriptor: Pox5DescriptorInfo | Descriptor | import('@bitgo/wasm-utxo').ast.DescriptorNode
): Pox5DescriptorInfo {
  if (isPox5DescriptorInfo(descriptor)) {
    return descriptor;
  }
  const info = parsePox5LockupDescriptor(descriptor);
  if (!info) {
    throw new Error('descriptor is not a canonical PoX-5 lockup descriptor');
  }
  return info;
}

/** Verify that a principal preimage is committed by a canonical PoX-5 descriptor. */
export function assertPox5PrincipalPreimage(
  descriptor: Pox5DescriptorInfo | Descriptor | import('@bitgo/wasm-utxo').ast.DescriptorNode,
  principalPreimage: Uint8Array
): void {
  if (principalPreimage.length !== 32) {
    throw new Error('principalPreimage must be 32 bytes');
  }
  const info = getPox5DescriptorInfo(descriptor);
  const digest = createHash('sha256').update(principalPreimage).digest();
  if (!digest.equals(info.stakerCommitment)) {
    throw new Error('principalPreimage does not match the descriptor stakerCommitment');
  }
}

/** Alias for callers that prefer validation terminology. */
export function validatePox5PrincipalPreimage(
  descriptor: Pox5DescriptorInfo | Descriptor | import('@bitgo/wasm-utxo').ast.DescriptorNode,
  principalPreimage: Uint8Array
): void {
  assertPox5PrincipalPreimage(descriptor, principalPreimage);
}
