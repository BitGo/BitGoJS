import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
import type { Descriptor } from '@bitgo/wasm-miniscript';
import { DescriptorMap } from '@bitgo/utxo-core/descriptor';

import { UtxoCoinSpecific, VerifyAddressOptions } from '../abstractUtxoCoin';

class DescriptorAddressMismatchError extends Error {
  constructor(descriptor: Descriptor, index: number, derivedAddress: string, expectedAddress: string) {
    super(
      `Address mismatch for descriptor ${descriptor.toString()} at index ${index}: ${derivedAddress} !== ${expectedAddress}`
    );
  }
}

export function assertDescriptorWalletAddress(
  network: utxolib.Network,
  params: VerifyAddressOptions<UtxoCoinSpecific>,
  descriptors: DescriptorMap
): void {
  assert(params.coinSpecific);
  assert('descriptorName' in params.coinSpecific);
  assert('descriptorChecksum' in params.coinSpecific);
  const { descriptorName, descriptorChecksum } = params.coinSpecific;
  const descriptor = descriptors.get(params.coinSpecific.descriptorName);
  if (!descriptor) {
    throw new Error(`Descriptor ${descriptorName} not found`);
  }
  const checksum = descriptor.toString().slice(-8);
  if (checksum !== descriptorChecksum) {
    throw new Error(
      `Descriptor checksum mismatch for descriptor name=${descriptorName}: ${checksum} !== ${descriptorChecksum}`
    );
  }
  const derivedScript = Buffer.from(descriptor.atDerivationIndex(params.index).scriptPubkey());
  const derivedAddress = utxolib.address.fromOutputScript(derivedScript, network);
  if (params.address !== derivedAddress) {
    throw new DescriptorAddressMismatchError(descriptor, params.index, derivedAddress, params.address);
  }
}
